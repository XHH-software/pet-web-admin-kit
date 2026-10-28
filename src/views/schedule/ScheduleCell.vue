<template>
  <div class="p-schedule-cell" @click="$emit('click')">
    <!-- 有排班 -->
    <template v-if="dayData && dayData.scheduleId">
      <div
        class="p-schedule-cell__content"
        :class="cellClass"
      >
        <div class="p-schedule-cell__time">
          {{ dayData.startTime }}-{{ dayData.endTime }}
        </div>
        <div class="p-schedule-cell__status">
          <span class="p-schedule-cell__dot" :class="isAvailable ? 'is-success' : 'is-info'" />
          {{ statusLabel }}
        </div>
        <div v-if="isAvailable && dayData.bookedCount != null" class="p-schedule-cell__booked">
          已约 {{ dayData.bookedCount }} 单
        </div>
      </div>
    </template>

    <!-- 无排班 -->
    <template v-else>
      <div class="p-schedule-cell__empty">
        <span class="p-schedule-cell__plus">+ 排班</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SCHEDULE_STATUS } from '@/constants/enums'

const props = defineProps({
  dayData: {
    type: Object,
    default: null
  }
})

defineEmits(['click'])

const isAvailable = computed(() => props.dayData?.status === 1)

const statusLabel = computed(() => {
  const item = SCHEDULE_STATUS.find(s => s.value === props.dayData?.status)
  return item?.label || ''
})

const cellClass = computed(() => ({
  'is-available': isAvailable.value,
  'is-rest': !isAvailable.value
}))
</script>

<style scoped lang="scss">
.p-schedule-cell {
  cursor: pointer;
  height: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.p-schedule-cell__content {
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--p-radius-sm);
  font-size: 12px;
  line-height: 18px;
  text-align: center;

  &.is-available {
    background: rgba(82, 196, 26, 0.1);
    color: var(--p-success);
  }

  &.is-rest {
    background: var(--p-bg-page);
    color: var(--p-text-3);
  }
}

.p-schedule-cell__time {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.p-schedule-cell__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 12px;
}

.p-schedule-cell__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.is-success {
    background: var(--p-success);
  }

  &.is-info {
    background: var(--p-text-4);
  }
}

.p-schedule-cell__booked {
  margin-top: 2px;
  font-size: 11px;
  color: var(--p-text-3);
}

.p-schedule-cell__empty {
  width: 100%;
  height: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--p-border);
  border-radius: var(--p-radius-sm);
  transition: all 0.2s;

  &:hover {
    border-color: var(--p-primary);
    color: var(--p-primary);
  }
}

.p-schedule-cell__plus {
  font-size: 12px;
  color: var(--p-text-4);

  .p-schedule-cell__empty:hover & {
    color: var(--p-primary);
  }
}
</style>
