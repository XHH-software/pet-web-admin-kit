import request from './request'

// 服务项目分页列表
export function getServiceItemPage(params) {
  return request.get('/admin/service-item/page', { params })
}

// 服务项目详情
export function getServiceItemDetail(id) {
  return request.get(`/admin/service-item/${id}`)
}

// 新增服务项目
export function createServiceItem(data) {
  return request.post('/admin/service-item', data)
}

// 编辑服务项目
export function updateServiceItem(data) {
  return request.put('/admin/service-item', data)
}

// 删除服务项目
export function deleteServiceItem(id) {
  return request.delete('/admin/service-item', { params: { id } })
}

// 修改服务项目状态
export function updateServiceItemStatus(id, status) {
  return request.post(`/admin/service-item/status/${status}`, null, { params: { id } })
}
