import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import { ClockCircleOutlined, DownloadOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React from 'react';

import { TableEllipsisText } from '../../components/TableEllipsisText';
import { useAppSelector } from '../../hooks/store';
import { api } from '../../services/api';

/* ---------- 类型 ---------- */

interface SocialAccountOption {
  id: number;
  accountName: string;
  platform: { name: string; region: string };
}

interface ContentItem {
  id: number;
  filePath: string;
  fileOriginalName: string;
  productName: string;
  description: string;
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

interface UploadMetaForm {
  targetAccountIds: number[];
  productName: string;
  description: string;
  scheduledTime: Dayjs;
}

interface InitUploadResponse {
  uploadId: string;
  chunkSize: number;
  uploadedChunks: number[];
}

interface MergeUploadResponse {
  filePath: string;
}

const STATUS_CONFIG: Record<ContentItem['status'], { label: string; color: string }> = {
  PENDING_REVIEW: { label: '待审核', color: 'default' },
  APPROVED: { label: '待发布', color: 'blue' },
  REJECTED: { label: '已驳回', color: 'red' },
  PUBLISHED: { label: '已发布', color: 'green' },
};

function formatTargetAccountLabel(acct: ContentItem['targetAccount']): string {
  if (!acct) return '';
  const plat = acct.platform;
  return plat ? `${plat.name}(${plat.region}) - ${acct.accountName}` : acct.accountName;
}

/* ---------- 组件 ---------- */

export const CreatorUploadPage: React.FC = () => {
  const role = useAppSelector((state) => state.auth.role);
  const [form] = Form.useForm<UploadMetaForm>();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [accounts, setAccounts] = React.useState<SocialAccountOption[]>([]);
  const [products, setProducts] = React.useState<{ id: number; name: string }[]>([]);
  const [list, setList] = React.useState<ContentItem[]>([]);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [previewTitle, setPreviewTitle] = React.useState('');

  const [filterTargetAccountId, setFilterTargetAccountId] = React.useState<number | undefined>(undefined);
  const [filterProductName, setFilterProductName] = React.useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = React.useState<string | undefined>(undefined);
  const [filterScheduledRange, setFilterScheduledRange] = React.useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [rejectDetailOpen, setRejectDetailOpen] = React.useState(false);
  const [rejectDetailContent, setRejectDetailContent] = React.useState<string>('');

  const loadAccounts = React.useCallback(async () => {
    const res = await api.get<SocialAccountOption[]>('/social-accounts/options');
    setAccounts(res.data);
  }, []);

  const loadProducts = React.useCallback(async () => {
    const res = await api.get<{ id: number; name: string }[]>('/products');
    setProducts(res.data);
  }, []);

  const loadList = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = role === 'ADMIN' ? '/contents' : '/contents/mine';
      const res = await api.get<ContentItem[]>(endpoint);
      setList(res.data);
    } finally {
      setLoading(false);
    }
  }, [role]);

  React.useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadAccounts(), loadProducts(), loadList()]);
      } catch (err) {
        message.error(err instanceof Error ? err.message : '加载失败');
      }
    })();
  }, [loadAccounts, loadProducts, loadList]);

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
    const map = new Map<number, ContentItem['targetAccount']>();
    for (const r of list) {
      if (r.targetAccount && !map.has(r.targetAccount.id)) {
        map.set(r.targetAccount.id, r.targetAccount);
      }
    }
    return Array.from(map.values()).filter(Boolean) as NonNullable<ContentItem['targetAccount']>[];
  }, [list]);

  const uniqueProductNames = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      if (r.productName) set.add(r.productName);
    }
    return Array.from(set).sort();
  }, [list]);

  /* ---- 上传逻辑 ---- */

  const handleUpload = async (): Promise<void> => {
    const values = await form.validateFields();
    const file = videoFile;
    if (!file) {
      message.error('请先选择视频文件');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'mp4' && ext !== 'mov') {
      message.error('仅支持 mp4 / mov 格式');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const init = await api.post<InitUploadResponse>('/uploads/init', {
        originalName: file.name,
        fileSize: file.size,
        ext,
      });
      const { uploadId, chunkSize, uploadedChunks } = init.data;
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < totalChunks; i += 1) {
        if (uploadedChunks.includes(i)) {
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 90));
          continue;
        }
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        const fd = new FormData();
        fd.append('uploadId', uploadId);
        fd.append('index', String(i));
        fd.append('file', chunk, `${file.name}.part`);
        await api.put('/uploads/chunk', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 90));
      }

      setUploadProgress(95);
      const merged = await api.post<MergeUploadResponse>('/uploads/merge', {
        uploadId,
        totalChunks,
        originalName: file.name,
      });

      for (const targetAccountId of values.targetAccountIds) {
        await api.post('/contents', {
          targetAccountId,
          filePath: merged.data.filePath,
          fileOriginalName: file.name,
          productName: values.productName,
          description: values.description ?? '',
          scheduledTime: values.scheduledTime.toISOString(),
        });
      }

      setUploadProgress(100);
      const count = values.targetAccountIds.length;
      message.success(count > 1 ? `已创建 ${count} 条内容，等待审核` : '上传成功，等待审核');
      setModalOpen(false);
      form.resetFields();
      setVideoFile(null);
      await loadList();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  /* ---- 发布操作 ---- */

  const handlePublishNow = async (id: number): Promise<void> => {
    try {
      await api.post(`/contents/${id}/mock-publish`);
      message.success('发布成功');
      await loadList();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '发布失败');
    }
  };

  const handleSchedulePublish = async (id: number): Promise<void> => {
    try {
      await api.post(`/contents/${id}/schedule-publish`);
      message.success('已设置按计划发布，到达计划时间后自动发布');
      await loadList();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '设置失败');
    }
  };

  /* ---- 表格列 ---- */

  const columns: ColumnsType<ContentItem> = [
    {
      title: '上传人',
      width: 100,
      render: (_, r) => <TableEllipsisText text={r.uploader?.username} />,
    },
    {
      title: '目标账号',
      width: 200,
      render: (_, r) => <TableEllipsisText text={formatTargetAccountLabel(r.targetAccount) || undefined} />,
    },
    {
      title: '产品名称',
      width: 120,
      render: (_: unknown, r: ContentItem) => <TableEllipsisText text={r.productName} />,
    },
    {
      title: '视频文案',
      width: 200,
      render: (_: unknown, r: ContentItem) => <TableEllipsisText text={r.description} />,
    },
    {
      title: '视频',
      width: 160,
      align: 'center' as const,
      render: (_: unknown, r: ContentItem) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              setPreviewUrl(`/uploads/${r.filePath}`);
              setPreviewTitle(r.fileOriginalName || '视频预览');
              setPreviewOpen(true);
            }}
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
      title: '计划发布时间',
      width: 170,
      render: (_, r) =>
        r.scheduledTime ? dayjs(r.scheduledTime).format('YYYY-MM-DD HH:mm') : '-',
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
      title: '创建时间',
      width: 170,
      render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '发布',
      width: 220,
      fixed: 'right',
      render: (_: unknown, r: ContentItem) => {
        if (r.status === 'PUBLISHED') {
          return   <Button
          size="small"
          icon={<SendOutlined />}
          disabled={true}
        >
         已发布
        </Button>;
        }
        if (r.status === 'REJECTED') {
          return   <Button
          size="small"
          icon={<ClockCircleOutlined />}
          disabled={true}
        >
         已驳回
        </Button>;
        }
        if (r.status === 'PENDING_REVIEW') {
          return   <Button
          size="small"
          icon={<ClockCircleOutlined />}
          disabled={true}
        >
         待审核
        </Button>;
        }
        return (
          <Space size={4}>
            <Popconfirm
              title="确认立即发布？"
              description="发布后状态不可撤回"
              onConfirm={() => void handlePublishNow(r.id)}
              okText="确认发布"
              cancelText="取消"
            >
              <Button size="small" type="primary" icon={<SendOutlined />}>
                立即发布
              </Button>
            </Popconfirm>
            <Popconfirm
              title="确认按计划发布？"
              description="到达计划时间后将自动发布"
              onConfirm={() => void handleSchedulePublish(r.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                size="small"
                icon={<ClockCircleOutlined />}
                disabled={r.publishMode === 'SCHEDULED'}
              >
                {r.publishMode === 'SCHEDULED' ? '已计划发布' : '按计划发布'}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  /* ---- 渲染 ---- */

  return (
    <div style={{ width: '100%' }}>
      {/* 筛选和操作区域 */}
      <div style={{ 
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
      }}>
        <Space direction="vertical" size={12} style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>筛选条件</div>
          <Space wrap size={8}>
            <Select
              allowClear
              placeholder="目标账号"
              showSearch
              optionFilterProp="label"
              style={{ width: 220 }}
              value={filterTargetAccountId}
              onChange={setFilterTargetAccountId}
              options={uniqueTargetAccounts.map((a) => ({
                label: a.platform ? `${a.platform.name}(${a.platform.region}) - ${a.accountName}` : a.accountName,
                value: a.id,
              }))}
            />
            <Select
              allowClear
              placeholder="产品名称"
              showSearch
              optionFilterProp="label"
              style={{ width: 160 }}
              value={filterProductName}
              onChange={setFilterProductName}
              options={uniqueProductNames.map((n) => ({ label: n, value: n }))}
            />
            <Select
              allowClear
              placeholder="发布状态"
              style={{ width: 130 }}
              value={filterStatus}
              onChange={setFilterStatus}
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
              onChange={(dates) => setFilterScheduledRange(dates as [Dayjs | null, Dayjs | null] | null)}
            />
          </Space>
        </Space>
        
        <Space direction="vertical" size={12} align="end">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>操作</div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadList()}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              上传视频
            </Button>
          </Space>
        </Space>
      </div>

      <Table<ContentItem>
        rowKey="id"
        loading={loading}
        dataSource={filteredList}
        columns={columns}
        pagination={{ 
          pageSize: 10, 
          showTotal: (t) => `共 ${t} 条`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        size="middle"
        scroll={{ x: 1400 }}
        style={{ background: '#fff', borderRadius: 12 }}
      />

      {/* 上传弹窗 */}
      <Modal
        title={<div style={{ fontSize: 18, fontWeight: 600 }}>上传视频</div>}
        open={modalOpen}
        width={600}
        styles={{ 
          body: { padding: '24px 28px' },
        }}
        onCancel={() => {
          if (!uploading) {
            setModalOpen(false);
            form.resetFields();
            setVideoFile(null);
            setUploadProgress(0);
          }
        }}
        footer={[
          <Button key="cancel" disabled={uploading} onClick={() => setModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={() => void handleUpload()}
            size="large"
          >
            开始上传
          </Button>,
        ]}
        maskClosable={false}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="目标账号"
            name="targetAccountIds"
            rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个目标账号' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择发布目标账号（可多选，将发布到多个平台）"
              showSearch
              optionFilterProp="label"
              options={accounts.map((a) => ({
                label: `${a.platform.name}(${a.platform.region}) - ${a.accountName}`,
                value: a.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="产品名称"
            name="productName"
            rules={[{ required: true, message: '请选择产品名称' }]}
          >
            <Select
              placeholder="选择产品"
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({ label: p.name, value: p.name }))}
            />
          </Form.Item>
          <Form.Item
            label="视频文案"
            name="description"
            rules={[{ required: true, message: '请输入视频文案' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入视频文案" />
          </Form.Item>
          <Form.Item
            label="计划发布时间"
            name="scheduledTime"
            rules={[{ required: true, message: '请选择计划发布时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="选择日期和时间"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="视频文件"
            required
            extra="支持 mp4 / mov 格式"
          >
            <Upload
              maxCount={1}
              accept=".mp4,.mov"
              beforeUpload={(f) => {
                setVideoFile(f);
                return false;
              }}
              onRemove={() => setVideoFile(null)}
              fileList={
                videoFile
                  ? [{ uid: 'selected', name: videoFile.name, status: 'done' as const }]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>

        {uploading && (
          <Progress
            percent={uploadProgress}
            status={uploadProgress < 100 ? 'active' : 'success'}
            style={{ marginTop: 8 }}
          />
        )}
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
        title={<div style={{ fontSize: 16, fontWeight: 600, color: '#dc2626' }}>驳回原因</div>}
        footer={null}
        onCancel={() => setRejectDetailOpen(false)}
        width={520}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          fontSize: 14,
          lineHeight: 1.8,
          color: '#374151',
          background: '#fef2f2',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #fecaca',
        }}>
          {rejectDetailContent || '暂无驳回原因'}
        </div>
      </Modal>
    </div>
  );
};
