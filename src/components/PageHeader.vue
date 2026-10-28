<template>
  <div class="p-page-header">
    <div class="p-page-header__left">
      <h2 class="p-page-title">{{ title }}</h2>
      <slot name="subtitle" />
    </div>
    <div class="p-page-header__right">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
</script>

<style scoped lang="scss">
.p-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.p-page-header__left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.p-page-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
