import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import React from 'react';

import { TableEllipsisText } from '../../components/TableEllipsisText';
import { api } from '../../services/api';

/* ---------- 类型 ---------- */

interface ReviewItem {
  id: number;
  productName: string;
  description: string;
  filePath: string;
  fileOriginalName: string;
  scheduledTime: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  publishMode: 'MANUAL' | 'SCHEDULED' | null;
  rejectReason: string | null;
  createdAt: string;
  uploader?: { id: number; username: string };
  targetAccount?: {
    id: number;
    accountName: string;
    platform?: { name: string; region: string };
  };
}

const STATUS_CONFIG: Record<ReviewItem['status'], { label: string; color: string }> = {
  PENDING_REVIEW: { label: '待审核', color: 'default' },
  APPROVED: { label: '待发布', color: 'blue' },
  REJECTED: { label: '已驳回', color: 'red' },
  PUBLISHED: { label: '已发布', color: 'green' },
};

function formatTargetAccountLabel(acct: ReviewItem['targetAccount']): string {
  if (!acct) return '';
  const plat = acct.platform;
  return plat ? `${plat.name}(${plat.region}) - ${acct.accountName}` : acct.accountName;
}

/* ---------- 组件 ---------- */

export const AdminReviewBoardPage: React.FC = () => {
  const [list, setList] = React.useState<ReviewItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [filterTargetAccountId, setFilterTargetAccountId] = React.useState<number | undefined>(undefined);
  const [filterProductName, setFilterProductName] = React.useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = React.useState<string | undefined>(undefined);
  const [filterScheduledRange, setFilterScheduledRange] =
    React.useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectingId, setRejectingId] = React.useState<number | null>(null);
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [previewTitle, setPreviewTitle] = React.useState('');

  const [rejectDetailOpen, setRejectDetailOpen] = React.useState(false);
  const [rejectDetailContent, setRejectDetailContent] = React.useState<string>('');

  const loadList = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get<ReviewItem[]>('/contents');
      setList(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredList = React.useMemo(() => {
    let result = list;
    if (filterTargetAccountId != null) {
      result = result.filter((r) => r.targetAccount?.id === filterTargetAccountId);
    }
    if (filterProductName != null && filterProductName !== '') {
      result = result.filter((r) => r.productName === filterProductName);
    }
    if (filterStatus != null && filterStatus !== '') {
      result = result.filter((r) => r.status === filterStatus);
    }
    if (filterScheduledRange != null && filterScheduledRange[0] && filterScheduledRange[1]) {
      const [start, end] = filterScheduledRange;
      const startMs = start.valueOf();
      const endMs = end.valueOf();
      result = result.filter((r) => {
        const t = dayjs(r.scheduledTime).valueOf();
        return t >= startMs && t <= endMs;
      });
    }
    return result;
  }, [list, filterTargetAccountId, filterProductName, filterStatus, filterScheduledRange]);

  const uniqueTargetAccounts = React.useMemo(() => {
    const map = new Map<number, NonNullable<ReviewItem['targetAccount']>>();
    for (const r of list) {
      if (r.targetAccount && !map.has(r.targetAccount.id)) {
        map.set(r.targetAccount.id, r.targetAccount);
      }
    }
    return Array.from(map.values());
  }, [list]);

  const uniqueProductNames = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      if (r.productName) set.add(r.productName);
    }
    return Array.from(set).sort();
  }, [list]);

  const approve = async (id: number): Promise<void> => {
    await api.post(`/contents/${id}/approve`);
    message.success('审核通过');
    await loadList();
  };

  const openReject = (id: number): void => {
    setRejectingId(id);
    setRejectModalOpen(true);
  };

  const reject = async (): Promise<void> => {
    if (!rejectingId) return;
    const values = await rejectForm.validateFields();
    await api.post(`/contents/${rejectingId}/reject`, values);
    message.success('已驳回');
    setRejectModalOpen(false);
    setRejectingId(null);
    rejectForm.resetFields();
    await loadList();
  };

  const openPreview = (item: ReviewItem): void => {
    setPreviewUrl(`/uploads/${item.filePath}`);
    setPreviewTitle(item.fileOriginalName || '视频预览');
    setPreviewOpen(true);
  };

  /* ---- 列 ---- */

  const columns: ColumnsType<ReviewItem> = [
    {
      title: '达人',
      width: 100,
      render: (_, r) => <TableEllipsisText text={r.uploader?.username} />,
    },
    {
      title: '目标账号',
      width: 200,
      render: (_, r) => <TableEllipsisText text={formatTargetAccountLabel(r.targetAccount) || undefined} />,
    },
    {
      title: '产品',
      width: 120,
      render: (_: unknown, r: ReviewItem) => <TableEllipsisText text={r.productName} />,
    },
    {
      title: '状态',
      width: 160,
      render: (_, r) => {
        const cfg = STATUS_CONFIG[r.status];
        const modeTag =
          r.publishMode === 'SCHEDULED' && r.status === 'APPROVED' ? (
            <Tag color="cyan" style={{ marginLeft: 4 }}>按计划</Tag>
          ) : null;
        if (r.status === 'REJECTED') {
          const reason = r.rejectReason ?? '-';
          return (
            <Space size={4}>
              <Tag color={cfg.color}>{cfg.label}</Tag>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => {
                  setRejectDetailContent(reason);
                  setRejectDetailOpen(true);
                }}
              >
                查看详情
              </Button>
            </Space>
          );
        }
        return (
          <>
            <Tag color={cfg.color}>{cfg.label}</Tag>
            {modeTag}
          </>
        );
      },
    },
    {
      title: '视频文案',
      width: 200,
      render: (_: unknown, r: ReviewItem) => <TableEllipsisText text={r.description} />,
    },
    {
      title: '计划发布',
      width: 150,
      render: (_, r) =>
        r.scheduledTime ? dayjs(r.scheduledTime).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '视频',
      width: 160,
      align: 'center',
      render: (_, r) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => openPreview(r)}
          >
            播放
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              const a = document.createElement('a');
              a.href = `/uploads/${r.filePath}`;
              a.download = r.fileOriginalName || 'video';
              a.click();
            }}
          >
            下载
          </Button>
        </Space>
      ),
    },
   
    {
      title: '创建时间',
      width: 150,
      render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button
            size="small"
            disabled={r.status !== 'PENDING_REVIEW'}
            onClick={() => {
              Modal.confirm({
                title: '确认通过审核？',
                content: '通过后该内容将进入「待发布」状态，请确认无误。',
                okText: '确认通过',
                cancelText: '取消',
                onOk: () => approve(r.id),
              });
            }}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            disabled={r.status === 'PUBLISHED'}
            onClick={() => openReject(r.id)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  /* ---- 渲染 ---- */

  return (
    <div style={{ width: '100%' }}>
      {/* 筛选和操作区域 */}
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
        <Space direction="vertical" size={12} style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>筛选条件</div>
          <Space wrap size={8}>
            <Select
              allowClear
              placeholder="目标账号"
              style={{ width: 220 }}
              value={filterTargetAccountId}
              onChange={(v) => setFilterTargetAccountId(v)}
              options={uniqueTargetAccounts.map((a) => ({
                label: a.platform
                  ? `${a.platform.name}(${a.platform.region}) - ${a.accountName}`
                  : a.accountName,
                value: a.id,
              }))}
            />
            <Select
              allowClear
              placeholder="产品名称"
              style={{ width: 160 }}
              value={filterProductName}
              onChange={(v) => setFilterProductName(v)}
              options={uniqueProductNames.map((n) => ({ label: n, value: n }))}
            />
            <Select
              allowClear
              placeholder="发布状态"
              style={{ width: 130 }}
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
              options={[
                { value: 'PENDING_REVIEW', label: '待审核' },
                { value: 'APPROVED', label: '待发布' },
                { value: 'REJECTED', label: '已驳回' },
                { value: 'PUBLISHED', label: '已发布' },
              ]}
            />
            <DatePicker.RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              value={filterScheduledRange}
              onChange={(dates) =>
                setFilterScheduledRange(dates as [Dayjs | null, Dayjs | null] | null)
              }
            />
          </Space>
        </Space>

        <Space direction="vertical" size={12} align="end">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>操作</div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadList()}>
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      <Table<ReviewItem>
        rowKey="id"
        loading={loading}
        dataSource={filteredList}
        columns={columns}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        size="middle"
        scroll={{ x: 1380 }}
        style={{ background: '#fff', borderRadius: 12 }}
      />

      {/* 驳回弹窗 */}
      <Modal
        open={rejectModalOpen}
        title="驳回原因"
        onCancel={() => {
          setRejectModalOpen(false);
          rejectForm.resetFields();
        }}
        onOk={() => void reject()}
        okText="确认驳回"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="驳回原因"
            name="rejectReason"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入驳回原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 视频预览弹窗 */}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        width={720}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewUrl('');
        }}
        destroyOnClose
      >
        {previewUrl && (
          <video
            src={previewUrl}
            controls
            autoPlay
            style={{ width: '100%', maxHeight: 480, background: '#000' }}
          >
            浏览器不支持视频播放
          </video>
        )}
      </Modal>

      {/* 驳回详情弹窗 */}
      <Modal
        open={rejectDetailOpen}
        title="驳回详情"
        footer={null}
        onCancel={() => setRejectDetailOpen(false)}
      >
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {rejectDetailContent}
        </div>
      </Modal>
    </div>
  );
};
