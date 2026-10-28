import request from './request'

// 员工分页列表
export function getStaffPage(params) {
  return request.get('/admin/staff/page', { params })
}

// 员工下拉列表（排班/派单用）
export function getStaffList() {
  return request.get('/admin/staff/list')
}

// 员工详情
export function getStaffDetail(id) {
  return request.get(`/admin/staff/${id}`)
}

// 新增员工
export function createStaff(data) {
  return request.post('/admin/staff', data)
}

// 编辑员工
export function updateStaff(data) {
  return request.put('/admin/staff', data)
}

// 修改员工状态（启用/停用）
export function updateStaffStatus(id, status) {
  return request.post(`/admin/staff/status/${status}`, null, { params: { id } })
}
