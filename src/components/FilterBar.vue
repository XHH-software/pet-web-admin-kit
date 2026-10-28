<template>
  <div class="p-card p-filter-bar">
    <el-form :model="filterModel" inline>
      <slot />
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">查询</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
defineProps({
  filterModel: { type: Object, default: () => ({}) }
})

defineEmits(['search', 'reset'])
</script>

<style scoped lang="scss">
.p-filter-bar {
  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 12px;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 180px;
  }

  :deep(.el-date-editor) {
    width: 260px;
  }
}
</style>
