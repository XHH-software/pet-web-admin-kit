<template>
  <div class="navbar">
    <div class="navbar-left">
      <el-icon class="navbar-collapse-btn" :size="20" @click="$emit('toggle-collapse')">
        <component :is="collapse ? 'Expand' : 'Fold'" />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="item in breadcrumbs"
          :key="item.path"
        >{{ item.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="navbar-right">
      <el-tag type="success" effect="plain" size="small">营业中</el-tag>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="navbar-user">
          <el-avatar :size="28" class="navbar-avatar">
            {{ userStore.name?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="navbar-username">{{ userStore.name || '员工' }}</span>
          <el-icon :size="12"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dialog
        v-model="passwordVisible"
        title="修改密码"
        width="420px"
        destroy-on-close
      >
        <el-form :model="passwordForm" label-width="80px">
          <el-form-item label="原密码">
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="6-20 位" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="passwordVisible = false">取消</el-button>
          <el-button type="primary" :loading="passwordSaving" @click="handleChangePassword">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { logout, updatePassword } from '@/api/auth'

defineProps({
  collapse: { type: Boolean, default: false }
})

defineEmits(['toggle-collapse'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const passwordVisible = ref(false)
const passwordSaving = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const breadcrumbs = computed(() => {
  return route.matched.filter((item) => item.meta?.title)
})

async function handleCommand(command) {
  if (command === 'password') {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordVisible.value = true
    return
  }
  if (command === 'logout') {
    await doLogout()
  }
}

async function handleChangePassword() {
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码长度为 6-20 位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  passwordSaving.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    passwordVisible.value = false
    ElMessage.success('密码修改成功，请重新登录')
    await doLogout()
  } finally {
    passwordSaving.value = false
  }
}

async function doLogout() {
  try {
    await logout()
  } catch {
    // 即使接口失败也清除本地状态
  }
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.navbar {
  height: 56px;
  background: var(--p-bg-card);
  border-bottom: 1px solid var(--p-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-collapse-btn {
  cursor: pointer;
  color: var(--p-text-2);

  &:hover {
    color: var(--p-primary);
  }
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.navbar-avatar {
  background: var(--p-primary);
  color: #FFFFFF;
  font-size: 13px;
}

.navbar-username {
  font-size: 14px;
  color: var(--p-text-2);
}
</style>
