<template>
  <el-card>
    <template #header>
      <div class="row">
        <span>服务记录列表</span>
        <el-button @click="loadOrders">刷新</el-button>
      </div>
    </template>

    <div class="filters">
      <el-input v-model="filters.orderNo" placeholder="按订单号搜索" clearable />
      <el-input v-model="filters.hospital" placeholder="按医院搜索" clearable />
      <el-input v-model="filters.username" placeholder="按用户名搜索" clearable />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button @click="clearFilters">清空</el-button>
    </div>

    <el-table :data="orderStore.orders" stripe v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="hospital" label="医院" min-width="150" />
      <el-table-column prop="patientUsername" label="用户名" min-width="120">
        <template #default="scope">
          <span>{{ scope.row.patientUsername || scope.row.patientName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="serviceType" label="服务类型" min-width="120" />
      <el-table-column label="状态" min-width="120">
        <template #default="scope">
          <el-tag>{{ orderStore.ORDER_STATUS[scope.row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="服务日志" min-width="220">
        <template #default="scope">
          <span>{{ logs[scope.row.orderNo] || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="220">
        <template #default="scope">
          <el-button link type="primary" @click="writeLog(scope.row.orderNo)">填写日志</el-button>
          <el-button link type="info" @click="viewPatient(scope.row.orderNo)">患者详情</el-button>
          <el-button
            link
            type="success"
            @click="nextStep(scope.row.orderNo)"
            :disabled="!['ACCEPTED', 'IN_SERVICE'].includes(scope.row.status)"
          >推进服务</el-button>
          <el-button
            link
            type="warning"
            @click="complete(scope.row.orderNo)"
            :disabled="scope.row.status !== 'TO_CONFIRM'"
          >已完成</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && total === 0" description="暂无服务记录" />

    <div class="pager-wrap" v-if="total > 0">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useOrderStore } from '../stores/order'

const LOG_KEY = 'county_companion_service_logs'
const router = useRouter()
const orderStore = useOrderStore()
const loading = ref(false)
const logs = ref(loadLogs())

const filters = reactive({
  orderNo: '',
  hospital: '',
  username: ''
})

const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

onMounted(loadOrders)

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistLogs() {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.value))
}

async function loadOrders() {
  try {
    loading.value = true
    const pageData = await orderStore.fetchOrders({
      paged: true,
      status: 'ACCEPTED,IN_SERVICE,TO_CONFIRM,COMPLETED',
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

async function writeLog(orderNo) {
  try {
    const { value } = await ElMessageBox.prompt('请输入本次服务记录', '服务日志', {
      inputValue: logs.value[orderNo] || '',
      inputPlaceholder: '例如：已协助挂号、完成检查排队',
      confirmButtonText: '保存',
      cancelButtonText: '取消'
    })
    logs.value[orderNo] = value?.trim() || ''
    persistLogs()
    ElMessage.success('日志已保存')
  } catch {
    // canceled
  }
}

async function nextStep(orderNo) {
  try {
    await orderStore.nextStep(orderNo)
    await loadOrders()
    ElMessage.success('服务状态已推进')
  } catch (error) {
    ElMessage.error(error.message || '推进失败')
  }
}

async function complete(orderNo) {
  try {
    await orderStore.nextStep(orderNo)
    await loadOrders()
    ElMessage.success('订单已完成')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

function viewPatient(orderNo) {
  router.push(`/companion/patient/${orderNo}`)
}
</script>

<style scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto auto;
  gap: 10px;
}

.pager-wrap {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
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