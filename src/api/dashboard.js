import request from './request'

// 工作台汇总数据
export function getDashboardSummary() {
  return request.get('/admin/dashboard/summary')
}

// 近 7 日趋势
export function getDashboardTrend() {
  return request.get('/admin/dashboard/trend')
}

// 技师排名
export function getStaffRank() {
  return request.get('/admin/report/staff-rank')
}
