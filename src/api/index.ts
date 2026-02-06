import axios from 'axios';
import router from '../router';
import type { WordRoot, SuggestResponse, StandardField, AuthPayload, AuthResponse } from '../types';
import { ElMessage } from 'element-plus';
import { logger } from '../utils/logger';

const request = axios.create({
  baseURL: '/api', // Vite 代理会将 /api 转发到 http://127.0.0.1:3000
  timeout: 600000
});

// 请求拦截器：每秒检查一次本地存储，如果有 Token 则注入 Header
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  logger.debug("Network", `>>> 发起请求 [${config.method?.toUpperCase()}] ${config.url}`, config.params || config.data);

  return config;
});

// 响应拦截器：统一处理 401/403 错误
request.interceptors.response.use(
  (res) => {
    logger.debug("Network", `<<< 收到响应 [${res.status}] ${res.config.url}`, res.data);
    return res;
  },
  (err) => {

    const status = err.response?.status;
    const url = err.config?.url;

    logger.error("Network", `!!! 请求异常 [${status || 'TIMEOUT'}] ${url}`, {
      message: err.message,
      data: err.response?.data
    });

    if (err.response) {
      if (err.response.status === 401 || err.response.status === 403) {
        // 只要是权限报错，不管是过期还是越权，一律视作“当前会话失效”
        // 立即清除所有本地缓存并跳回登录，方便用户换号登录
        localStorage.clear();
        router.push('/login');
        ElMessage.error('权限验证失败，请使用管理员账号重新登录');
      } else {
        ElMessage.error(err.response.data || '系统错误');
      }
    }
    return Promise.reject(err);
  }
);

export const dictionaryApi = {
  // --- 身份认证 (对应后端 .nest("/api/auth", ...)) ---
  login: (data: AuthPayload) => request.post<AuthResponse>('/auth/login', data),
  signup: (data: AuthPayload) => request.post('/auth/signup', data),

  // --- 公共查询 (对应后端 .nest("/api/public", ...)) ---
  searchField: (q: string) =>
    request.get<StandardField[]>(`/public/search?q=${encodeURIComponent(q)}`),

  // --- 管理端接口 (对应后端 .nest("/api/admin", ...)) ---
  // 词根管理
  getRoots: (page: number, pageSize: number, q?: string) =>
    request.get<PaginatedResponse<WordRoot>>(`/admin/roots?page=${page}&page_size=${pageSize}&q=${encodeURIComponent(q || '')}`),
  createRoot: (data: WordRoot) => request.post('/admin/roots', data),
  updateRoot: (id: number, data: WordRoot) => request.put(`/admin/roots/${id}`, data),
  deleteRoot: (id: number) => request.delete(`/admin/roots/${id}`),

  // 智能建议
  getSuggest: (q: string) =>
    request.get<SuggestResponse>(`/admin/suggest?q=${encodeURIComponent(q)}`),

  // 标准字段管理
  getFields: () => request.get<StandardField[]>('/admin/fields'),
  createField: (data: any) => request.post('/admin/fields', data),
  updateField: (id: number, data: any) => request.put(`/admin/fields/${id}`, data),
  deleteField: (id: number) => request.delete(`/admin/fields/${id}`),
  getFieldDetails: (id: number) => request.get<WordRoot[]>(`/admin/fields/${id}`),

  // 用户管理接口
  getUsers: () => request.get<any[]>('/admin/users'),
  updateUserRole: (id: number, role: string) => request.put(`/admin/users/${id}`, { role }),
  deleteUser: (id: number) => request.delete(`/admin/users/${id}`),

  // 管理员创建用户
  adminCreateUser: (data: any) => request.post('/admin/users', data),

  getSimilarRoots: (q: string) =>
    request.get<any[]>(`/public/similar-roots?q=${encodeURIComponent(q)}`),

  // 添加批量接口
  batchCreateRoots: (items: WordRoot[]) => request.post('/admin/roots/batch', { items }),

  clearAllRoots: () => request.delete('/admin/roots/clear'),

  clearAllFields: () => request.delete('/admin/fields/clear'),

  submitRequest: (cnName: string) => request.post('/public/tasks', { field_cn_name: cnName }),

  getTasks: () => request.get<any[]>('/admin/tasks'),
  completeTask: (id: number) => request.put(`/admin/tasks/${id}`),
  getTaskCount: () => request.get<{ count: number }>('/admin/tasks/count'),
};

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}