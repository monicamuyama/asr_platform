const USER_ID_KEY = 'isdr_user_id'

export function getSessionUserId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(USER_ID_KEY)
}

export function setSessionUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

export function clearSession(): void {
  localStorage.removeItem(USER_ID_KEY)
}
