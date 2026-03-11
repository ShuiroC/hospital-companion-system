import axios from 'axios'
import { getActiveRole, getRoleFromPath, getTokenByRole } from '../utils/authSession'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const roleFromPath = getRoleFromPath(window.location.pathname)
  const token = getTokenByRole(roleFromPath || getActiveRole())
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default request
