import {
  Button,
  Descriptions,
  DatePicker,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React from 'react';

import { TableEllipsisText } from '../../components/TableEllipsisText';
import { api } from '../../services/api';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: '登录',
  UPLOAD: '上传视频',
  REVIEW_APPROVE: '审核通过',
  REVIEW_REJECT: '审核驳回',
  MOCK_PUBLISH: '模拟发布',
  USER_CREATE: '创建用户',
  USER_SET_ENABLED: '用户启用/禁用',
  PLATFORM_CREATE: '创建平台',
  PLATFORM_SET_ENABLED: '平台启用/禁用',
  PRODUCT_CREATE: '创建产品',
  PRODUCT_SET_ENABLED: '产品启用/禁用',
  SOCIAL_ACCOUNT_CREATE: '创建账号簿',
  SOCIAL_ACCOUNT_SET_STATUS: '账号簿启用/禁用',
};

function actionTagColor(action: string): string {
  if (action === 'LOGIN') return 'blue';
  if (action === 'UPLOAD') return 'cyan';
  if (action.startsWith('REVIEW_')) return 'gold';
  if (action === 'MOCK_PUBLISH') return 'green';
  if (
    action.endsWith('_SET_ENABLED') ||
    action === 'SOCIAL_ACCOUNT_SET_STATUS' ||
    action.endsWith('_CREATE')
  )
    return 'geekblue';
  return 'default';
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: '待审核',
  APPROVED: '待发布',
  REJECTED: '已驳回',
  PUBLISHED: '已发布',
};

type AuditActionType =
  | 'LOGIN'
  | 'UPLOAD'
  | 'REVIEW_APPROVE'
  | 'REVIEW_REJECT'
  | 'MOCK_PUBLISH'
  | 'USER_CREATE'
  | 'USER_SET_ENABLED'
  | 'PLATFORM_CREATE'
  | 'PLATFORM_SET_ENABLED'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_SET_ENABLED'
  | 'SOCIAL_ACCOUNT_CREATE'
  | 'SOCIAL_ACCOUNT_SET_STATUS';

interface AuditItem {
  id: number;
  actionType: AuditActionType;
  targetId: number | null;
  targetDisplayName?: string | null;
  createdAt: string;
  details?: Record<string, unknown> | null;
  user?: {
    username: string;
  };
}

