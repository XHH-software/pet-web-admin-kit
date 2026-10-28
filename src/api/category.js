import request from './request'

// 分类列表（下拉用，不分页）
export function getCategoryList(params) {
  return request.get('/admin/category/list', { params })
}

// 分类分页列表
export function getCategoryPage(params) {
  return request.get('/admin/category/page', { params })
}

// 新增分类
export function createCategory(data) {
  return request.post('/admin/category', data)
}

// 编辑分类
export function updateCategory(data) {
  return request.put('/admin/category', data)
}

// 删除分类
export function deleteCategory(id) {
  return request.delete('/admin/category', { params: { id } })
}

// 修改分类状态
export function updateCategoryStatus(id, status) {
  return request.post(`/admin/category/status/${status}`, null, { params: { id } })
}
