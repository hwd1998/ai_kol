import { ConfigProvider } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { store } from './store';
import { themeConfig } from './theme';
import './App.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* 简体中文注释：AntD 全局配置 - 使用自定义主题系统 */}
      <ConfigProvider theme={themeConfig}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
);