export const AdminAuditLogPage: React.FC = () => {
  const [actionType, setActionType] = React.useState<string | undefined>(undefined);
  const [rows, setRows] = React.useState<AuditItem[]>([]);
  const [timeRange, setTimeRange] = React.useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState<AuditItem | null>(null);

  const load = React.useCallback(async (): Promise<void> => {
    const params: Record<string, string> = {};
    if (actionType) params.actionType = actionType;
    if (timeRange?.[0]) params.startAt = timeRange[0].toISOString();
    if (timeRange?.[1]) params.endAt = timeRange[1].toISOString();
    setLoading(true);
    try {
      const res = await api.get<AuditItem[]>('/audit-logs', { params });
      setRows(res.data);
    } finally {
      setLoading(false);
    }
  }, [actionType, timeRange]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const formatDetails = (item: AuditItem): React.ReactNode => {
    const d = item.details ?? {};
    const productName = (d.productName as string | undefined) ?? '-';
    const videoName = (d.fileOriginalName as string | undefined) ?? '-';
    const prevStatus = STATUS_LABELS[String(d.previousStatus ?? '')] ?? String(d.previousStatus ?? '-');
    const newStatus = STATUS_LABELS[String(d.newStatus ?? '')] ?? String(d.newStatus ?? '-');

    const descLabelStyle = { width: 100, minWidth: 100 };

    if (item.actionType === 'REVIEW_APPROVE') {
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label="产品">{productName}</Descriptions.Item>
          <Descriptions.Item label="视频名">{videoName}</Descriptions.Item>
          <Descriptions.Item label="状态">{prevStatus} → {newStatus}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (item.actionType === 'REVIEW_REJECT') {
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label="产品">{productName}</Descriptions.Item>
          <Descriptions.Item label="视频名">{videoName}</Descriptions.Item>
          <Descriptions.Item label="原因">{String(d.rejectReason ?? '-')}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (item.actionType === 'MOCK_PUBLISH') {
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label="产品">{productName}</Descriptions.Item>
          <Descriptions.Item label="视频名">{videoName}</Descriptions.Item>
          <Descriptions.Item label="发布时间">{String(d.publishedAt ?? '-')}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (item.actionType === 'UPLOAD') {
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label="产品">{productName}</Descriptions.Item>
          <Descriptions.Item label="视频名">{videoName}</Descriptions.Item>
          <Descriptions.Item label="文件路径">{String(d.filePath ?? '-')}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (item.actionType === 'LOGIN') {
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label="角色">{String(d.role ?? '-')}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (
      item.actionType === 'USER_SET_ENABLED' ||
      item.actionType === 'PLATFORM_SET_ENABLED' ||
      item.actionType === 'PRODUCT_SET_ENABLED'
    ) {
      const prev = d.previousEnabled === true ? '启用' : d.previousEnabled === false ? '禁用' : String(d.previousEnabled ?? '-');
      const next = d.enabled === true ? '启用' : d.enabled === false ? '禁用' : String(d.enabled ?? '-');
      const title =
        item.actionType === 'USER_SET_ENABLED'
          ? '用户名'
          : item.actionType === 'PLATFORM_SET_ENABLED'
            ? '平台'
            : '产品';
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label={title}>{String(d.displayName ?? d.username ?? d.name ?? '-')}</Descriptions.Item>
          <Descriptions.Item label="状态变更">{prev} → {next}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (item.actionType === 'SOCIAL_ACCOUNT_SET_STATUS') {
      const prev = String(d.previousStatus ?? '-') === 'ACTIVE' ? '启用' : String(d.previousStatus ?? '-') === 'DISABLED' ? '禁用' : String(d.previousStatus ?? '-');
      const next = String(d.newStatus ?? '-') === 'ACTIVE' ? '启用' : String(d.newStatus ?? '-') === 'DISABLED' ? '禁用' : String(d.newStatus ?? '-');
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          <Descriptions.Item label="账号">{String(d.displayName ?? d.accountName ?? '-')}</Descriptions.Item>
          <Descriptions.Item label="状态变更">{prev} → {next}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (Object.keys(d).length > 0) {
      return (
        <Descriptions column={1} size="small" bordered labelStyle={descLabelStyle}>
          {Object.entries(d).map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>
              {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')}
            </Descriptions.Item>
          ))}
        </Descriptions>
      );
    }
    return <span style={{ color: '#8c8c8c' }}>无</span>;
  };

  return (
    <div style={{ width: '100%' }}>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <Space direction="vertical" size={12} style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>筛选条件</div>
          <Space wrap size={8}>
            <Select
              allowClear
              style={{ width: 220 }}
              placeholder="动作类型"
              value={actionType}
              onChange={(v) => setActionType(v)}
              options={[
                { value: 'LOGIN', label: '登录' },
                { value: 'UPLOAD', label: '上传视频' },
                { value: 'REVIEW_APPROVE', label: '审核通过' },
                { value: 'REVIEW_REJECT', label: '审核驳回' },
                { value: 'MOCK_PUBLISH', label: '模拟发布' },
                { value: 'USER_CREATE', label: '创建用户' },
                { value: 'USER_SET_ENABLED', label: '用户启用/禁用' },
                { value: 'PLATFORM_CREATE', label: '创建平台' },
                { value: 'PLATFORM_SET_ENABLED', label: '平台启用/禁用' },
                { value: 'PRODUCT_CREATE', label: '创建产品' },
                { value: 'PRODUCT_SET_ENABLED', label: '产品启用/禁用' },
                { value: 'SOCIAL_ACCOUNT_CREATE', label: '创建账号簿' },
                { value: 'SOCIAL_ACCOUNT_SET_STATUS', label: '账号簿启用/禁用' },
              ]}
            />
            <DatePicker.RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              value={timeRange}
              allowClear
              onChange={(dates) => setTimeRange(dates as [Dayjs | null, Dayjs | null] | null)}
              style={{ minWidth: 280 }}
            />
          </Space>
        </Space>

        <Space direction="vertical" size={12} align="end">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>操作</div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      <Table<AuditItem>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={false}
        size="middle"
        scroll={{ x: 1000 }}
        locale={{ emptyText: '暂无数据，请调整筛选条件或刷新' }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 72, align: 'center' },
          {
            title: '操作人',
            width: 112,
            render: (_, r) => <TableEllipsisText text={r.user?.username} />,
          },
          {
            title: '动作',
            width: 148,
            render: (_, r) => (
              <Tag color={actionTagColor(r.actionType)} style={{ margin: 0 }}>
                {ACTION_LABELS[r.actionType] ?? r.actionType}
              </Tag>
            ),
          },
          {
            title: '目标 / 账号',
            width: 240,
            render: (_, r) => (
              <TableEllipsisText text={r.targetDisplayName ?? undefined} />
            ),
          },
          {
            title: '时间',
            dataIndex: 'createdAt',
            width: 172,
            render: (v: string) => (
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#475569' }}>
                {dayjs(v).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            ),
          },
          {
            title: '详情',
            width: 96,
            fixed: 'right',
            align: 'center',
            render: (_, r) => (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => {
                  setDetailItem(r);
                  setDetailOpen(true);
                }}
              >
                查看
              </Button>
            ),
          },
        ]}
      />

      <Modal
        open={detailOpen}
        title="操作详情"
        width={520}
        footer={null}
        onCancel={() => setDetailOpen(false)}
        styles={{ body: { paddingTop: 12 } }}
      >
        {detailItem && formatDetails(detailItem)}
      </Modal>
    </div>
  );
};

