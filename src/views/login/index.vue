<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-left-content">
        <h1 class="login-title">宠物服务预约平台</h1>
        <p class="login-subtitle">商家管理端 · 让每一次预约都准时</p>
        <div class="login-features">
          <span class="login-feature-item">排班可视化</span>
          <span class="login-feature-divider">·</span>
          <span class="login-feature-item">时段冲突自动拦截</span>
          <span class="login-feature-divider">·</span>
          <span class="login-feature-item">预约全流程追踪</span>
        </div>
      </div>
      <!-- 右下角爪印装饰 -->
      <div class="login-paw-decoration">
        <svg viewBox="0 0 200 200" width="320" height="320" fill="currentColor">
          <ellipse cx="100" cy="140" rx="45" ry="40" />
          <ellipse cx="55" cy="85" rx="20" ry="25" />
          <ellipse cx="100" cy="70" rx="20" ry="25" />
          <ellipse cx="145" cy="85" rx="20" ry="25" />
          <ellipse cx="40" cy="130" rx="18" ry="22" />
          <ellipse cx="160" cy="130" rx="18" ry="22" />
        </svg>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <h2 class="login-card-title">欢迎回来</h2>
        <p class="login-card-desc">请使用员工账号登录</p>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              size="large"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >登录</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="login-copyright">© 2026 宠物服务预约平台 版权所有</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6-20 位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login({
      username: form.username,
      password: form.password
    })
    userStore.setLogin({ token: res.token, name: res.name })
    ElMessage.success('登录成功')
    router.replace('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.login-left {
  width: 55%;
  background: #1D2129;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-left-content {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: -48px;
}

.login-title {
  font-size: 32px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 12px;
}

.login-subtitle {
  font-size: 16px;
  font-weight: 400;
  color: var(--p-text-3);
  margin-bottom: 32px;
}

.login-features {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-feature-item {
  font-size: 14px;
  color: var(--p-text-3);
}

.login-feature-divider {
  font-size: 14px;
  color: var(--p-text-4);
}

.login-paw-decoration {
  position: absolute;
  right: -40px;
  bottom: -40px;
  color: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.login-right {
  width: 45%;
  background: var(--p-bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 380px;
}

.login-card-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--p-text-1);
  margin-bottom: 8px;
}

.login-card-desc {
  font-size: 14px;
  color: var(--p-text-3);
  margin-bottom: 32px;
}

.login-form {
  :deep(.el-input__wrapper) {
    border-radius: var(--p-radius);
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.login-copyright {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: var(--p-text-4);
}
</style>
