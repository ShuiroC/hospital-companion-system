import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  login,
  registerCompanion,
  registerPatient,
  updateProfilePhone,
  updateProfileUsername
} from '../api/auth'
import {
  getActiveRole,
  getPhoneByRole,
  getPhoneKey,
  getTokenByRole,
  getTokenKey,
  normalizeRole,
  ROLE_COMPANION,
  ROLE_PATIENT,
  setActiveRole
} from '../utils/authSession'

const NAME_KEYS = {
  [ROLE_PATIENT]: 'county_companion_name_patient',
  [ROLE_COMPANION]: 'county_companion_name_companion'
}

const AVATAR_KEYS = {
  [ROLE_PATIENT]: 'county_companion_avatar_patient',
  [ROLE_COMPANION]: 'county_companion_avatar_companion'
}

const PHONE_REGEX = /^1\d{10}$/

export const useAuthStore = defineStore('auth', () => {
  const role = ref(getActiveRole())
  const token = ref(getTokenByRole(role.value))
  const phone = ref(getPhoneByRole(role.value))
  const username = ref('')
  const avatar = ref('')

  const isLoggedIn = computed(() => !!token.value)
  const roleText = computed(() => (role.value === ROLE_COMPANION ? '陪诊员端' : '患者端'))

  const toRoleCode = (selectedRole) => (selectedRole === ROLE_COMPANION ? 3 : 1)
  const defaultNameByRole = (selectedRole) => (selectedRole === ROLE_COMPANION ? '陪诊员用户' : '患者用户')
  const getNameKey = (selectedRole) => NAME_KEYS[normalizeRole(selectedRole)]
  const getAvatarKey = (selectedRole) => AVATAR_KEYS[normalizeRole(selectedRole)]

  function syncRoleSession(selectedRole) {
    const normalizedRole = normalizeRole(selectedRole)
    role.value = normalizedRole
    setActiveRole(normalizedRole)
    token.value = getTokenByRole(normalizedRole)
    phone.value = getPhoneByRole(normalizedRole)
    username.value = localStorage.getItem(getNameKey(normalizedRole)) || defaultNameByRole(normalizedRole)
    avatar.value = localStorage.getItem(getAvatarKey(normalizedRole)) || ''
  }

  async function loginByPassword(payload, selectedRole = ROLE_PATIENT) {
    const normalizedRole = normalizeRole(selectedRole)
    const { data } = await login({ ...payload, role: toRoleCode(normalizedRole) })
    if (data.code !== 0) {
      throw new Error(data.message || '登录失败')
    }
    localStorage.setItem(getTokenKey(normalizedRole), data.data.token)
    localStorage.setItem(getPhoneKey(normalizedRole), data.data.phone)
    localStorage.setItem(getNameKey(normalizedRole), data.data.username || defaultNameByRole(normalizedRole))
    syncRoleSession(normalizedRole)
  }

  async function registerByPhone(payload) {
    const selectedRole = normalizeRole(payload.role || ROLE_PATIENT)
    const registerApi = selectedRole === ROLE_COMPANION ? registerCompanion : registerPatient
    const { data } = await registerApi({ ...payload, role: toRoleCode(selectedRole) })
    if (data.code !== 0) {
      throw new Error(data.message || '注册失败')
    }
    return data.data
  }

  async function updateUsername(newUsername, selectedRole = role.value) {
    const normalizedRole = normalizeRole(selectedRole)
    const currentPhone = getPhoneByRole(normalizedRole)
    if (!currentPhone) {
      throw new Error('当前账号未登录')
    }

    const usernameText = String(newUsername || '').trim()
    if (!usernameText) {
      throw new Error('用户名不能为空')
    }

    const { data } = await updateProfileUsername({
      phone: currentPhone,
      role: toRoleCode(normalizedRole),
      username: usernameText
    })
    if (data.code !== 0) {
      throw new Error(data.message || '修改用户名失败')
    }

    const nextName = data.data?.username || usernameText
    localStorage.setItem(getNameKey(normalizedRole), nextName)
    if (role.value === normalizedRole) {
      username.value = nextName
    }
    return data.data
  }

  async function updatePhone(newPhone, selectedRole = role.value) {
    const normalizedRole = normalizeRole(selectedRole)
    const currentPhone = getPhoneByRole(normalizedRole)
    if (!currentPhone) {
      throw new Error('当前账号未登录')
    }

    const nextPhone = String(newPhone || '').trim()
    if (!PHONE_REGEX.test(nextPhone)) {
      throw new Error('请输入正确的11位手机号')
    }

    const { data } = await updateProfilePhone({
      phone: currentPhone,
      role: toRoleCode(normalizedRole),
      newPhone: nextPhone
    })
    if (data.code !== 0) {
      throw new Error(data.message || '修改手机号失败')
    }

    localStorage.setItem(getPhoneKey(normalizedRole), data.data?.phone || nextPhone)
    if (role.value === normalizedRole) {
      phone.value = data.data?.phone || nextPhone
    }
    return data.data
  }

  function updateAvatar(dataUrl, selectedRole = role.value) {
    const normalizedRole = normalizeRole(selectedRole)
    const avatarText = String(dataUrl || '').trim()
    if (!avatarText) {
      localStorage.removeItem(getAvatarKey(normalizedRole))
    } else {
      localStorage.setItem(getAvatarKey(normalizedRole), avatarText)
    }
    if (role.value === normalizedRole) {
      avatar.value = avatarText
    }
  }

  function logout(selectedRole = role.value) {
    const normalizedRole = normalizeRole(selectedRole)
    localStorage.removeItem(getTokenKey(normalizedRole))
    localStorage.removeItem(getPhoneKey(normalizedRole))
    localStorage.removeItem(getNameKey(normalizedRole))
    localStorage.removeItem(getAvatarKey(normalizedRole))

    if (role.value === normalizedRole) {
      token.value = ''
      phone.value = ''
      username.value = defaultNameByRole(normalizedRole)
      avatar.value = ''
    }
  }

  function switchRole(selectedRole) {
    syncRoleSession(selectedRole)
  }

  function getPhoneForRole(selectedRole) {
    return getPhoneByRole(selectedRole)
  }

  function getDisplayNameForRole(selectedRole) {
    const normalizedRole = normalizeRole(selectedRole)
    return localStorage.getItem(getNameKey(normalizedRole)) || defaultNameByRole(normalizedRole)
  }

  function getAvatarForRole(selectedRole) {
    const normalizedRole = normalizeRole(selectedRole)
    return localStorage.getItem(getAvatarKey(normalizedRole)) || ''
  }

  syncRoleSession(role.value)

  return {
    token,
    phone,
    username,
    avatar,
    role,
    roleText,
    isLoggedIn,
    loginByPassword,
    registerByPhone,
    updateUsername,
    updatePhone,
    updateAvatar,
    logout,
    switchRole,
    getPhoneForRole,
    getDisplayNameForRole,
    getAvatarForRole
  }
})
