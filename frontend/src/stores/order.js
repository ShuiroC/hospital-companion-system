import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'
import {
  acceptOrder,
  advanceOrderStatus,
  cancelOrder,
  createOrder,
  getOrderDetail,
  getOrderQuery,
  getOrders,
  payOrder
} from '../api/order'

export const ORDER_STATUS = {
  UNPAID: '待支付',
  WAITING_ACCEPT: '待接单',
  ACCEPTED: '已接单',
  IN_SERVICE: '服务中',
  TO_CONFIRM: '待确认',
  COMPLETED: '已完成',
  CANCELED: '已取消'
}

export const STATUS_FLOW = {
  UNPAID: 'WAITING_ACCEPT',
  WAITING_ACCEPT: 'ACCEPTED',
  ACCEPTED: 'IN_SERVICE',
  IN_SERVICE: 'TO_CONFIRM',
  TO_CONFIRM: 'COMPLETED'
}

export const useOrderStore = defineStore('order', () => {
  const authStore = useAuthStore()
  const orders = ref([])
  const currentOrder = ref(null)

  const ordersTotal = ref(0)
  const ordersPage = ref(1)
  const ordersPageSize = ref(10)

  const totalCount = computed(() => orders.value.length)
  const completedCount = computed(() => orders.value.filter((item) => item.status === 'COMPLETED').length)
  const activeCount = computed(() => orders.value.filter((item) => !['COMPLETED', 'CANCELED'].includes(item.status)).length)
  const todayIncome = computed(() => orders.value
    .filter((item) => item.status === 'COMPLETED')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0))

  function buildRoleParams({ required = false } = {}) {
    if (authStore.role === 'patient') {
      if (!authStore.phone) {
        if (required) {
          throw new Error('登录状态异常，请重新登录患者账号')
        }
        return {}
      }
      return { patientPhone: authStore.phone }
    }

    if (authStore.role === 'companion') {
      if (!authStore.phone) {
        if (required) {
          throw new Error('登录状态异常，请重新登录陪诊员账号')
        }
        return {}
      }
      return { companionPhone: authStore.phone }
    }

    if (required) {
      throw new Error('登录状态异常，请重新登录')
    }
    return {}
  }

  async function fetchOrders(options = {}) {
    const roleParams = buildRoleParams({ required: true })
    const {
      paged = false,
      orderNo,
      hospital,
      username,
      status,
      page = 1,
      pageSize = 10
    } = options

    if (paged) {
      const { data } = await getOrderQuery({
        ...roleParams,
        orderNo,
        hospital,
        username,
        status,
        page,
        pageSize
      })
      if (data.code !== 0) {
        throw new Error(data.message || '获取订单失败')
      }

      const pageData = data.data || {}
      orders.value = pageData.list || []
      ordersTotal.value = Number(pageData.total || 0)
      ordersPage.value = Number(pageData.page || page)
      ordersPageSize.value = Number(pageData.pageSize || pageSize)
      return pageData
    }

    const { data } = await getOrders(roleParams)
    if (data.code !== 0) {
      throw new Error(data.message || '获取订单失败')
    }

    orders.value = data.data || []
    ordersTotal.value = orders.value.length
    ordersPage.value = 1
    ordersPageSize.value = orders.value.length || 10
    return {
      list: orders.value,
      total: ordersTotal.value,
      page: ordersPage.value,
      pageSize: ordersPageSize.value
    }
  }

  async function fetchWaitingPoolOrders() {
    const { data } = await getOrders()
    if (data.code !== 0) {
      throw new Error(data.message || '获取待接单失败')
    }
    orders.value = data.data
    return orders.value
  }

  async function createNewOrder(payload) {
    if (authStore.role !== 'patient') {
      throw new Error('仅患者账号可以下单')
    }
    const params = buildRoleParams({ required: true })
    const { data } = await createOrder(payload, params)
    if (data.code !== 0) {
      throw new Error(data.message || '创建订单失败')
    }
    currentOrder.value = data.data
    await fetchOrders()
    return data.data
  }

  async function fetchOrderDetail(orderNo) {
    const { data } = await getOrderDetail(orderNo)
    if (data.code !== 0) {
      throw new Error(data.message || '获取订单详情失败')
    }
    currentOrder.value = data.data
    return data.data
  }

  async function nextStep(orderNo) {
    const { data } = await advanceOrderStatus(orderNo)
    if (data.code !== 0) {
      throw new Error(data.message || '推进状态失败')
    }
    currentOrder.value = data.data
    await fetchOrders()
    return data.data
  }

  async function pay(orderNo) {
    const { data } = await payOrder(orderNo)
    if (data.code !== 0) {
      throw new Error(data.message || '支付失败')
    }
    currentOrder.value = data.data
    await fetchOrders()
    return data.data
  }

  async function accept(orderNo) {
    if (authStore.role !== 'companion' || !authStore.phone) {
      throw new Error('当前不是陪诊员登录状态')
    }
    const { data } = await acceptOrder(orderNo, { companionPhone: authStore.phone })
    if (data.code !== 0) {
      throw new Error(data.message || '接单失败')
    }
    currentOrder.value = data.data
    await fetchOrders()
    return data.data
  }

  async function cancel(orderNo) {
    const { data } = await cancelOrder(orderNo)
    if (data.code !== 0) {
      throw new Error(data.message || '取消订单失败')
    }
    currentOrder.value = data.data
    await fetchOrders()
    return data.data
  }

  function findByOrderNo(orderNo) {
    return orders.value.find((item) => item.orderNo === orderNo)
  }

  return {
    ORDER_STATUS,
    STATUS_FLOW,
    orders,
    currentOrder,
    ordersTotal,
    ordersPage,
    ordersPageSize,
    totalCount,
    completedCount,
    activeCount,
    todayIncome,
    fetchOrders,
    fetchWaitingPoolOrders,
    createNewOrder,
    fetchOrderDetail,
    pay,
    accept,
    nextStep,
    cancel,
    findByOrderNo
  }
})
