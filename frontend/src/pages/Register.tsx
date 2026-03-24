import { Button, Card, Divider, Form, Input, Space, Typography, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register, type RegisterRequest } from '../store/userSlice';
import { useAppDispatch, useAppSelector } from '../hooks/store';
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
        top: '15%',
        right: '10%',
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
        animation: 'float 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        animation: 'float 11s ease-in-out infinite reverse',
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

export const Register: React.FC = () => {
  const [form] = Form.useForm<RegisterRequest>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector((s) => s.user.loading);

  const onFinish = async (values: RegisterRequest): Promise<void> => {
    const result = await dispatch(register(values));
    if (register.fulfilled.match(result)) {
      message.success({
        content: '注册成功！请使用新账号登录',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
      return;
    }
    message.error(result.payload ?? '注册失败');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%)',
      backgroundSize: '200% 200%',
      animation: 'gradient-shift 15s ease infinite',
      position: 'relative',
      padding: 24,
    }}>
      <BackgroundDecoration />
      
      {/* 返回登录按钮 */}
      <Link to="/login" style={{ textDecoration: 'none' }}>
        <Button 
          type="link"
          icon={<ArrowLeftOutlined />}
          style={{
            position: 'absolute',
            top: 32,
            left: 32,
            color: 'white',
            fontSize: 16,
            zIndex: 10,
          }}
        >
          返回登录
        </Button>
      </Link>
      
      <Card 
        style={{ 
          width: 480,
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: 'none',
          overflow: 'hidden',
          zIndex: 1,
        }}
        bodyStyle={{ padding: 48 }}
        className="fade-in-up"
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size="large" showText={false} />
          <Typography.Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            创建新账号
          </Typography.Title>
          <Typography.Text type="secondary">
            填写以下信息即可开始使用
          </Typography.Text>
        </div>

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          requiredMark={false}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Form.Item 
              label="用户名" 
              name="username" 
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少 3 位' },
                { max: 50, message: '用户名最多 50 位' },
              ]}
            >
              <Input 
                size="large"
                placeholder="请输入用户名"
                autoComplete="username"
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item 
              label="邮箱" 
              name="email" 
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            >
              <Input 
                size="large"
                placeholder="请输入邮箱地址"
                autoComplete="email"
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item 
              label="密码" 
              name="password" 
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少 8 位' },
                { max: 100, message: '密码最多 100 位' },
              ]}
            >
              <Input.Password 
                size="large"
                placeholder="设置密码（至少8位）"
                autoComplete="new-password"
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item 
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password 
                size="large"
                placeholder="再次输入密码"
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>
          </Space>
          
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
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
            >
              立即注册
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '32px 0' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            已有账号？
          </Typography.Text>
        </Divider>

        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button 
            block
            size="large"
            style={{ 
              borderRadius: 10,
              height: 48,
            }}
          >
            直接登录
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default Register;
