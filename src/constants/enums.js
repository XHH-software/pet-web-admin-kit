// 预约状态 —— 必须与后端 appointment.status 完全一致
export const APPOINTMENT_STATUS = {
  PENDING: 1,   // 待支付
  PAID: 2,      // 待服务
  SERVING: 3,   // 服务中
  CANCELED: 4,  // 已取消
  DONE: 5,      // 已完成
  REVIEWED: 6   // 已评价
}

// 渲染用：value 必须与上面的数字一致
export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 1, label: '待支付', type: 'warning' },
  { value: 2, label: '待服务', type: 'primary' },
  { value: 3, label: '服务中', type: 'info' },
  { value: 4, label: '已取消', type: 'danger' },
  { value: 5, label: '已完成', type: 'success' },
  { value: 6, label: '已评价', type: 'success' }
]

// 支付状态
export const PAY_STATUS = {
  UNPAID: 0,
  PAID: 1,
  REFUNDED: 2
}

export const PAY_STATUS_OPTIONS = [
  { value: 0, label: '未付', type: 'warning' },
  { value: 1, label: '已付', type: 'success' },
  { value: 2, label: '已退', type: 'danger' }
]

// 员工职位
export const STAFF_POSITION = [
  { value: 1, label: '店长' },
  { value: 2, label: '美容师' },
  { value: 3, label: '助理' }
]

// 员工职级
export const STAFF_LEVEL = [
  { value: 1, label: '初级' },
  { value: 2, label: '中级' },
  { value: 3, label: '高级' }
]

// 宠物类型
export const PET_SPECIES = [
  { value: 1, label: '狗' },
  { value: 2, label: '猫' },
  { value: 3, label: '其他' }
]

// 适用体型 —— 0 表示不限
export const PET_SIZE_LIMIT = [
  { value: 0, label: '不限' },
  { value: 1, label: '小型' },
  { value: 2, label: '中型' },
  { value: 3, label: '大型' }
]

// 通用启停状态
export const COMMON_STATUS = [
  { value: 1, label: '启用', type: 'success' },
  { value: 0, label: '停用', type: 'info' }
]

// 排班状态
export const SCHEDULE_STATUS = [
  { value: 1, label: '可约', type: 'success' },
  { value: 2, label: '休息', type: 'info' }
]

// 分类类型
export const CATEGORY_TYPE = [
  { value: 1, label: '服务项目' },
  { value: 2, label: '服务套餐' }
]
