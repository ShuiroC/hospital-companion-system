<template>
  <div class="grid" v-loading="loading">
    <el-card><h3>订单总数</h3><p>{{ orderStore.totalCount }}</p></el-card>
    <el-card><h3>进行中订单</h3><p>{{ orderStore.activeCount }}</p></el-card>
    <el-card><h3>完成订单</h3><p>{{ orderStore.completedCount }}</p></el-card>
    <el-card><h3>累计完成收入</h3><p>¥{{ orderStore.todayIncome }}</p></el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const orderStore = useOrderStore()
const loading = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    await orderStore.fetchOrders()
  } catch (error) {
    ElMessage.error(error.message || '加载统计失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 16px;
}
h3 { margin: 0 0 8px; color: #4b5563; }
p { margin: 0; font-size: 24px; font-weight: 700; color: #111827; }
@media (max-width: 960px) {
  .grid { grid-template-columns: repeat(2, minmax(160px, 1fr)); }
}
</style>
