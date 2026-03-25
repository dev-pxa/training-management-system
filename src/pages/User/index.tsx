import React, { useRef, useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { Link, Outlet } from '@umijs/max';
import { PageContainer, ProTable, ActionType, FooterToolbar } from '@ant-design/pro-components';

// 模拟数据
const mockData = [
  {
    id: 1,
    username: 'user1',
    phone: '13800138001',
    name: '张三',
    role: '用户',
  },
  {
    id: 2,
    username: 'admin1',
    phone: '13800138002',
    name: '李四',
    role: '管理员',
  },
  {
    id: 3,
    username: 'user2',
    phone: '13800138003',
    name: '王五',
    role: '用户',
  },
  {
    id: 4,
    username: 'user3',
    phone: '13800138004',
    name: '赵六',
    role: '用户',
  },
  {
    id: 5,
    username: 'admin2',
    phone: '13800138005',
    name: '钱七',
    role: '管理员',
  },
  {
    id: 6,
    username: 'user4',
    phone: '13800138006',
    name: '孙八',
    role: '用户',
  },
  {
    id: 7,
    username: 'user5',
    phone: '13800138007',
    name: '周九',
    role: '用户',
  },
  {
    id: 8,
    username: 'admin3',
    phone: '13800138008',
    name: '吴十',
    role: '管理员',
  },
];

const UserPage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // 处理删除
  const handleDelete = (id: number) => {
    const newData = data.filter(item => item.id !== id);
    setData(newData);
    message.success('删除成功');
    actionRef.current?.reload();
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    const selectedIds = selectedRows.map(row => row.id);
    const newData = data.filter(item => !selectedIds.includes(item.id));
    setData(newData);
    message.success(`成功删除 ${selectedIds.length} 条记录`);
    setSelectedRows([]);
    actionRef.current?.reload();
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
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
      dataIndex: 'role',
      key: 'role',
      valueType: 'text',
      search: {
        show: true,
        valueEnum: {
          用户: { text: '用户' },
          管理员: { text: '管理员' },
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
            <Button type="link" style={{ marginRight: 8 }}>详情</Button>
          </Link>
          <Link to={`/user/detail/${record.id}?editable=true`}>
            <Button type="link" style={{ marginRight: 8 }}>编辑</Button>
          </Link>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
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
        rowSelection={{
          onChange: (_, selectedRow) => {
            setSelectedRows(selectedRow);
          },
        }}
        request={async (params) => {
          // 模拟搜索功能
          let filteredData = [...data];
          
          // 处理搜索条件
          if (params.username) {
            filteredData = filteredData.filter(item => 
              item.username.toLowerCase().includes(params.username.toLowerCase())
            );
          }
          if (params.phone) {
            filteredData = filteredData.filter(item => 
              item.phone.includes(params.phone)
            );
          }
          if (params.name) {
            filteredData = filteredData.filter(item => 
              item.name.toLowerCase().includes(params.name.toLowerCase())
            );
          }
          if (params.role) {
            filteredData = filteredData.filter(item => 
              item.role === params.role
            );
          }
          
          // 模拟分页
          const pageSize = params.pageSize || 10;
          const current = params.current || 1;
          const start = (current - 1) * pageSize;
          const end = start + pageSize;
          const paginatedData = filteredData.slice(start, end);
          
          return {
            data: paginatedData,
            success: true,
            total: filteredData.length,
          };
        }}
        columns={columns}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
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
            <Button danger>
              批量删除
            </Button>
          </Popconfirm>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

export default UserPage;