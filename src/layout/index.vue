<template>
  <div class="layout">
    <Sidebar :collapse="isCollapse" @toggle-collapse="isCollapse = !isCollapse" />
    <div class="layout-right">
      <Navbar :collapse="isCollapse" @toggle-collapse="isCollapse = !isCollapse" />
      <el-scrollbar class="layout-content-wrapper">
        <div class="layout-content">
          <router-view />
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const isCollapse = ref(false)
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-content-wrapper {
  flex: 1;
  background: var(--p-bg-page);
}

.layout-content {
  padding: 16px;
  min-height: 100%;
}
</style>
