import {
  ResourceListItem,
  deleteResource,
  getResourceList,
} from '@/services/resource';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import { Link, Outlet, history } from '@umijs/max';
import { Button, Popconfirm, message } from 'antd';
import React, { useRef, useState } from 'react';

const ResourcePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<ResourceListItem[]>([]);

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

  const columns = [
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
      valueType: 'text',
      ellipsis: true,
      hideInSearch: true,
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
              type: params.type !== undefined ? Number(params.type) : undefined,
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
    </PageContainer>
  );
};

export default ResourcePage;
