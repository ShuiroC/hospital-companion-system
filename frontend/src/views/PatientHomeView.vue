<template>
  <div class="page">
    <el-card class="hero">
      <h2>患者首页</h2>
      <p>请选择就诊医院，然后进入下单页发起陪诊服务。</p>
    </el-card>

    <el-row :gutter="16" v-loading="loading">
      <el-col v-for="item in hospitals" :key="item.id" :xs="24" :sm="24" :md="12" :lg="8" class="card-col">
        <el-card shadow="hover" class="hospital-card">
          <h3>{{ item.name }}</h3>
          <p>等级：{{ item.level || '-' }}</p>
          <p>地址：{{ item.address || '-' }}</p>
          <p>电话：{{ item.phone || '-' }}</p>
          <el-button type="primary" class="full-btn" size="large" @click="goCreate(item.id)">选择并下单</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getHospitals } from '../api/hospital'

const router = useRouter()
const loading = ref(false)
const hospitals = ref([])

onMounted(async () => {
  try {
    loading.value = true
    const { data } = await getHospitals()
    if (data.code !== 0) {
      throw new Error(data.message || '加载医院失败')
    }
    hospitals.value = data.data || []
  } catch (error) {
    ElMessage.error(error.message || '加载医院失败')
  } finally {
    loading.value = false
  }
})

function goCreate(hospitalId) {
  router.push(`/patient/orders/create?hospital=${hospitalId}`)
}
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.hero h2 {
  margin: 0;
  font-size: 30px;
}

.hero p {
  margin: 12px 0 0;
  color: #334155;
  font-size: 17px;
}

.card-col {
  margin-bottom: 16px;
}

.hospital-card h3 {
  margin: 0 0 10px;
  font-size: 22px;
}

.hospital-card p {
  margin: 0 0 8px;
  color: #334155;
  font-size: 16px;
}

.full-btn {
  width: 100%;
  margin-top: 8px;
}

:global(body.senior-mode) .hero h2 {
  font-size: 34px;
}

:global(body.senior-mode) .hero p,
:global(body.senior-mode) .hospital-card p {
  font-size: 19px;
}

:global(body.senior-mode) .hospital-card h3 {
  font-size: 24px;
}
</style>
