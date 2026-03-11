<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="top">
        <span>患者详情</span>
        <el-button @click="$router.push('/companion/records')">返回服务记录</el-button>
      </div>
    </template>

    <el-empty v-if="!order" description="未找到患者信息" />

    <el-descriptions v-else :column="2" border>
      <el-descriptions-item label="患者用户名">{{ order.patientUsername || '-' }}</el-descriptions-item>
      <el-descriptions-item label="患者姓名">{{ order.patientName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="患者手机号">{{ order.patientPhone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单号">{{ order.orderNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="服务类型">{{ order.serviceType || '-' }}</el-descriptions-item>
      <el-descriptions-item label="预约时间">{{ order.reserveTime || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const route = useRoute()
const orderStore = useOrderStore()
const loading = ref(false)
const order = computed(() => orderStore.currentOrder)

onMounted(loadDetail)

async function loadDetail() {
  try {
    loading.value = true
    await orderStore.fetchOrderDetail(route.params.orderNo)
  } catch (error) {
    ElMessage.error(error.message || '加载患者详情失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.top { display: flex; justify-content: space-between; align-items: center; }
</style>
