const USER_ID_KEY = 'isdr_user_id'
const TOKEN_KEY = 'isdr_access_token'
const TOKEN_TYPE_KEY = 'isdr_token_type'
const TOKEN_EXPIRES_AT_KEY = 'isdr_token_expires_at'

export function getSessionUserId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(USER_ID_KEY)
}

export function setSessionUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    return null
  }

  // Check if token has expired
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY)
  if (expiresAt) {
    const expiryTime = new Date(expiresAt).getTime()
    if (expiryTime < Date.now()) {
      // Token expired, clear it
      clearSession()
      return null
    }
  }

  return token
}

export function setSessionToken(
  accessToken: string,
  tokenType: string = 'bearer',
  expiresAt?: string,
): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(TOKEN_TYPE_KEY, tokenType)
  if (expiresAt) {
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt)
  }
}

export function getAuthorizationHeader(): { Authorization: string } | {} {
  const token = getSessionToken()
  if (!token) {
    return {}
  }
  const tokenType = localStorage.getItem(TOKEN_TYPE_KEY) || 'bearer'
  return {
    Authorization: `${tokenType} ${token}`,
  }
}

export function clearSession(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
}
