import { addUser, getUserDetail, updateUser } from '@/services/users';
import { handleApiResponse } from '@/utils/response';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import { Button, Form, Input, message, Select } from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAddMode = location.pathname === '/user/add';
  const editable = isAddMode || location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isAddMode);

  useEffect(() => {
    if (!isAddMode) {
      const fetchData = async () => {
        try {
          const res = await getUserDetail(id);
          if (res?.code === 0 && res?.data) {
            form.setFieldsValue({
              uname: res.data.uname,
              phone: res.data.phone,
              name: res.data.name,
              permission: res.data.permission,
            });
          } else if (res?.code !== 0) {
            message.error(res?.des || res?.desc || '获取用户信息失败');
          }
        } catch (error: any) {
          message.error(error?.message || '获取用户信息失败');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, form, isAddMode]);

  const handleSubmit = async (values: any) => {
    try {
      let res;
      if (isAddMode) {
        res = await addUser({
          uname: values.uname,
          phone: values.phone,
          name: values.name,
          permission: values.permission,
        });
      } else {
        res = await updateUser(id, {
          uname: values.uname,
          phone: values.phone,
          name: values.name,
          permission: values.permission,
        });
      }

      if (handleApiResponse(res)) {
        history.push('/user');
      }
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <PageContainer
      header={{
        title: isAddMode ? '添加用户' : editable ? '编辑用户' : '用户详情',
      }}
    >
      <div style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="uname"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!editable} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input disabled={!editable} placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input disabled={!editable} placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="permission"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select disabled={!editable} placeholder="请选择权限">
              <Option value={0}>用户</Option>
              <Option value={1}>管理员</Option>
            </Select>
          </Form.Item>

          {editable && (
            <Form.Item>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </PageContainer>
  );
};

export default UserDetailPage;
