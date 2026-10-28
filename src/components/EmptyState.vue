<template>
  <div class="p-empty-state">
    <el-empty :description="description">
      <template v-if="$slots.default">
        <slot />
      </template>
    </el-empty>
  </div>
</template>

<script setup>
defineProps({
  description: { type: String, default: '暂无数据' }
})
</script>

<style scoped lang="scss">
.p-empty-state {
  padding: 32px 0;
}
</style>
