import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// 定义路由规则
const routes: Array<RouteRecordRaw> = [
  // 1. 公共入口：用户查询门户
  {
    path: '/',
    name: 'UserSearch',
    component: () => import('../views/UserSearch.vue'),
    meta: { title: '标准查询门户' }
  },
  
  // 2. 身份认证页
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '系统登录' }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../views/Signup.vue'),
    meta: { title: '用户注册' }
  },

  // 3. 管理员后台（嵌套路由）
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/admin/fields', // 访问 /admin 时自动跳转到字段管理
    meta: { requiresAuth: true, requiresAdmin: true }, // 标记需要权限
    children: [
      {
        path: 'fields',
        name: 'StandardFieldList',
        component: () => import('../views/StandardFieldList.vue'),
        meta: { title: '标准字段管理' }
      },
      {
        path: 'roots',
        name: 'WordRootList',
        component: () => import('../views/WordRootList.vue'),
        meta: { title: '标准词根管理' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        meta: { title: '用户权限管理' }
      }
    ]
  },

  // 4. 404 兜底（可选）
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 全局路由守卫
 * 负责：页面标题更新、登录拦截、角色权限控制
 */
router.beforeEach((to, _from, next) => {
  // 1. 动态更新浏览器页签标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 数据字典系统`;
  }

  // 2. 获取本地存储的登录状态
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // 3. 权限判断逻辑
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否登录
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 登录后跳转回当前页
      });
    } 
    // 检查是否是管理员角色
    else if (to.matched.some(record => record.meta.requiresAdmin) && role !== 'admin') {
      // 如果不是管理员，强制踢回普通查询页
      alert('权限不足：您的账号不是管理员角色，无法进入后台。');
      next('/');
    } 
    else {
      next(); // 验证通过
    }
  } else {
    // 公共页面，如果已登录且访问 login 页，直接跳后台
    if (to.path === '/login' && token && role === 'admin') {
      next('/admin/fields');
    } else {
      next();
    }
  }
});

export default router;