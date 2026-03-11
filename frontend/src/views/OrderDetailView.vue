<template>
  <el-card class="detail-card" v-loading="loading">
    <template #header>
      <div class="top">
        <span>订单详情 - {{ order?.orderNo || '-' }}</span>
        <el-button size="large" @click="$router.push('/patient/orders')">返回列表</el-button>
      </div>
    </template>

    <el-empty v-if="!order" description="订单不存在" />

    <template v-else>
      <el-descriptions :column="1" border size="large">
        <el-descriptions-item label="医院">{{ order.hospital }}</el-descriptions-item>
        <el-descriptions-item label="服务类型">{{ order.serviceType }}</el-descriptions-item>
        <el-descriptions-item label="患者姓名">{{ order.patientName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.patientPhone }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ order.reserveTime }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ order.amount }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag type="primary">{{ orderStore.ORDER_STATUS[order.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ order.createTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="待支付" />
        <el-step title="待接单" />
        <el-step title="已接单" />
        <el-step title="服务中" />
        <el-step title="待确认" />
        <el-step title="已完成" />
      </el-steps>

      <div class="actions">
        <el-button type="success" size="large" @click="pay" :disabled="order.status !== 'UNPAID'">
          立即支付
        </el-button>
        <el-button type="danger" size="large" plain @click="cancel" :disabled="['COMPLETED', 'CANCELED'].includes(order.status)">
          取消订单
        </el-button>
        <el-button type="primary" size="large" plain @click="$router.push('/patient/review')" :disabled="order.status !== 'COMPLETED'">
          去评价
        </el-button>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '../stores/order'

const route = useRoute()
const orderStore = useOrderStore()
const loading = ref(false)

const order = computed(() => orderStore.currentOrder)
const statusOrder = ['UNPAID', 'WAITING_ACCEPT', 'ACCEPTED', 'IN_SERVICE', 'TO_CONFIRM', 'COMPLETED']
const activeStep = computed(() => {
  if (!order.value) return 0
  if (order.value.status === 'CANCELED') return 0
  return Math.max(statusOrder.indexOf(order.value.status), 0)
})

onMounted(async () => {
  await loadDetail()
})

async function loadDetail() {
  try {
    loading.value = true
    await orderStore.fetchOrderDetail(route.params.orderNo)
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  } finally {
    loading.value = false
  }
}

async function cancel() {
  if (!order.value) return
  try {
    await ElMessageBox.confirm('确定取消这个订单吗？', '确认操作', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '继续保留'
    })
    await orderStore.cancel(order.value.orderNo)
    await loadDetail()
    ElMessage.warning('订单已取消')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '取消订单失败')
    }
  }
}

async function pay() {
  if (!order.value || order.value.status !== 'UNPAID') return
  try {
    await orderStore.pay(order.value.orderNo)
    await loadDetail()
    ElMessage.success('支付成功，订单已进入待接单')
  } catch (error) {
    ElMessage.error(error.message || '支付失败')
  }
}
</script>

<style scoped>
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.top span {
  font-size: 24px;
  font-weight: 700;
}

.actions {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 860px) {
  .actions {
    grid-template-columns: 1fr;
  }
}

:global(body.senior-mode) .top span {
  font-size: 28px;
}
</style>
