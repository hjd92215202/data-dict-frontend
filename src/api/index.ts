import axios from 'axios';
import type { WordRoot, SuggestResponse ,StandardField } from '../types';

const request = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export const dictionaryApi = {
  // --- 词根相关 ---
  getRoots: () => request.get<WordRoot[]>('/roots'),
  createRoot: (data: WordRoot) => request.post<WordRoot>('/roots', data),
  updateRoot: (id: number, data: WordRoot) => request.put(`/roots/${id}`, data),
  deleteRoot: (id: number) => request.delete(`/roots/${id}`),
  
  // --- 智能建议 (分词匹配) ---
  getSuggest: (q: string) => request.get<SuggestResponse>(`/suggest?q=${encodeURIComponent(q)}`),
  
  // --- 标准字段相关 ---
  getFields: () => request.get<StandardField[]>('/fields'),
  createField: (data: any) => request.post('/fields', data),
  updateField: (id: number, data: any) => request.put(`/fields/${id}`, data),
  deleteField: (id: number) => request.delete(`/fields/${id}`),
  getFieldDetails: (id: number) => request.get<WordRoot[]>(`/fields/${id}`),

  // 1. 新增：用户端搜索接口 (对应后端 search_field)
  searchField: (q: string) => 
    request.get<StandardField[]>(`/fields/search?q=${encodeURIComponent(q)}`),

  // 2. 新增：创建申请任务 (对应后端小红点逻辑，如果后端尚未实现可先定义)
  createTask: (data: { type: string, content: string }) => 
    request.post('/tasks', data),
};


