import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 简体中文注释：后端地址，可通过 VITE_PROXY_TARGET 覆盖（如后端端口非 3000）
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    // 简体中文注释：监听所有网卡，允许局域网设备通过本机 IP 访问开发服务
    host: '0.0.0.0',
    port: 5173,
    // 简体中文注释：开发环境代理，将前端 /api 请求转发到后端
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});

