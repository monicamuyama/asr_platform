self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

async function notifyClients() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of clients) {
    client.postMessage({ type: 'UPLOAD_SYNC_REQUESTED' })
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'submission-upload-sync') {
    event.waitUntil(notifyClients())
  }
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REQUEST_UPLOAD_SYNC') {
    event.waitUntil(notifyClients())
  }
})
