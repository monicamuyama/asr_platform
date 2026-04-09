import { createSubmission, type SubmissionCreateRequest, type SubmissionResponse } from '@/lib/api'

const DB_NAME = 'isdr-offline-queue'
const DB_VERSION = 1
const STORE_NAME = 'submission_uploads'

export type QueuedSubmission = {
  id: string
  createdAt: string
  payload: SubmissionCreateRequest
  attempts: number
  lastError?: string
}

function supportsIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function queueSubmission(payload: SubmissionCreateRequest): Promise<QueuedSubmission | null> {
  if (!supportsIndexedDb()) {
    return null
  }

  const cid = payload.cid ?? crypto.randomUUID()
  const item: QueuedSubmission = {
    id: cid,
    createdAt: new Date().toISOString(),
    payload: {
      ...payload,
      cid,
    },
    attempts: 0,
  }

  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  return item
}

export async function listQueuedSubmissions(): Promise<QueuedSubmission[]> {
  if (!supportsIndexedDb()) {
    return []
  }

  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as QueuedSubmission[]) ?? [])
    request.onerror = () => reject(request.error)
  })
}

export async function removeQueuedSubmission(id: string): Promise<void> {
  if (!supportsIndexedDb()) {
    return
  }

  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updateQueuedSubmission(item: QueuedSubmission): Promise<void> {
  if (!supportsIndexedDb()) {
    return
  }

  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function flushQueuedSubmissions(): Promise<{ uploaded: number; failed: number }> {
  const queue = (await listQueuedSubmissions()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const challengeByPairGroup = new Map<string, string>()
  let uploaded = 0
  let failed = 0

  for (const item of queue) {
    try {
      const payload: SubmissionCreateRequest = {
        ...item.payload,
        cid: item.payload.cid ?? item.id,
      }

      if (
        payload.category === 'riddle'
        && payload.riddle_part === 'reveal'
        && !payload.challenge_submission_id
        && payload.pair_group_id
      ) {
        const resolvedChallengeId = challengeByPairGroup.get(payload.pair_group_id)
        if (resolvedChallengeId) {
          payload.challenge_submission_id = resolvedChallengeId
        }
      }

      const created: SubmissionResponse = await createSubmission(payload)
      if (
        payload.category === 'riddle'
        && payload.riddle_part === 'challenge'
        && payload.pair_group_id
      ) {
        challengeByPairGroup.set(payload.pair_group_id, created.id)
      }

      await removeQueuedSubmission(item.id)
      uploaded += 1
    } catch (err) {
      failed += 1
      await updateQueuedSubmission({
        ...item,
        attempts: item.attempts + 1,
        lastError: err instanceof Error ? err.message : 'Submission retry failed',
      })
    }
  }

  return { uploaded, failed }
}
