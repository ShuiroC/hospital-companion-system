<template>
  <div class="page">
    <el-card class="order-card">
      <template #header>
        <div class="header-row">
          <span>患者下单页</span>
          <small>请按顺序填写信息</small>
        </div>
      </template>

      <el-form :model="form" label-position="top" class="form">
        <el-form-item label="医院">
          <el-select v-model="form.hospital" placeholder="请选择医院">
            <el-option label="县人民医院" value="1" />
            <el-option label="县中医院" value="2" />
            <el-option label="城关镇卫生院" value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="服务类型">
          <el-select v-model="form.serviceType" placeholder="请选择服务类型">
            <el-option label="全程陪诊" value="1" />
            <el-option label="检查陪同" value="2" />
            <el-option label="乡镇接送" value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="预约时间">
          <el-date-picker
            v-model="form.reserveTime"
            type="datetime"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            placeholder="选择预约时间"
          />
        </el-form-item>

        <el-form-item label="患者姓名">
          <el-input v-model="form.patientName" clearable />
        </el-form-item>

        <el-form-item label="联系电话">
          <el-input v-model="form.patientPhone" maxlength="11" placeholder="请输入11位联系电话" clearable />
        </el-form-item>

        <el-form-item label="订单金额">
          <el-input-number v-model="form.amount" :min="1" :max="9999" />
        </el-form-item>
      </el-form>
    </el-card>

    <div class="sticky-actions">
      <el-button type="primary" class="action-btn" :loading="loading" @click="submit">提交派单</el-button>
      <el-button class="action-btn" @click="$router.push('/patient/orders')">返回订单列表</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '../stores/order'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const loading = ref(false)

const form = reactive({
  hospital: '1',
  serviceType: '1',
  reserveTime: '',
  patientName: '',
  patientPhone: '',
  amount: 199
})

onMounted(() => {
  const hospital = String(route.query.hospital || '')
  if (['1', '2', '3'].includes(hospital)) {
    form.hospital = hospital
  }
})

async function submit() {
  if (!form.reserveTime || !form.patientName || !/^\d{11}$/.test(form.patientPhone)) {
    ElMessage.error('请完整填写必填信息（联系电话需为11位数字）')
    return
  }

  try {
    loading.value = true
    const created = await orderStore.createNewOrder(form)
    ElMessage.success('派单成功')
    router.push(`/patient/orders/${created.orderNo}`)
  } catch (error) {
    ElMessage.error(error.message || '创建订单失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
  padding-bottom: 84px;
}

.header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.header-row span {
  font-size: 24px;
  font-weight: 700;
}

.header-row small {
  color: #475569;
  font-size: 14px;
}

.form {
  max-width: 680px;
}

.form :deep(.el-select),
.form :deep(.el-date-editor),
.form :deep(.el-input-number) {
  width: 100%;
}

.sticky-actions {
  position: fixed;
  left: 230px;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #dbe3ef;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.action-btn {
  width: 100%;
}

:global(body.senior-mode) .header-row span {
  font-size: 27px;
}

:global(body.senior-mode) .header-row small {
  font-size: 17px;
}

@media (max-width: 960px) {
  .sticky-actions {
    left: 0;
    grid-template-columns: 1fr;
  }
}
</style>
