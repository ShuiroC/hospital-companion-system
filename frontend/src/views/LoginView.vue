<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <template #header>
        <div class="auth-header">
          <h2>{{ roleText }}登录</h2>
          <p>请输入账号信息完成登录。</p>
        </div>
      </template>

      <el-form :model="form" label-position="top" class="auth-form">
        <el-form-item label="手机号">
          <el-input
            v-model="form.phone"
            placeholder="请输入11位手机号"
            maxlength="11"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="固定密码 123123"
            maxlength="20"
            clearable
          />
        </el-form-item>

        <div class="actions">
          <el-button type="primary" class="btn" size="large" :loading="loading" @click="submit">登录</el-button>
          <el-button class="btn" size="large" @click="$router.push('/register')">去注册</el-button>
          <el-button class="btn" size="large" @click="goOtherLogin">
            {{ currentRole === ROLE_COMPANION ? '切换到患者登录' : '切换到陪诊员登录' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { ROLE_COMPANION, ROLE_PATIENT } from '../utils/authSession'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const currentRole = computed(() => (route.meta.role === ROLE_COMPANION ? ROLE_COMPANION : ROLE_PATIENT))
const roleText = computed(() => (currentRole.value === ROLE_COMPANION ? '陪诊员端' : '患者端'))

const form = reactive({
  phone: '',
  password: ''
})

async function submit() {
  if (!/^1\d{10}$/.test(form.phone)) {
    ElMessage.error('请输入正确的11位手机号')
    return
  }
  if (form.password !== '123123') {
    ElMessage.error('密码固定为 123123')
    return
  }

  try {
    loading.value = true
    await auth.loginByPassword({ phone: form.phone, password: form.password }, currentRole.value)
    ElMessage.success('登录成功')
    router.push(currentRole.value === ROLE_COMPANION ? '/companion/hall' : '/patient/home')
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function goOtherLogin() {
  router.push(currentRole.value === ROLE_COMPANION ? '/patient/login' : '/companion/login')
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at 10% 10%, #dbeafe, #eff6ff 40%, #f8fafc);
}

.auth-card {
  width: min(520px, 96vw);
}

.auth-header {
  display: grid;
  gap: 8px;
}

.auth-header h2 {
  margin: 0;
  font-size: 28px;
}

.auth-header p {
  margin: 0;
  color: #375069;
  font-size: 15px;
}

.actions {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.btn {
  width: 100%;
}
</style>
