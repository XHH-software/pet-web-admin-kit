import request from './request'

// 获取一周排班数据
export function getScheduleWeek(params) {
  return request.get('/admin/schedule/week', { params })
}

// 批量排班
export function batchCreateSchedule(data) {
  return request.post('/admin/schedule/batch', data)
}

// 编辑单个排班
export function updateSchedule(id, data) {
  return request.put(`/admin/schedule/${id}`, data)
}

// 删除排班
export function deleteSchedule(id) {
  return request.delete(`/admin/schedule/${id}`)
}

// 复制上周排班
export function copyLastWeekSchedule(data) {
  return request.post('/admin/schedule/copy', data)
}
