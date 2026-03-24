import { Avatar, Badge, Button, Divider, Dropdown, Form, Input, Layout, Menu, Modal, Space, Tag, Tooltip, Typography, message } from 'antd';
import {
  DashboardOutlined,
  CloudUploadOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  BellOutlined,
} from '@ant-design/icons';
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../hooks/store';
import { api } from '../services/api';
import { logout, setProfileUsername, type Role } from '../store/authSlice';
import { Logo } from './Logo';

const { Header, Sider, Content } = Layout;

interface AppShellProps {
  role: Role;
}

// 菜单图标映射
const menuIcons: Record<string, React.ReactNode> = {
  '/admin/users': <SettingOutlined />,
  '/admin/audit-logs': <AuditOutlined />,
  '/admin/upload': <CloudUploadOutlined />,
  '/admin/review': <SafetyCertificateOutlined />,
  '/creator/upload': <CloudUploadOutlined />,
};

export const AppShell: React.FC<AppShellProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((s) => s.auth.username);
  const displayName = username ?? '未命名用户';
  const roleLabel = role === 'ADMIN' ? '管理员' : role === 'REVIEW' ? '审核员' : '达人';
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileForm] = Form.useForm<{ username: string; email: string; newPassword?: string }>();

  const adminItems = [
    { key: '/admin/users', label: '系统管理', icon: <SettingOutlined /> },
    { key: '/admin/audit-logs', label: '审计日志', icon: <AuditOutlined /> },
    { key: '/admin/upload', label: '视频上传', icon: <CloudUploadOutlined /> },
    { key: '/admin/review', label: '视频审核', icon: <SafetyCertificateOutlined /> },
  ];
  const creatorItems = [
    { key: '/creator/upload', label: '视频上传', icon: <CloudUploadOutlined /> },
  ];
  const reviewItems = [
    { key: '/admin/review', label: '视频审核', icon: <SafetyCertificateOutlined /> },
  ];
  const items = role === 'ADMIN' ? adminItems : role === 'REVIEW' ? reviewItems : creatorItems;
  
  const titleMap: Record<string, string> = {
    '/admin/users': '系统管理',
    '/admin/audit-logs': '审计日志',
    '/admin/review': '视频审核',
    '/admin/upload': '视频上传',
    '/creator/upload': '视频上传',
  };
  const pageTitle = titleMap[location.pathname] ?? '控制台';

  // 角色标签颜色
  const roleColors: Record<Role, string> = {
    ADMIN: 'blue',
    REVIEW: 'gold',
    CREATOR: 'purple',
  };

  const openProfile = async (): Promise<void> => {
    try {
      const res = await api.get<{ username: string; email: string }>('/user/profile');
      profileForm.resetFields();
      profileForm.setFieldsValue({
        username: res.data.username,
        email: res.data.email,
      });
      setProfileOpen(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载个人信息失败');
    }
  };

  const saveProfile = async (): Promise<void> => {
    const values = await profileForm.validateFields();
    const payload = {
      username: values.username,
      email: values.email,
      ...(values.newPassword ? { newPassword: values.newPassword } : {}),
    };
    setProfileSaving(true);
    try {
      await api.patch('/user/profile', payload);
      dispatch(setProfileUsername(values.username));
      message.success('个人信息已更新');
      setProfileOpen(false);
      profileForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新个人信息失败');
    } finally {
      setProfileSaving(false);
    }
  };

  // 用户下拉菜单
  const userDropdownItems = [
    {
      key: 'profile',
      icon: <EditOutlined />,
      label: '编辑资料',
      onClick: openProfile,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#ef4444' }} />,
      label: <span style={{ color: '#ef4444' }}>退出登录</span>,
      onClick: () => {
        dispatch(logout());
        navigate('/login', { replace: true });
      },
    },
  ];

  return (
    <Layout style={{ height: '100vh', background: '#f1f5f9' }}>
      {/* 侧边栏 */}
      <Sider 
        width={260} 
        style={{ 
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}
      >
        {/* Logo区域 */}
        <div style={{ 
          padding: '24px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Logo size="small" showText={false} />
          <div>
            <Typography.Title level={5} style={{ color: '#fff', margin: 0, fontSize: 16 }}>
              CreatorHub
            </Typography.Title>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
              跨境短视频协同管理
            </Typography.Text>
          </div>
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            style: {
              margin: '4px 12px',
              borderRadius: 8,
            },
          }))}
          style={{ 
            paddingTop: 16,
            background: 'transparent',
            border: 'none',
          }}
          onClick={(e) => navigate(e.key)}
        />

        {/* 侧边栏底部信息 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            CreatorHub v0.1.0
          </Typography.Text>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout>
        {/* Header */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            zIndex: 99,
          }}
        >
          {/* 左侧：页面标题和面包屑 */}
          <Space size={16} align="center">
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {pageTitle}
            </Typography.Title>
            <Tag color={roleColors[role]} style={{ fontWeight: 500 }}>
              {roleLabel}
            </Tag>
          </Space>

          {/* 右侧：用户操作区 */}
          <Space size={20} align="center">
            {/* 通知图标 */}
            {/* <Tooltip title="通知">
              <Badge count={0} dot>
                <Button 
                  type="text" 
                  icon={<BellOutlined style={{ fontSize: 18, color: '#64748b' }} />} 
                  style={{ width: 40, height: 40 }}
                />
              </Badge>
            </Tooltip> */}

            <Divider type="vertical" style={{ height: 24, margin: 0 }} />

            {/* 用户信息下拉菜单 */}
            <Dropdown
              menu={{ items: userDropdownItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }} className="hover:bg-gray-50">
                <Avatar
                  size={36}
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    fontWeight: 600,
                  }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    {displayName}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {roleLabel}
                  </Typography.Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区 */}
        <Content style={{ 
          margin: 20, 
          overflow: 'auto',
          padding: 4,
        }}>
          <div
            style={{
              minHeight: '100%',
              padding: 24,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* 编辑个人信息弹窗 */}
      <Modal
        title="编辑个人信息"
        open={profileOpen}
        onCancel={() => {
          setProfileOpen(false);
          profileForm.resetFields();
        }}
        onOk={() => {
          void saveProfile();
        }}
        okText="保存"
        cancelText="取消"
        confirmLoading={profileSaving}
        destroyOnClose
        width={480}
      >
        <Form form={profileForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '至少 3 个字符' },
            ]}
          >
            <Input size="large" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input size="large" />
          </Form.Item>
          <Divider style={{ margin: '24px 0' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              修改密码（可选）
            </Typography.Text>
          </Divider>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[{ min: 6, message: '至少 6 位' }]}
          >
            <Input.Password size="large" placeholder="不修改可留空" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value: string | undefined) {
                  const pwd = getFieldValue('newPassword') as string | undefined;
                  if (!pwd && !value) return Promise.resolve();
                  if (pwd && !value) return Promise.reject(new Error('请确认新密码'));
                  if (value !== pwd) return Promise.reject(new Error('两次输入的密码不一致'));
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AppShell;
