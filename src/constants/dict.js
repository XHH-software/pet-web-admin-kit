import {
  APPOINTMENT_STATUS_OPTIONS,
  PAY_STATUS_OPTIONS,
  COMMON_STATUS,
  SCHEDULE_STATUS,
  STAFF_POSITION,
  STAFF_LEVEL,
  PET_SPECIES,
  PET_SIZE_LIMIT,
  CATEGORY_TYPE
} from './enums'

// 字典映射：根据字典名获取选项列表
export const dictMap = {
  appointment: APPOINTMENT_STATUS_OPTIONS,
  pay: PAY_STATUS_OPTIONS,
  common: COMMON_STATUS,
  schedule: SCHEDULE_STATUS
}

// 根据值和字典名获取标签
export function getLabelByValue(value, dictName) {
  const dict = dictMap[dictName]
  if (!dict) return ''
  const item = dict.find(d => d.value === Number(value))
  return item?.label || ''
}

// 根据值和字典名获取类型
export function getTypeByValue(value, dictName) {
  const dict = dictMap[dictName]
  if (!dict) return ''
  const item = dict.find(d => d.value === Number(value))
  return item?.type || ''
}

// 导出所有字典供下拉框使用
export {
  STAFF_POSITION,
  STAFF_LEVEL,
  PET_SPECIES,
  PET_SIZE_LIMIT,
  CATEGORY_TYPE
}
