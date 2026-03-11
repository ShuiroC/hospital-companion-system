<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <template #header>账号注册</template>
      <el-form :model="form" label-position="top">
        <el-form-item label="注册端口">
          <el-radio-group v-model="form.role">
            <el-radio-button label="patient">患者端</el-radio-button>
            <el-radio-button label="companion">陪诊员端</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.role === 'companion' ? '姓名' : '用户名'">
          <el-input
            v-model="form.username"
            :placeholder="form.role === 'companion' ? '请输入真实姓名（最多20字）' : '请输入用户名（最多20字）'"
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>
        <template v-if="form.role === 'companion'">
          <el-form-item label="年龄">
            <el-input-number v-model="form.age" :min="18" :max="80" :precision="0" />
          </el-form-item>
          <el-form-item label="学历">
            <el-select v-model="form.education" placeholder="请选择学历">
              <el-option label="初中及以下" value="初中及以下" />
              <el-option label="高中/中专" value="高中/中专" />
              <el-option label="大专" value="大专" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士及以上" value="硕士及以上" />
            </el-select>
          </el-form-item>
          <el-form-item label="工龄（年）">
            <el-input-number v-model="form.workYears" :min="0" :max="60" :precision="0" />
          </el-form-item>
        </template>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" maxlength="20" />
        </el-form-item>
        <el-button type="primary" class="btn" :loading="loading" @click="submit">注册</el-button>
        <el-button link type="primary" class="link" @click="goLogin">已有账号？去登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)

const form = reactive({
  role: 'patient',
  username: '',
  phone: '',
  age: null,
  education: '',
  workYears: null,
  password: ''
})

async function submit() {
  if (!form.username.trim()) {
    ElMessage.error(form.role === 'companion' ? '请输入姓名' : '请输入用户名')
    return
  }
  if (!/^1\d{10}$/.test(form.phone)) {
    ElMessage.error('请输入正确的11位手机号')
    return
  }
  if (form.role === 'companion') {
    if (!Number.isInteger(form.age) || form.age < 18 || form.age > 80) {
      ElMessage.error('请输入18到80之间的年龄')
      return
    }
    if (!String(form.education || '').trim()) {
      ElMessage.error('请选择学历')
      return
    }
    if (!Number.isInteger(form.workYears) || form.workYears < 0 || form.workYears > 60) {
      ElMessage.error('请输入0到60之间的工龄')
      return
    }
    if (form.workYears > form.age - 16) {
      ElMessage.error('工龄与年龄不匹配，请检查')
      return
    }
  }
  if (form.password !== '123123') {
    ElMessage.error('密码错误')
    return
  }

  try {
    loading.value = true
    const payload = {
      username: form.username.trim(),
      phone: form.phone,
      password: form.password,
      role: form.role
    }
    if (form.role === 'companion') {
      payload.age = form.age
      payload.education = String(form.education || '').trim()
      payload.workYears = form.workYears
    }
    await auth.registerByPhone({
      ...payload
    })
    if (form.role === 'companion') {
      ElMessage.success('陪诊员申请已提交，审核通过后可登录')
    } else {
      ElMessage.success('注册成功，请返回登录')
    }
    router.push(form.role === 'companion' ? '/companion/login' : '/patient/login')
  } catch (error) {
    ElMessage.error(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push(form.role === 'companion' ? '/companion/login' : '/patient/login')
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 10% 10%, #dbeafe, #eff6ff 40%, #f8fafc);
}
.auth-card { width: min(430px, 92vw); }
.btn { width: 100%; }
.link { margin-top: 12px; }

:deep(.el-select),
:deep(.el-input-number) {
  width: 100%;
}
</style>
