<template>
  <div class="page">
    <el-card>
      <template #header>提现页</template>
      <el-form inline>
        <el-form-item label="可提现余额">
          <el-tag type="success">¥{{ availableBalance.toFixed(2) }}</el-tag>
        </el-form-item>
        <el-form-item label="提现金额">
          <el-input-number v-model="amount" :min="1" :max="Math.max(1, Number(availableBalance.toFixed(2)))" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitWithdraw">申请提现</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>提现记录</template>
      <el-table :data="records" stripe>
        <el-table-column prop="id" label="流水号" min-width="120" />
        <el-table-column prop="amount" label="金额" min-width="100" />
        <el-table-column prop="time" label="申请时间" min-width="180" />
        <el-table-column prop="status" label="状态" min-width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const RECORD_KEY = 'county_companion_withdraw_records'
const orderStore = useOrderStore()
const amount = ref(100)
const records = ref(loadRecords())

const totalIncome = computed(() =>
  orderStore.orders
    .filter((item) => item.status === 'COMPLETED')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
)

const totalWithdrawn = computed(() =>
  records.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
)

const availableBalance = computed(() => Math.max(totalIncome.value - totalWithdrawn.value, 0))

onMounted(async () => {
  try {
    await orderStore.fetchOrders()
  } catch (error) {
    ElMessage.error(error.message || '加载余额失败')
  }
})

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORD_KEY) || '[]')
  } catch {
    return []
  }
}

function persistRecords() {
  localStorage.setItem(RECORD_KEY, JSON.stringify(records.value))
}

function submitWithdraw() {
  const value = Number(amount.value || 0)
  if (value <= 0) {
    ElMessage.error('请输入正确提现金额')
    return
  }
  if (value > availableBalance.value) {
    ElMessage.error('提现金额超过可用余额')
    return
  }
  records.value.unshift({
    id: `W${Date.now()}`,
    amount: value.toFixed(2),
    time: new Date().toLocaleString(),
    status: '审核中'
  })
  persistRecords()
  ElMessage.success('提现申请已提交')
}
</script>

<style scoped>
.page { display: grid; gap: 16px; }
</style>
