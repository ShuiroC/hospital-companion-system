import request from './request'

export function login(data) {
  return request.post('/auth/login', data)
}

export function register(data) {
  return request.post('/auth/register', data)
}

export function registerPatient(data) {
  return request.post('/auth/register/patient', data)
}

export function registerCompanion(data) {
  return request.post('/auth/register/companion', data)
}

export function updateProfileUsername(data) {
  return request.put('/auth/profile/username', data)
}

export function updateProfilePhone(data) {
  return request.put('/auth/profile/phone', data)
}
