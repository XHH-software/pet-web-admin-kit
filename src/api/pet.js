import request from './request'

// 宠物分页列表
export function getPetPage(params) {
  return request.get('/admin/pet/page', { params })
}

// 宠物详情
export function getPetDetail(id) {
  return request.get(`/admin/pet/${id}`)
}
