<template>
  <el-card>
    <template #header>
      <div class="row">
        <span>接单大厅</span>
        <el-button @click="loadOrders">刷新</el-button>
      </div>
    </template>
    <el-table :data="waitingOrders" stripe v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="hospital" label="医院" min-width="150" />
      <el-table-column prop="serviceType" label="服务类型" min-width="120" />
      <el-table-column prop="reserveTime" label="预约时间" min-width="160" />
      <el-table-column prop="patientName" label="患者" min-width="120" />
      <el-table-column prop="amount" label="金额" min-width="90" />
      <el-table-column label="操作" min-width="120">
        <template #default="scope">
          <el-button link type="primary" @click="accept(scope.row.orderNo)">接单</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && waitingOrders.length === 0" description="暂无待接订单" />
  </el-card>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const orderStore = useOrderStore()
const loading = ref(false)
let pollingTimer = null
const waitingOrders = computed(() => orderStore.orders.filter((item) => item.status === 'WAITING_ACCEPT'))

onMounted(async () => {
  await loadOrders()
  pollingTimer = setInterval(() => {
    loadOrders(true)
  }, 4000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})

async function loadOrders(silent = false) {
  try {
    if (!silent) {
      loading.value = true
    }
    await orderStore.fetchWaitingPoolOrders()
  } catch (error) {
    if (!silent) {
      ElMessage.error(error.message || '加载订单失败')
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

async function accept(orderNo) {
  try {
    await orderStore.accept(orderNo)
    ElMessage.success('接单成功')
  } catch (error) {
    ElMessage.error(error.message || '接单失败')
  }
}
</script>

<style scoped>
.row { display: flex; justify-content: space-between; align-items: center; }
</style>
