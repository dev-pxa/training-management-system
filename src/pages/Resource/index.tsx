import {
  ResourceListItem,
  deleteResource,
  getResourceList,
} from '@/services/resource';
import { handleApiResponse } from '@/utils/response';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import { SpecialZoomLevel, Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Link, Outlet, history } from '@umijs/max';
import { Button, Empty, Image, Modal, Popconfirm, message } from 'antd';
import React, { useRef, useState } from 'react';

const pdfWorkerUrl = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const resourceTypeLabels: Record<number, string> = {
  0: '图片资源',
  1: '视频资源',
  2: 'PDF资源',
};

const PdfPreview: React.FC<{ fileUrl: string }> = ({ fileUrl }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div
      style={{
        width: '100%',
        height: '70vh',
        border: '1px solid #f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <Worker workerUrl={pdfWorkerUrl}>
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageWidth}
          plugins={[defaultLayoutPluginInstance]}
        />
      </Worker>
    </div>
  );
};

const renderPreviewContent = (resource?: ResourceListItem) => {
  if (!resource?.contentUrl) {
    return <Empty description="暂无可预览内容" />;
  }

  if (resource.type === 0) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Image
          src={resource.contentUrl}
          alt={resource.name}
          style={{ maxWidth: '100%', maxHeight: '70vh' }}
          preview={{ src: resource.contentUrl }}
        />
      </div>
    );
  }

  if (resource.type === 1) {
    return (
      <video
        src={resource.contentUrl}
        controls
        style={{ width: '100%', maxHeight: '70vh' }}
      />
    );
  }

  if (resource.type === 2) {
    return <PdfPreview fileUrl={resource.contentUrl} />;
  }

  return <Empty description="暂不支持预览该资源类型" />;
};

const ResourcePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<ResourceListItem[]>([]);
  const [previewResource, setPreviewResource] = useState<ResourceListItem>();

  const handleDelete = async (id: number) => {
    const res = await deleteResource({ ids: [id] });
    if (handleApiResponse(res)) {
      actionRef.current?.reload();
    }
  };

  const handleBatchDelete = async () => {
    const selectedIds = selectedRows.map((row) => row.id);
    const res = await deleteResource({ ids: selectedIds });
    if (handleApiResponse(res)) {
      setSelectedRows([]);
      actionRef.current?.reload();
    }
  };

  const handleAdd = () => {
    history.push('/resource/add');
  };

  const columns: any[] = [
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      valueType: 'select',
      search: {
        show: true,
        valueEnum: {
          0: { text: '图片资源' },
          1: { text: '视频资源' },
          2: { text: 'PDF资源' },
        },
      },
      valueEnum: {
        0: { text: '图片资源' },
        1: { text: '视频资源' },
        2: { text: 'PDF资源' },
      },
    },
    {
      title: '资源内容',
      dataIndex: 'contentUrl',
      key: 'contentUrl',
      hideInSearch: true,
      render: (_: any, record: ResourceListItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          disabled={!record.contentUrl}
          onClick={() => setPreviewResource(record)}
        >
          预览
        </Button>
      ),
    },
    {
      title: '作者',
      dataIndex: 'owner',
      key: 'owner',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      width: 280,
      hideInSearch: true,
      render: (_: any, record: ResourceListItem) => (
        <div>
          <Link to={`/resource/detail/${record.id}?editable=false`}>
            <Button type="link" style={{ marginRight: 8 }}>
              详情
            </Button>
          </Link>
          <Link to={`/resource/detail/${record.id}?editable=true`}>
            <Button type="link" style={{ marginRight: 8 }}>
              编辑
            </Button>
          </Link>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '资源管理',
      }}
    >
      <Outlet />
      <ProTable<ResourceListItem>
        actionRef={actionRef}
        headerTitle="资源列表"
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>,
        ]}
        rowSelection={{
          onChange: (_, selectedRow) => {
            setSelectedRows(selectedRow);
          },
        }}
        request={async (params) => {
          const res = await getResourceList({
            queryInfo: {
              name: params.name,
              type:
                params.type !== undefined
                  ? String(Number(params.type))
                  : undefined,
              owner: params.owner,
            },
            pageSize: 10,
            pageNum: params.current || 1,
          });

          if (res.code !== 0) {
            message.error(res.des || '获取列表失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }

          return {
            data: res.data.list || [],
            success: true,
            total: res.data.total || 0,
          };
        }}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: true,
        }}
      />
      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> 项
            </div>
          }
        >
          <Popconfirm
            title={`确定要删除选中的 ${selectedRows.length} 条记录吗？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button danger>批量删除</Button>
          </Popconfirm>
        </FooterToolbar>
      )}
      <Modal
        title={
          previewResource
            ? `${previewResource.name}（${
                resourceTypeLabels[previewResource.type] || '资源'
              }）`
            : '资源预览'
        }
        open={!!previewResource}
        footer={null}
        width={900}
        destroyOnClose
        onCancel={() => setPreviewResource(undefined)}
      >
        <div style={{ minHeight: 360 }}>
          {renderPreviewContent(previewResource)}
        </div>
      </Modal>
    </PageContainer>
  );
};

export default ResourcePage;
