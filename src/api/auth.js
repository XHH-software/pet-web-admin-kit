import request from './request'

// 员工登录
export function login(data) {
  return request.post('/admin/staff/login', data)
}

// 退出登录
export function logout() {
  return request.post('/admin/staff/logout')
}

// 修改密码
export function updatePassword(data) {
  return request.put('/admin/staff/password', data)
}
