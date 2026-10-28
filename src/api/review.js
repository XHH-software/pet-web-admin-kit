import request from './request'

// 评价分页列表
export function getReviewPage(params) {
  return request.get('/admin/review/page', { params })
}

// 回复评价
export function replyReview(id, data) {
  return request.post(`/admin/review/${id}/reply`, data)
}
