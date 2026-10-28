import request from './request'

// 套餐分页列表
export function getPackagePage(params) {
  return request.get('/admin/package/page', { params })
}

// 套餐详情
export function getPackageDetail(id) {
  return request.get(`/admin/package/${id}`)
}

// 新增套餐
export function createPackage(data) {
  return request.post('/admin/package', data)
}

// 编辑套餐
export function updatePackage(data) {
  return request.put('/admin/package', data)
}

// 删除套餐
export function deletePackage(id) {
  return request.delete('/admin/package', { params: { id } })
}

// 修改套餐状态
export function updatePackageStatus(id, status) {
  return request.post(`/admin/package/status/${status}`, null, { params: { id } })
}
