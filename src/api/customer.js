import request from './request'

// 客户分页列表
export function getCustomerPage(params) {
  return request.get('/admin/customer/page', { params })
}
