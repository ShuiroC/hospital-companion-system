import request from './request'

export function getOrders(params) {
  return request.get('/orders', { params })
}

export function getOrderQuery(params) {
  return request.get('/orders/query', { params })
}

export function getOrderDetail(orderNo) {
  return request.get(`/orders/${orderNo}`)
}

export function createOrder(data, params) {
  return request.post('/orders', data, { params })
}

export function advanceOrderStatus(orderNo) {
  return request.put(`/orders/${orderNo}/next`)
}

export function payOrder(orderNo) {
  return request.put(`/orders/${orderNo}/pay`)
}

export function acceptOrder(orderNo, params) {
  return request.put(`/orders/${orderNo}/accept`, null, { params })
}

export function cancelOrder(orderNo) {
  return request.put(`/orders/${orderNo}/cancel`)
}