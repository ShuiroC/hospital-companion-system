<template>
  <div class="page" v-loading="loading">
    <div class="stats">
      <el-card><h4>已完成单量</h4><p>{{ completedOrders.length }}</p></el-card>
      <el-card><h4>累计收入</h4><p>¥{{ totalIncome.toFixed(2) }}</p></el-card>
      <el-card><h4>单均收入</h4><p>¥{{ avgIncome.toFixed(2) }}</p></el-card>
    </div>

    <el-card>
      <template #header>
        <div class="row">
          <span>收入统计页</span>
          <el-button @click="loadOrders">刷新</el-button>
        </div>
      </template>
      <el-table :data="completedOrders" stripe>
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="hospital" label="医院" min-width="150" />
        <el-table-column prop="serviceType" label="服务类型" min-width="120" />
        <el-table-column prop="amount" label="收入金额" min-width="100" />
        <el-table-column prop="createTime" label="完成时间" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const orderStore = useOrderStore()
const loading = ref(false)

const completedOrders = computed(() => orderStore.orders.filter((item) => item.status === 'COMPLETED'))
const totalIncome = computed(() => completedOrders.value.reduce((sum, item) => sum + Number(item.amount || 0), 0))
const avgIncome = computed(() => (completedOrders.value.length ? totalIncome.value / completedOrders.value.length : 0))

onMounted(loadOrders)

async function loadOrders() {
  try {
    loading.value = true
    await orderStore.fetchOrders()
  } catch (error) {
    ElMessage.error(error.message || '加载收入数据失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.stats {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}
h4 { margin: 0; color: #4b5563; }
p { margin: 8px 0 0; font-size: 24px; font-weight: 700; }
.row { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 900px) {
  .stats { grid-template-columns: 1fr; }
}
</style>
