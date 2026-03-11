<template>
  <div class="page">
    <el-card>
      <template #header>个人中心</template>

      <div class="profile-top">
        <div class="avatar-wrap">
          <el-avatar :size="84" :src="auth.avatar">{{ avatarInitial }}</el-avatar>
          <div class="avatar-actions">
            <el-button size="small" @click="triggerAvatarSelect">更换头像</el-button>
            <el-button size="small" type="danger" plain @click="clearAvatar">移除头像</el-button>
          </div>
          <input ref="avatarInputRef" type="file" accept="image/*" class="hidden-input" @change="handleAvatarFileChange" />
        </div>

        <el-descriptions :column="1" border class="profile-info">
          <el-descriptions-item label="用户名">
            <div class="line-row">
              <span>{{ auth.username || '-' }}</span>
              <el-button type="primary" link @click="openUsernameDialog">修改</el-button>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="手机号">
            <div class="line-row">
              <span>{{ auth.phone || '-' }}</span>
              <el-button type="primary" link @click="openPhoneDialog">修改</el-button>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="当前端口">{{ auth.roleText }}</el-descriptions-item>
          <el-descriptions-item label="账号状态">正常</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card>
      <template #header>常用功能</template>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/companion/hall')">接单大厅</el-button>
        <el-button @click="$router.push('/companion/records')">服务记录</el-button>
        <el-button @click="$router.push('/companion/income')">收入统计</el-button>
      </div>
    </el-card>

    <el-dialog v-model="usernameDialogVisible" title="修改用户名" width="420px">
      <el-input
        v-model="usernameInput"
        maxlength="20"
        show-word-limit
        placeholder="请输入新用户名（最多20字）"
      />

      <template #footer>
        <el-button @click="usernameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingUsername" @click="saveUsername">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="phoneDialogVisible" title="修改手机号" width="420px">
      <el-input
        v-model="phoneInput"
        maxlength="11"
        placeholder="请输入新的11位手机号"
      />
      <div class="tip">提交前会弹出二次确认，请确认号码无误。</div>

      <template #footer>
        <el-button @click="phoneDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPhone" @click="savePhone">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const PHONE_REGEX = /^1\d{10}$/

const avatarInputRef = ref(null)
const usernameDialogVisible = ref(false)
const phoneDialogVisible = ref(false)
const usernameInput = ref('')
const phoneInput = ref('')
const savingUsername = ref(false)
const savingPhone = ref(false)

const avatarInitial = computed(() => String(auth.username || 'U').trim().slice(0, 1).toUpperCase() || 'U')

watch(
  () => auth.username,
  (value) => {
    if (!usernameDialogVisible.value) {
      usernameInput.value = value || ''
    }
  },
  { immediate: true }
)

watch(
  () => auth.phone,
  (value) => {
    if (!phoneDialogVisible.value) {
      phoneInput.value = value || ''
    }
  },
  { immediate: true }
)

function openUsernameDialog() {
  usernameInput.value = auth.username || ''
  usernameDialogVisible.value = true
}

function openPhoneDialog() {
  phoneInput.value = auth.phone || ''
  phoneDialogVisible.value = true
}

async function saveUsername() {
  const name = String(usernameInput.value || '').trim()
  if (!name) {
    ElMessage.error('用户名不能为空')
    return
  }

  try {
    savingUsername.value = true
    await auth.updateUsername(name, 'companion')
    usernameDialogVisible.value = false
    ElMessage.success('用户名已更新')
  } catch (error) {
    ElMessage.error(error.message || '修改失败')
  } finally {
    savingUsername.value = false
  }
}

async function savePhone() {
  const newPhone = String(phoneInput.value || '').trim()
  if (!PHONE_REGEX.test(newPhone)) {
    ElMessage.error('请输入正确的11位手机号')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认将手机号修改为 ${newPhone} 吗？修改后请使用新手机号登录。`,
      '二次确认',
      {
        confirmButtonText: '确认修改',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  try {
    savingPhone.value = true
    await auth.updatePhone(newPhone, 'companion')
    phoneDialogVisible.value = false
    ElMessage.success('手机号已更新')
  } catch (error) {
    ElMessage.error(error.message || '修改失败')
  } finally {
    savingPhone.value = false
  }
}

function triggerAvatarSelect() {
  avatarInputRef.value?.click()
}

function clearAvatar() {
  auth.updateAvatar('', 'companion')
  if (avatarInputRef.value) {
    avatarInputRef.value.value = ''
  }
  ElMessage.success('头像已移除')
}

function handleAvatarFileChange(event) {
  const file = event.target?.files?.[0]
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    auth.updateAvatar(String(reader.result || ''), 'companion')
    ElMessage.success('头像已更新')
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.profile-top {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px dashed #d8e2f0;
  border-radius: 10px;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.profile-info {
  width: 100%;
}

.line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hidden-input {
  display: none;
}

.tip {
  margin-top: 10px;
  font-size: 12px;
  color: #65758b;
}

@media (max-width: 860px) {
  .profile-top {
    grid-template-columns: 1fr;
  }
}
</style>
