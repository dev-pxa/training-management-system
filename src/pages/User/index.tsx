import React, { useState } from 'react';
import { Table, Button, Popconfirm, Select, message } from 'antd';
import { Link, Outlet } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';

const { Option } = Select;

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
];

const UserPage: React.FC = () => {
  const [data, setData] = useState(mockData);

  // 处理权限变更
  const handleRoleChange = (value: string, record: any) => {
    const newData = data.map(item => {
      if (item.id === record.id) {
        return { ...item, role: value };
      }
      return item;
    });
    setData(newData);
    message.success('权限已更新');
  };

  // 处理删除
  const handleDelete = (id: number) => {
    const newData = data.filter(item => item.id !== id);
    setData(newData);
    message.success('删除成功');
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '权限',
      dataIndex: 'role',
      key: 'role',
      render: (text: string, record: any) => (
        <Select
          defaultValue={text}
          onChange={(value) => handleRoleChange(value, record)}
          style={{ width: 100 }}
        >
          <Option value="用户">用户</Option>
          <Option value="管理员">管理员</Option>
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
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
      <Table columns={columns} dataSource={data} rowKey="id" />
    </PageContainer>
  );
};

export default UserPage;