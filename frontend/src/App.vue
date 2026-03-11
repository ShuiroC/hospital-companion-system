<template>
  <router-view v-if="isAuthPage" />
  <el-container v-else class="layout">
    <el-header class="header">
      <div class="title-wrap">
        <div class="title">四会市中心人民医院陪诊管理系统</div>
        <div class="subtitle">患者端服务界面</div>
      </div>
      <div class="right">
        <el-tag :type="currentRole === ROLE_COMPANION ? 'warning' : 'success'">{{ currentRoleText }}</el-tag>

        <div class="user-chip">
          <el-avatar :size="34" :src="currentAvatar">{{ currentInitial }}</el-avatar>
          <span class="username">{{ currentUserName }}</span>
        </div>

        <el-button link type="danger" @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>

    <el-container>
      <el-aside width="230px" class="aside">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
            {{ item.label }}
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { ROLE_COMPANION, ROLE_PATIENT } from './utils/authSession'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isAuthPage = computed(() => ['/register', '/patient/login', '/companion/login', '/login'].includes(route.path))
const currentRole = computed(() => (route.path.startsWith('/companion') ? ROLE_COMPANION : ROLE_PATIENT))

const patientMenu = [
  { label: '首页（选择医院）', path: '/patient/home' },
  { label: '下单页面', path: '/patient/orders/create' },
  { label: '订单列表', path: '/patient/orders' },
  { label: '评价页面', path: '/patient/review' },
  { label: '个人中心', path: '/patient/profile' }
]

const companionMenu = [
  { label: '接单大厅', path: '/companion/hall' },
  { label: '服务记录', path: '/companion/records' },
  { label: '收入统计', path: '/companion/income' },
  { label: '提现页面', path: '/companion/withdraw' },
  { label: '个人中心', path: '/companion/profile' }
]

const menuItems = computed(() => (currentRole.value === ROLE_COMPANION ? companionMenu : patientMenu))
const currentRoleText = computed(() => (currentRole.value === ROLE_COMPANION ? '陪诊员端' : '患者端'))
const currentUserName = computed(() => auth.username || '未登录')
const currentAvatar = computed(() => auth.avatar || '')
const currentInitial = computed(() => String(currentUserName.value || 'U').trim().slice(0, 1).toUpperCase() || 'U')

const activeMenu = computed(() => {
  if (route.path.startsWith('/patient/orders/')) {
    return '/patient/orders'
  }
  return route.path
})

function clearSeniorModeClass() {
  document.body.classList.remove('senior-mode')
}

function handleLogout() {
  auth.logout(currentRole.value)
  router.push(currentRole.value === ROLE_COMPANION ? '/companion/login' : '/patient/login')
}

onMounted(() => {
  clearSeniorModeClass()
})

watch(() => route.path, clearSeniorModeClass)

watch(
  currentRole,
  (value) => {
    auth.switchRole(value)
  },
  { immediate: true }
)
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  min-height: 76px;
  background: linear-gradient(120deg, #0f4c81, #1c7ed6);
  color: #fff;
}

.title-wrap {
  display: grid;
  gap: 2px;
}

.title {
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  font-size: 13px;
  opacity: 0.92;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  color: #dbeafe;
}

.aside {
  background: #f5f7fa;
  border-right: 1px solid #e5e7eb;
}

.main {
  background: #eef3f8;
}

:deep(.el-menu-item) {
  min-height: 52px;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 14px;
  }

  .right {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
