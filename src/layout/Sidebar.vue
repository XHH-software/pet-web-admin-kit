<template>
  <div class="sidebar" :class="{ 'is-collapse': collapse }">
    <div class="sidebar-logo">
      <el-icon :size="24" color="#FF7A45"><Star /></el-icon>
      <span v-show="!collapse" class="sidebar-logo-text">宠物服务平台</span>
    </div>
    <el-scrollbar class="sidebar-menu-wrapper">
      <el-menu
        :default-active="currentRoute"
        :collapse="collapse"
        :collapse-transition="false"
        router
        background-color="#1D2129"
        text-color="#C9CDD4"
        active-text-color="#FFFFFF"
      >
        <template v-for="item in menuList" :key="item.path">
          <el-menu-item
            v-if="!item.meta?.hidden"
            :index="item.path"
            class="sidebar-menu-item"
          >
            <el-icon><component :is="item.meta.icon" /></el-icon>
            <template #title>{{ item.meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
    <div class="sidebar-collapse-btn" @click="$emit('toggle-collapse')">
      <el-icon :size="16">
        <component :is="collapse ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineProps({
  collapse: { type: Boolean, default: false }
})

defineEmits(['toggle-collapse'])

const route = useRoute()
const router = useRouter()

const currentRoute = computed(() => {
  const path = route.path
  // 匹配一级路径作为菜单高亮
  const segments = path.split('/').filter(Boolean)
  return '/' + (segments[0] || 'dashboard')
})

const menuList = computed(() => {
  const mainRoute = router.options.routes.find((r) => r.path === '/')
  return mainRoute?.children || []
})
</script>

<style scoped lang="scss">
.sidebar {
  width: 200px;
  height: 100vh;
  background: #1D2129;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  flex-shrink: 0;
}

.sidebar.is-collapse {
  width: 64px;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}

.sidebar-menu-wrapper {
  flex: 1;
  overflow: hidden;
}

.sidebar-menu-item {
  &.is-active {
    background: var(--p-primary) !important;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #FFFFFF;
    }
  }

  &:hover {
    background: #252B33 !important;
  }
}

.sidebar-collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #C9CDD4;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  &:hover {
    color: #FFFFFF;
  }
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 4px 8px;
  border-radius: 4px;

  &.is-active {
    background: var(--p-primary) !important;
  }
}
</style>
