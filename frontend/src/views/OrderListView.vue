<template>
  <el-card class="page-card">
    <template #header>
      <div class="row">
        <span>患者订单列表</span>
        <el-button type="primary" size="large" @click="$router.push('/patient/orders/create')">去下单</el-button>
      </div>
    </template>

    <div class="filters">
      <el-input v-model="filters.orderNo" placeholder="按订单号搜索" clearable />
      <el-input v-model="filters.hospital" placeholder="按医院搜索" clearable />
      <el-input v-model="filters.username" placeholder="按用户名搜索" clearable />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button @click="clearFilters">清空</el-button>
    </div>

    <el-table :data="orderStore.orders" stripe border size="large" v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" min-width="220" />
      <el-table-column prop="hospital" label="医院" min-width="160" />
      <el-table-column prop="patientUsername" label="用户名" min-width="120" />
      <el-table-column prop="serviceType" label="服务类型" min-width="130" />
      <el-table-column label="状态" min-width="120">
        <template #default="scope">
          <el-tag>{{ orderStore.ORDER_STATUS[scope.row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" min-width="100" />
      <el-table-column prop="reserveTime" label="预约时间" min-width="180" />
      <el-table-column label="操作" min-width="220" fixed="right">
        <template #default="scope">
          <div class="action-group">
            <el-button type="primary" plain @click="viewDetail(scope.row.orderNo)">详情</el-button>
            <el-button
              type="danger"
              plain
              @click="cancel(scope.row.orderNo)"
              :disabled="['COMPLETED', 'CANCELED'].includes(scope.row.status)"
            >取消</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager-wrap">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[5, 10, 15]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '../stores/order'

const router = useRouter()
const orderStore = useOrderStore()
const loading = ref(false)

const filters = reactive({
  orderNo: '',
  hospital: '',
  username: ''
})

const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

onMounted(async () => {
  await loadOrders()
})

async function loadOrders() {
  try {
    loading.value = true
    const pageData = await orderStore.fetchOrders({
      paged: true,
      page: currentPage.value,
      pageSize: pageSize.value,
      orderNo: filters.orderNo,
      hospital: filters.hospital,
      username: filters.username
    })
    total.value = Number(pageData?.total || 0)
  } catch (error) {
    ElMessage.error(error.message || '加载订单失败')
  } finally {
    loading.value = false
  }
}

async function search() {
  currentPage.value = 1
  await loadOrders()
}

async function clearFilters() {
  filters.orderNo = ''
  filters.hospital = ''
  filters.username = ''
  currentPage.value = 1
  await loadOrders()
}

async function handleSizeChange(value) {
  pageSize.value = value
  currentPage.value = 1
  await loadOrders()
}

async function handlePageChange(value) {
  currentPage.value = value
  await loadOrders()
}

function viewDetail(orderNo) {
  router.push(`/patient/orders/${orderNo}`)
}

async function cancel(orderNo) {
  try {
    await ElMessageBox.confirm('确定取消这个订单吗？', '确认操作', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '继续保留'
    })
    await orderStore.cancel(orderNo)
    await loadOrders()
    ElMessage.warning('订单已取消')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '取消订单失败')
    }
  }
}
</script>

<style scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.row span {
  font-size: 24px;
  font-weight: 700;
}

.filters {
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto auto;
  gap: 10px;
}

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pager-wrap {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

:global(body.senior-mode) .row span {
  font-size: 28px;
}

@media (max-width: 1000px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .pager-wrap {
    justify-content: flex-start;
  }
}
</style>