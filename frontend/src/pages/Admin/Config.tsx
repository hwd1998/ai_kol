import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  UserOutlined,
  GlobalOutlined,
  TeamOutlined,
  ShoppingOutlined,
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

import { TableEllipsisText } from '../../components/TableEllipsisText';
import { api } from '../../services/api';

/* ---------- 类型定义 ---------- */

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: 'CREATOR' | 'REVIEW' | 'ADMIN';
  isEnabled: boolean;
  createdAt: string;
}

interface PlatformItem {
  id: number;
  name: string;
  region: string;
  isEnabled: boolean;
}

interface AccountItem {
  id: number;
  platformId: number;
  accountName: string;
  loginUsername: string;
  remark: string;
  status: 'ACTIVE' | 'DISABLED';
  platform?: PlatformItem;
}

interface ProductItem {
  id: number;
  name: string;
  isEnabled: boolean;
  createdAt: string;
}

const ROLE_MAP: Record<UserItem['role'], { label: string; color: string }> = {
  ADMIN: { label: '管理员', color: 'blue' },
  REVIEW: { label: '审核员', color: 'gold' },
  CREATOR: { label: '达人', color: 'purple' },
};

function currentUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: number | string };
    const n = Number(json.sub);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/* ---------- 组件 ---------- */

export const AdminConfigPage: React.FC = () => {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [platforms, setPlatforms] = React.useState<PlatformItem[]>([]);
  const [accounts, setAccounts] = React.useState<AccountItem[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);

  const [userModalOpen, setUserModalOpen] = React.useState(false);
  const [platformModalOpen, setPlatformModalOpen] = React.useState(false);
  const [accountModalOpen, setAccountModalOpen] = React.useState(false);
  const [productModalOpen, setProductModalOpen] = React.useState(false);

  const [editPlatRow, setEditPlatRow] = React.useState<PlatformItem | null>(null);
  const [editAcctRow, setEditAcctRow] = React.useState<AccountItem | null>(null);
  const [editProdRow, setEditProdRow] = React.useState<ProductItem | null>(null);
  const [userEnableSavingId, setUserEnableSavingId] = React.useState<number | null>(null);

  const [userForm] = Form.useForm<{
    username: string;
    email: string;
    password: string;
    role: UserItem['role'];
    isEnabled: boolean;
  }>();
  const [platformForm] = Form.useForm<{ name: string; region: string; isEnabled: boolean }>();
  const [accountForm] = Form.useForm<{
    platformId: number;
    accountName: string;
    loginUsername: string;
    remark: string;
    enabled: boolean;
  }>();
  const [productForm] = Form.useForm<{ name: string; isEnabled: boolean }>();

  /* ---- 加载 ---- */

  const loadUsers = React.useCallback(async () => {
    const res = await api.get<UserItem[]>('/user/list');
    setUsers(res.data);
  }, []);

  const loadConfig = React.useCallback(async () => {
    const [p, a, prod] = await Promise.all([
      api.get<PlatformItem[]>('/platforms'),
      api.get<AccountItem[]>('/social-accounts'),
      api.get<ProductItem[]>('/products'),
    ]);
    setPlatforms(p.data);
    setAccounts(a.data);
    setProducts(prod.data);
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadUsers(), loadConfig()]);
      } catch (err) {
        message.error(err instanceof Error ? err.message : '加载失败');
      }
    })();
  }, [loadUsers, loadConfig]);

  /* ---- 用户创建 ---- */

  const createUser = async (): Promise<void> => {
    const values = await userForm.validateFields();
    await api.post('/user/admin-create', {
      ...values,
      isEnabled: values.isEnabled !== false,
    });
    message.success('用户创建成功');
    setUserModalOpen(false);
    userForm.resetFields();
    await loadUsers();
  };

  const patchUserEnabled = async (id: number, isEnabled: boolean): Promise<void> => {
    const selfId = currentUserIdFromToken();
    if (!isEnabled && selfId !== null && selfId === id) {
      message.warning('不能禁用当前登录账号');
      return;
    }
    setUserEnableSavingId(id);
    try {
      await api.patch(`/user/admin/${id}`, { isEnabled });
      message.success('已更新');
      await loadUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setUserEnableSavingId(null);
    }
  };

  /* ---- 平台新建 ---- */

  const createPlatform = async (): Promise<void> => {
    const values = await platformForm.validateFields();
    await api.post('/platforms', {
      ...values,
      isEnabled: values.isEnabled !== false,
    });
    message.success('平台创建成功');
    setPlatformModalOpen(false);
    platformForm.resetFields();
    await loadConfig();
  };

  /* ---- 平台行内保存 ---- */

  const savePlatformRow = async (row: PlatformItem): Promise<void> => {
    if (!row.name.trim() || !row.region.trim()) {
      message.warning('平台名称和区域不能为空');
      return;
    }
    try {
      await api.patch(`/platforms/${row.id}`, {
        name: row.name,
        region: row.region,
        isEnabled: row.isEnabled !== false,
      });
      message.success('平台更新成功');
      setEditPlatRow(null);
      await loadConfig();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败');
    }
  };

  /* ---- 账号新建 ---- */

  const createAccount = async (): Promise<void> => {
    const values = await accountForm.validateFields();
    const payload = {
      platformId: values.platformId,
      accountName: values.accountName,
      loginUsername: values.loginUsername,
      remark: values.remark ?? '',
      status: values.enabled ? 'ACTIVE' : 'DISABLED',
    };
    // #region agent log
    void fetch('http://127.0.0.1:7918/ingest/1bae37b7-29e7-49de-89ca-f4fad6e9694e', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '700d9f',
      },
      body: JSON.stringify({
        sessionId: '700d9f',
        runId: 'prefix',
        hypothesisId: 'H1',
        location: 'frontend/src/pages/Admin/Config.tsx:createAccount',
        message: 'social-accounts payload keys/status',
        data: {
          hasEnabled: Object.prototype.hasOwnProperty.call(payload as Record<string, unknown>, 'enabled'),
          status: payload.status,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    await api.post('/social-accounts', payload);
    message.success('账号创建成功');
    setAccountModalOpen(false);
    accountForm.resetFields();
    await loadConfig();
  };

  /* ---- 账号行内保存 ---- */

  const saveAccountRow = async (row: AccountItem): Promise<void> => {
    if (!row.accountName.trim()) {
      message.warning('账号昵称不能为空');
      return;
    }
    try {
      await api.patch(`/social-accounts/${row.id}`, {
        platformId: row.platformId,
        accountName: row.accountName,
        loginUsername: row.loginUsername,
        remark: row.remark,
        status: row.status,
      });
      message.success('账号更新成功');
      setEditAcctRow(null);
      await loadConfig();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败');
    }
  };

  /* ---- 产品新建 ---- */

  const createProduct = async (): Promise<void> => {
    const values = await productForm.validateFields();
    await api.post('/products', {
      ...values,
      isEnabled: values.isEnabled !== false,
    });
    message.success('产品创建成功');
    setProductModalOpen(false);
    productForm.resetFields();
    await loadConfig();
  };

  /* ---- 产品行内保存 ---- */

  const saveProductRow = async (row: ProductItem): Promise<void> => {
    if (!row.name.trim()) {
      message.warning('产品名称不能为空');
      return;
    }
    try {
      await api.patch(`/products/${row.id}`, {
        name: row.name,
        isEnabled: row.isEnabled !== false,
      });
      message.success('产品更新成功');
      setEditProdRow(null);
      await loadConfig();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败');
    }
  };

  /* ---- 统计 ---- */

  const statByRole = (role: UserItem['role']): number => users.filter((u) => u.role === role).length;

  /* ---- 表格列 ---- */

  const userColumns: ColumnsType<UserItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 140,
      render: (v: string) => <TableEllipsisText text={v} />,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 220,
      render: (v: string) => <TableEllipsisText text={v} />,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      align: 'center',
      render: (v: UserItem['role']) => <Tag color={ROLE_MAP[v].color}>{ROLE_MAP[v].label}</Tag>,
    },
    {
      title: '启用',
      width: 88,
      align: 'center',
      render: (_, r) => (
        <Switch
          checked={r.isEnabled !== false}
          loading={userEnableSavingId === r.id}
          onChange={(checked) => void patchUserEnabled(r.id, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ];

  const platformColumns: ColumnsType<PlatformItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    {
      title: '平台名称',
      dataIndex: 'name',
      render: (v: string, r) => {
        if (editPlatRow?.id === r.id) {
          return (
            <Input
              size="small"
              value={editPlatRow.name}
              onChange={(e) => setEditPlatRow({ ...editPlatRow, name: e.target.value })}
              onPressEnter={() => void savePlatformRow(editPlatRow)}
            />
          );
        }
        return <TableEllipsisText text={v} />;
      },
    },
    {
      title: '区域',
      dataIndex: 'region',
      width: 140,
      render: (v: string, r) => {
        if (editPlatRow?.id === r.id) {
          return (
            <Input
              size="small"
              value={editPlatRow.region}
              onChange={(e) => setEditPlatRow({ ...editPlatRow, region: e.target.value })}
              onPressEnter={() => void savePlatformRow(editPlatRow)}
            />
          );
        }
        return <TableEllipsisText text={v} />;
      },
    },
    {
      title: '启用',
      width: 88,
      align: 'center',
      render: (_, r) => {
        if (editPlatRow?.id === r.id) {
          return (
            <Switch
              checked={editPlatRow.isEnabled !== false}
              onChange={(v) => setEditPlatRow({ ...editPlatRow, isEnabled: v })}
            />
          );
        }
        return r.isEnabled !== false ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>;
      },
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      render: (_, r) => {
        if (editPlatRow?.id === r.id) {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => void savePlatformRow(editPlatRow)}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setEditPlatRow(null)}
              >
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditPlatRow({ ...r, isEnabled: r.isEnabled !== false })}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  const accountColumns: ColumnsType<AccountItem> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    {
      title: '平台',
      width: 170,
      render: (_, r) => {
        if (editAcctRow?.id === r.id) {
          return (
            <Select
              size="small"
              value={editAcctRow.platformId}
              onChange={(v) => setEditAcctRow({ ...editAcctRow, platformId: v })}
              options={platforms.map((p) => ({ label: `${p.name} (${p.region})`, value: p.id }))}
              style={{ width: '100%' }}
            />
          );
        }
        return (
          <TableEllipsisText text={`${r.platform?.name ?? '-'} (${r.platform?.region ?? '-'})`} />
        );
      },
    },
    {
      title: '账号昵称',
      dataIndex: 'accountName',
      width: 120,
      render: (v: string, r) => {
        if (editAcctRow?.id === r.id) {
          return (
            <Input
              size="small"
              value={editAcctRow.accountName}
              onChange={(e) => setEditAcctRow({ ...editAcctRow, accountName: e.target.value })}
            />
          );
        }
        return <TableEllipsisText text={v} />;
      },
    },
    {
      title: '达人名称',
      dataIndex: 'loginUsername',
      width: 120,
      render: (v: string, r) => {
        if (editAcctRow?.id === r.id) {
          return (
            <Input
              size="small"
              value={editAcctRow.loginUsername}
              onChange={(e) => setEditAcctRow({ ...editAcctRow, loginUsername: e.target.value })}
            />
          );
        }
        return <TableEllipsisText text={v} />;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 160,
      render: (v: string, r) => {
        if (editAcctRow?.id === r.id) {
          return (
            <Input
              size="small"
              value={editAcctRow.remark}
              onChange={(e) => setEditAcctRow({ ...editAcctRow, remark: e.target.value })}
            />
          );
        }
        return <TableEllipsisText text={v} />;
      },
    },
    {
      title: '是否启用',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (v: AccountItem['status'], r) => {
        if (editAcctRow?.id === r.id) {
          return (
            <Switch
              checked={editAcctRow.status === 'ACTIVE'}
              onChange={(checked) =>
                setEditAcctRow({
                  ...editAcctRow,
                  status: checked ? 'ACTIVE' : 'DISABLED',
                })
              }
            />
          );
        }
        return v === 'ACTIVE' ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>;
      },
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      render: (_, r) => {
        if (editAcctRow?.id === r.id) {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => void saveAccountRow(editAcctRow)}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setEditAcctRow(null)}
              >
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditAcctRow({ ...r })}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  const productColumns: ColumnsType<ProductItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    {
      title: '产品名称',
      dataIndex: 'name',
      render: (v: string, r) => {
        if (editProdRow?.id === r.id) {
          return (
            <Input
              size="small"
              value={editProdRow.name}
              onChange={(e) => setEditProdRow({ ...editProdRow, name: e.target.value })}
              onPressEnter={() => void saveProductRow(editProdRow)}
            />
          );
        }
        return <TableEllipsisText text={v} />;
      },
    },
    {
      title: '启用',
      width: 88,
      align: 'center',
      render: (_, r) => {
        if (editProdRow?.id === r.id) {
          return (
            <Switch
              checked={editProdRow.isEnabled !== false}
              onChange={(v) => setEditProdRow({ ...editProdRow, isEnabled: v })}
            />
          );
        }
        return r.isEnabled !== false ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      render: (_: unknown, r: ProductItem) => {
        if (editProdRow?.id === r.id) {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => void saveProductRow(editProdRow)}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setEditProdRow(null)}
              >
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditProdRow({ ...r, isEnabled: r.isEnabled !== false })}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  /* ---- Tab 面板 ---- */

  const tabItems = [
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined /> 用户账号
        </span>
      ),
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="总用户" value={users.length} prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="管理员" value={statByRole('ADMIN')} valueStyle={{ color: '#1677ff' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="审核员" value={statByRole('REVIEW')} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="达人" value={statByRole('CREATOR')} valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
          </Row>
          <div style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalOpen(true)}>
              新建用户
            </Button>
          </div>
          <Table<UserItem>
            rowKey="id"
            dataSource={users}
            columns={userColumns}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            size="middle"
          />
        </>
      ),
    },
    {
      key: 'platforms',
      label: (
        <span>
          <GlobalOutlined /> 平台管理
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                platformForm.resetFields();
                platformForm.setFieldsValue({ isEnabled: true });
                setPlatformModalOpen(true);
              }}
            >
              新建平台
            </Button>
          </div>
          <Table<PlatformItem>
            rowKey="id"
            dataSource={platforms}
            columns={platformColumns}
            pagination={false}
            size="middle"
          />
        </>
      ),
    },
    {
      key: 'accounts',
      label: (
        <span>
          <TeamOutlined /> 账号簿
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                accountForm.resetFields();
                accountForm.setFieldsValue({ enabled: true });
                setAccountModalOpen(true);
              }}
            >
              新建账号
            </Button>
          </div>
          <Table<AccountItem>
            rowKey="id"
            dataSource={accounts}
            columns={accountColumns}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            size="middle"
          />
        </>
      ),
    },
    {
      key: 'products',
      label: (
        <span>
          <ShoppingOutlined /> 产品管理
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                productForm.resetFields();
                productForm.setFieldsValue({ isEnabled: true });
                setProductModalOpen(true);
              }}
            >
              新建产品
            </Button>
          </div>
          <Table<ProductItem>
            rowKey="id"
            dataSource={products}
            columns={productColumns}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            size="middle"
          />
        </>
      ),
    },
  ];

  /* ---- 渲染 ---- */

  return (
    <div style={{ width: '100%' }}>
      <Tabs defaultActiveKey="users" items={tabItems} />

      {/* 新建用户弹窗 */}
      <Modal
        title="新建用户"
        open={userModalOpen}
        onCancel={() => { setUserModalOpen(false); userForm.resetFields(); }}
        onOk={() => void createUser()}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={userForm} layout="vertical" initialValues={{ role: 'CREATOR', isEnabled: true }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '至少 3 个字符' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item label="初始密码" name="password" rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="请设置初始密码" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={[
              { value: 'CREATOR', label: '达人 (CREATOR)' },
              { value: 'REVIEW', label: '审核员 (REVIEW)' },
              { value: 'ADMIN', label: '管理员 (ADMIN)' },
            ]} />
          </Form.Item>
          <Form.Item label="是否启用" name="isEnabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            创建后，用户即可使用该用户名和密码登录系统。
          </Typography.Text>
        </Form>
      </Modal>

      {/* 新建平台弹窗 */}
      <Modal
        title="新建平台"
        open={platformModalOpen}
        onCancel={() => { setPlatformModalOpen(false); platformForm.resetFields(); }}
        onOk={() => void createPlatform()}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={platformForm} layout="vertical" initialValues={{ isEnabled: true }}>
          <Form.Item label="平台名称" name="name" rules={[{ required: true, message: '请输入平台名称' }]}>
            <Input placeholder="例如 TikTok" />
          </Form.Item>
          <Form.Item label="区域" name="region" rules={[{ required: true, message: '请输入区域' }]}>
            <Input placeholder="例如 US" />
          </Form.Item>
          <Form.Item label="是否启用" name="isEnabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建账号弹窗 */}
      <Modal
        title="新建账号"
        open={accountModalOpen}
        onCancel={() => { setAccountModalOpen(false); accountForm.resetFields(); }}
        onOk={() => void createAccount()}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={accountForm} layout="vertical" initialValues={{ enabled: true }}>
          <Form.Item label="关联平台" name="platformId" rules={[{ required: true, message: '请选择平台' }]}>
            <Select placeholder="选择平台" options={platforms.map((p) => ({ label: `${p.name} (${p.region})`, value: p.id }))} />
          </Form.Item>
          <Form.Item label="账号昵称" name="accountName" rules={[{ required: true, message: '请输入账号昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="达人名称" name="loginUsername" rules={[{ required: true, message: '请输入达人名称' }]}>
            <Input placeholder="例如：达人A / Creator_A" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建产品弹窗 */}
      <Modal
        title="新建产品"
        open={productModalOpen}
        onCancel={() => { setProductModalOpen(false); productForm.resetFields(); }}
        onOk={() => void createProduct()}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={productForm} layout="vertical" initialValues={{ isEnabled: true }}>
          <Form.Item label="产品名称" name="name" rules={[{ required: true, message: '请输入产品名称' }, { min: 2, message: '至少 2 个字符' }]}>
            <Input placeholder="例如：面霜" />
          </Form.Item>
          <Form.Item label="是否启用" name="isEnabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
