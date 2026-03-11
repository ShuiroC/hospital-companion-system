import request from './request'

export function getHospitals() {
  return request.get('/hospitals')
}
