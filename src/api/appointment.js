import request from './request'

// 预约分页列表
export function getAppointmentPage(params) {
  return request.get('/admin/appointment/page', { params })
}

// 预约详情
export function getAppointmentDetail(id) {
  return request.get(`/admin/appointment/${id}`)
}

// 预约日历数据
export function getAppointmentCalendar(params) {
  return request.get('/admin/appointment/calendar', { params })
}

// 代客下单
export function createAppointment(data) {
  return request.post('/admin/appointment', data)
}

// 核销到店
export function checkinAppointment(id) {
  return request.post(`/admin/appointment/${id}/checkin`)
}

// 完成服务
export function completeAppointment(id) {
  return request.post(`/admin/appointment/${id}/complete`)
}

// 取消预约
export function cancelAppointment(id, data) {
  return request.post(`/admin/appointment/${id}/cancel`, data)
}
