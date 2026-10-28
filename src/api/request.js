import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000
})

// 请求拦截：携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['token'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：剥离外层 data，统一错误处理
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 1) {
      return res.data
    }
    if (res.code === 401) {
      localStorage.removeItem('token')
      router.push('/login')
      return Promise.reject(new Error(res.msg || '登录已过期'))
    }
    ElMessage.error(res.msg || '请求失败')
    return Promise.reject(new Error(res.msg))
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      ElMessage.error('网络异常，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default request
