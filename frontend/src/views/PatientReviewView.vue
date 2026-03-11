<template>
  <el-card>
    <template #header>评价列表</template>

    <div class="filters">
      <el-input v-model="filters.orderNo" placeholder="按订单号搜索" clearable />
      <el-input v-model="filters.hospital" placeholder="按医院搜索" clearable />
      <el-input v-model="filters.username" placeholder="按用户名搜索" clearable />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button @click="clearFilters">清空</el-button>
    </div>

    <el-table :data="orderStore.orders" stripe v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="hospital" label="医院" min-width="140" />
      <el-table-column prop="patientUsername" label="用户名" min-width="120">
        <template #default="scope">
          <span>{{ scope.row.patientUsername || scope.row.patientName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="serviceType" label="服务类型" min-width="120" />
      <el-table-column label="评分" min-width="120">
        <template #default="scope">
          <span>{{ reviews[scope.row.orderNo]?.score || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="评价内容" min-width="240">
        <template #default="scope">
          <span>{{ reviews[scope.row.orderNo]?.content || '未评价' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openReview(scope.row)">评价</el-button>
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

  <el-dialog v-model="dialogVisible" title="提交评价" width="420px">
    <el-form label-width="70px">
      <el-form-item label="订单号">
        <span>{{ currentOrder?.orderNo }}</span>
      </el-form-item>
      <el-form-item label="评分">
        <el-rate v-model="form.score" />
      </el-form-item>
      <el-form-item label="评价">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="3"
          maxlength="80"
          show-word-limit
          placeholder="请输入一句话评价"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveReview">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const REVIEW_KEY = 'county_companion_reviews'
const orderStore = useOrderStore()
const loading = ref(false)
const dialogVisible = ref(false)
const currentOrder = ref(null)
const reviews = ref(loadReviews())

const filters = reactive({
  orderNo: '',
  hospital: '',
  username: ''
})

const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

const form = reactive({
  score: 5,
  content: ''
})

onMounted(async () => {
  await loadOrders()
})

async function loadOrders() {
  try {
    loading.value = true
    const pageData = await orderStore.fetchOrders({
      paged: true,
      status: 'COMPLETED',
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

function loadReviews() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistReviews() {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews.value))
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

function openReview(order) {
  currentOrder.value = order
  const old = reviews.value[order.orderNo]
  form.score = old?.score || 5
  form.content = old?.content || ''
  dialogVisible.value = true
}

function saveReview() {
  if (!currentOrder.value) return
  if (!form.score) {
    ElMessage.error('请选择评分')
    return
  }
  if (!form.content.trim()) {
    ElMessage.error('请填写评价内容')
    return
  }
  reviews.value[currentOrder.value.orderNo] = {
    score: form.score,
    content: form.content.trim(),
    time: new Date().toLocaleString()
  }
  persistReviews()
  dialogVisible.value = false
  ElMessage.success('评价已保存')
}
</script>

<style scoped>
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