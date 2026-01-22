import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router'; // 专门用于类型

const routes: Array<RouteRecordRaw> = [
    { path: '/', component: () => import('../views/UserSearch.vue') },
    { path: '/login', component: () => import('../views/Login.vue') },
    { path: '/signup', component: () => import('../views/Signup.vue') },
    {
        path: '/admin',
        component: () => import('../layouts/AdminLayout.vue'),
        redirect: '/admin/fields',
        children: [
            { path: 'fields', component: () => import('../views/StandardFieldList.vue'), meta: { title: '字段管理', requiresAuth: true } },
            { path: 'roots', component: () => import('../views/WordRootList.vue'), meta: { title: '词根管理', requiresAuth: true } }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// 路由守卫
router.beforeEach((to, _, next) => {
    const token = localStorage.getItem('token');
    // 如果进入管理页面但没 Token，去登录
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else {
        next();
    }
});

export default router;