import { updateUser } from '@/services/users';
import { handleApiResponse } from '@/utils/response';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Button, Form, Input, message } from 'antd';

const ProfilePage: React.FC = () => {
  const { initialState, refresh } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [form] = Form.useForm();

  if (!currentUser) {
    history.push('/login');
    return null;
  }

  const handleSubmit = async (values: {
    uname: string;
    phone: string;
    name: string;
  }) => {
    try {
      const res = await updateUser(String(currentUser.id), {
        uname: values.uname,
        phone: values.phone,
        name: values.name,
        permission: String(currentUser.permission),
      });
      if (handleApiResponse(res)) {
        refresh();
      }
    } catch (error: any) {
      message.error(error?.message || '更新失败');
    }
  };

  return (
    <PageContainer header={{ title: '个人中心' }}>
      <div style={{ maxWidth: 500 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            uname: currentUser.uname,
            phone: currentUser.phone,
            name: currentUser.name,
          }}
        >
          <Form.Item
            name="uname"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
