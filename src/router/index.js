import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'

// 占位组件：使用 render 函数，兼容 runtime-only 构建
function createPlaceholder(title) {
  return {
    render() {
      return h('div', {
        style: 'display:flex;align-items:center;justify-content:center;height:100%;font-size:16px;color:var(--p-text-3)'
      }, `${title} · 开发中`)
    }
  }
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataLine' }
      },
      {
        path: 'appointment',
        name: 'Appointment',
        component: () => import('@/views/appointment/index.vue'),
        meta: { title: '预约管理', icon: 'Calendar' }
      },
      {
        path: 'appointment/calendar',
        name: 'AppointmentCalendar',
        component: () => import('@/views/appointment/calendar.vue'),
        meta: { title: '预约日历', hidden: true }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/schedule/index.vue'),
        meta: { title: '排班管理', icon: 'Clock' }
      },
      {
        path: 'service-item',
        name: 'ServiceItem',
        component: () => import('@/views/service-item/index.vue'),
        meta: { title: '服务项目', icon: 'Goods' }
      },
      {
        path: 'service-package',
        name: 'ServicePackage',
        component: () => import('@/views/service-package/index.vue'),
        meta: { title: '服务套餐', icon: 'Box' }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '分类管理', icon: 'Menu' }
      },
      {
        path: 'pet',
        name: 'Pet',
        component: () => import('@/views/pet/index.vue'),
        meta: { title: '宠物档案', icon: 'Star' }
      },
      {
        path: 'staff',
        name: 'Staff',
        component: () => import('@/views/staff/index.vue'),
        meta: { title: '员工管理', icon: 'User' }
      },
      {
        path: 'review',
        name: 'Review',
        component: () => import('@/views/review/index.vue'),
        meta: { title: '评价管理', icon: 'ChatDotRound' }
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/shop/index.vue'),
        meta: { title: '门店设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  document.title = to.meta.title ? `${to.meta.title} - 宠物服务预约平台` : '宠物服务预约平台'

  if (!token && to.path !== '/login') {
    next('/login')
  } else if (token && to.path === '/login') {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
