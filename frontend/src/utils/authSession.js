export const ROLE_PATIENT = 'patient'
export const ROLE_COMPANION = 'companion'
export const ACTIVE_ROLE_KEY = 'county_companion_active_role'

const TOKEN_KEYS = {
  [ROLE_PATIENT]: 'county_companion_token_patient',
  [ROLE_COMPANION]: 'county_companion_token_companion'
}

const PHONE_KEYS = {
  [ROLE_PATIENT]: 'county_companion_phone_patient',
  [ROLE_COMPANION]: 'county_companion_phone_companion'
}

export function normalizeRole(role) {
  return role === ROLE_COMPANION ? ROLE_COMPANION : ROLE_PATIENT
}

export function getTokenKey(role) {
  return TOKEN_KEYS[normalizeRole(role)]
}

export function getPhoneKey(role) {
  return PHONE_KEYS[normalizeRole(role)]
}

export function getTokenByRole(role) {
  return localStorage.getItem(getTokenKey(role)) || ''
}

export function getPhoneByRole(role) {
  return localStorage.getItem(getPhoneKey(role)) || ''
}

export function setActiveRole(role) {
  localStorage.setItem(ACTIVE_ROLE_KEY, normalizeRole(role))
}

export function getActiveRole() {
  return normalizeRole(localStorage.getItem(ACTIVE_ROLE_KEY) || ROLE_PATIENT)
}

export function getRoleFromPath(pathname = '') {
  if (pathname.startsWith('/companion')) return ROLE_COMPANION
  if (pathname.startsWith('/patient')) return ROLE_PATIENT
  return null
}
