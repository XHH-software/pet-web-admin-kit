<template>
  <el-tag :type="tagType" size="small" effect="light">{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { APPOINTMENT_STATUS_OPTIONS, PAY_STATUS_OPTIONS, COMMON_STATUS, SCHEDULE_STATUS } from '@/constants/enums'

const props = defineProps({
  value: { type: [Number, String], required: true },
  dict: { type: String, default: 'appointment' }
})

const dictData = {
  appointment: APPOINTMENT_STATUS_OPTIONS,
  pay: PAY_STATUS_OPTIONS,
  common: COMMON_STATUS,
  schedule: SCHEDULE_STATUS
}

const matched = computed(() => {
  const options = dictData[props.dict] || []
  return options.find(item => item.value === Number(props.value))
})

const label = computed(() => matched.value?.label || '未知')
const tagType = computed(() => matched.value?.type || 'info')
</script>
