import axios from 'axios';
import type { WordRoot, SuggestResponse } from '../types';

const request = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export const dictionaryApi = {
  // 词根相关
  getRoots: () => request.get<WordRoot[]>('/roots'),
  createRoot: (data: WordRoot) => request.post<WordRoot>('/roots', data),
updateRoot: (id: number, data: WordRoot) => request.put(`/roots/${id}`, data),
  deleteRoot: (id: number) => request.delete(`/roots/${id}`),
  
  // 智能建议
  getSuggest: (q: string) => request.get<SuggestResponse>(`/suggest?q=${encodeURIComponent(q)}`),
  
  // 字段相关
  createField: (data: any) => request.post('/fields', data),
  getFields: () => request.get('/fields'),
  updateField: (id: number, data: any) => request.put(`/fields/${id}`, data),
  deleteField: (id: number) => request.delete(`/fields/${id}`),

  getFieldDetails: (id: number) => request.get<WordRoot[]>(`/fields/${id}`),
};


