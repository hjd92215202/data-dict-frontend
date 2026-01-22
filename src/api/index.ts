import axios from 'axios';
import router from '../router';
import type { WordRoot, SuggestResponse, StandardField, AuthPayload, AuthResponse } from '../types';

const request = axios.create({
  baseURL: '/api', // Vite 代理会将 /api 转发到 http://127.0.0.1:3000
  timeout: 5000
});

// 请求拦截器：每秒检查一次本地存储，如果有 Token 则注入 Header
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理 401/403 错误
request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      router.push('/login');
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
  getRoots: () => request.get<WordRoot[]>('/admin/roots'),
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
};