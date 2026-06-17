import { deleteUser, getUserList } from '@/services/users';
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

const UserPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteUser({ ids: [id] });
      handleApiResponse(res, '删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    const selectedIds = selectedRows.map((row) => row.id);
    try {
      const res = await deleteUser({ ids: selectedIds });
      if (handleApiResponse(res, `成功删除 ${selectedIds.length} 条记录`)) {
        setSelectedRows([]);
        actionRef.current?.reload();
      }
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleAdd = () => {
    history.push('/user/add');
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'uname',
      key: 'uname',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
      valueType: 'select',
      valueEnum: {
        1: { text: '用户' },
        2: { text: '管理员' },
      },
      search: {
        show: true,
        valueEnum: {
          1: { text: '用户' },
          2: { text: '管理员' },
        },
      },
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      render: (_: any, record: any) => (
        <div>
          <Link to={`/user/detail/${record.id}?editable=false`}>
            <Button type="link" style={{ marginRight: 8 }}>
              详情
            </Button>
          </Link>
          <Link to={`/user/detail/${record.id}?editable=true`}>
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
        title: '人员管理',
      }}
    >
      <Outlet />
      <ProTable
        actionRef={actionRef}
        headerTitle="人员列表"
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
          const res = await getUserList({
            queryInfo: {
              name: params.name,
              phone: params.phone,
              uname: params.uname,
              permission:
                params.permission !== undefined
                  ? Number(params.permission)
                  : undefined,
            },
            pageSize: 10,
            pageNum: params.current || 1,
          });

          return {
            data: res?.data?.list || [],
            success: res?.success || true,
            total: res?.data?.total || 0,
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

export default UserPage;
