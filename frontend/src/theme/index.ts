// 主题配置文件 - CreatorHub 设计系统

export const themeConfig = {
  // 主色调
  token: {
    // 品牌色 - 使用渐变的蓝紫色
    colorPrimary: '#6366f1',
    colorPrimaryHover: '#4f46e5',
    colorPrimaryActive: '#4338ca',
    
    // 辅助色
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // 背景色
    colorBgLayout: '#f8fafc',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    
    // 文字色
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    
    // 边框和分割线
    colorBorder: '#e2e8f0',
    colorSplit: '#f1f5f9',
    
    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
  },
  
  // 组件级配置
  components: {
    // 按钮
    Button: {
      borderRadius: 6,
      paddingInline: 20,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    
    // 卡片
    Card: {
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
    
    // 输入框
    Input: {
      borderRadius: 8,
      paddingInline: 12,
      controlHeight: 40,
    },
    
    // 表格
    Table: {
      borderRadius: 12,
      headerBg: '#f8fafc',
      headerColor: '#475569',
      rowHoverBg: '#f1f5f9',
    },
    
    // 菜单
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 12,
      itemMarginBlock: 4,
    },
    
    // 标签
    Tag: {
      borderRadius: 6,
    },
    
    // 模态框
    Modal: {
      borderRadius: 16,
      padding: 24,
    },
    
    // 选择器
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    
    // 日期选择器
    DatePicker: {
      borderRadius: 8,
      controlHeight: 40,
    },
  },
};

// 登录页主题（渐变主题）
export const loginTheme = {
  // 渐变配色
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    dark: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  
  // 背景图案
  background: {
    pattern: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 20%),\n               radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 20%),\n               radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
  },
};

// 间距系统
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// 阴影系统
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export default themeConfig;
