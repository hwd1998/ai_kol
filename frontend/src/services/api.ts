import axios from 'axios';

// 简体中文注释：统一 Axios 实例，便于配置拦截器、错误处理与鉴权
export const api = axios.create({
  baseURL: '/api',
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  // 简体中文注释：示例中 token 存 localStorage；生产建议改为更安全的存储策略
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


