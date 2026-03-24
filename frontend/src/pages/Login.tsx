import { Button, Card, Form, Input, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../hooks/store';
import { login, type LoginRequest } from '../store/authSlice';
import { Logo } from '../components/Logo';

// 装饰性背景元素
const BackgroundDecoration: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {/* 渐变圆形装饰 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '20%',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite',
      }} />
      
      {/* 网格背景 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }} />
    </div>
  );
};

export const Login: React.FC = () => {
  const [form] = Form.useForm<LoginRequest>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.auth.loading);

  const onFinish = async (values: LoginRequest): Promise<void> => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      const role = localStorage.getItem('role');
      message.success({
        content: '登录成功，欢迎回来！',
        icon: '👋',
      });
      if (role === 'ADMIN') {
        navigate('/admin/users', { replace: true });
      } else if (role === 'REVIEW') {
        navigate('/admin/review', { replace: true });
      } else {
        navigate('/creator/upload', { replace: true });
      }
      return;
    }
    message.error(result.payload ?? '登录失败');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundSize: '200% 200%',
      animation: 'gradient-shift 15s ease infinite',
      position: 'relative',
      padding: 24,
    }}>
      <BackgroundDecoration />
      
      {/* 左侧品牌展示区 */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 80,
        maxWidth: 1200,
        width: '100%',
        zIndex: 1,
      }}>
        {/* 左侧：品牌介绍 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          color: 'white',
          maxWidth: 480,
        }} className="fade-in-up">
          <Logo size="large" showText />
          
          <Typography.Title level={2} style={{ 
            color: 'white', 
            marginTop: 16,
            fontWeight: 600,
            lineHeight: 1.4,
          }}>
            跨境短视频
            <br />
            协同管理平台
          </Typography.Title>
          
          <Typography.Paragraph style={{ 
            color: 'rgba(255, 255, 255, 0.85)', 
            fontSize: 16,
            lineHeight: 1.8,
          }}>
            一站式解决跨境短视频创作、审核、发布全流程。
            支持多平台账号管理，团队协作更高效。
          </Typography.Paragraph>
        </div>

        {/* 右侧：登录表单 */}
        <Card 
          style={{ 
            width: 420,
            borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: 'none',
            overflow: 'hidden',
          }}
          bodyStyle={{ padding: 40 }}
          className="fade-in-up"
        >
          <div style={{ marginBottom: 28 }}>
            {/* <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Logo size="medium" showText />
            </div> */}
            <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 8 }}>
              欢迎回来
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              请使用您的账号密码登录系统
            </Typography.Text>
          </div>

          <Form 
            form={form} 
            layout="vertical" 
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item 
              label="用户名" 
              name="username" 
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                size="large"
                autoComplete="username" 
                placeholder="请输入用户名"
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>
            
            <Form.Item 
              label="密码" 
              name="password" 
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                size="large"
                autoComplete="current-password" 
                placeholder="请输入密码"
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                block
                size="large"
                style={{ 
                  borderRadius: 10,
                  height: 48,
                  fontSize: 16,
                  fontWeight: 500,
                }}
                icon={<ArrowRightOutlined />}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
