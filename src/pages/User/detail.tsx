import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from '@umijs/max';
import { Form, Input, Select, Button, message, Modal, InputNumber } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { CopyOutlined } from '@ant-design/icons';

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

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const editable = location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [userData, setUserData] = useState<any>(null);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // 模拟获取用户数据
    const user = mockData.find(item => item.id === parseInt(id));
    if (user) {
      setUserData(user);
      form.setFieldsValue(user);
    }
  }, [id, form]);

  // 复制用户名
  const handleCopyUsername = () => {
    navigator.clipboard.writeText(userData?.username || '');
    message.success('用户名已复制');
  };

  // 打开手机号更改弹窗
  const handleOpenPhoneModal = () => {
    setNewPhone('');
    setVerificationCode('');
    setCountdown(0);
    setPhoneModalVisible(true);
  };

  // 发送验证码
  const handleSendVerificationCode = () => {
    if (!newPhone) {
      message.error('请输入新手机号');
      return;
    }
    // 模拟发送验证码
    message.success('验证码已发送');
    // 开始倒计时
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 确认更改手机号
  const handleConfirmPhoneChange = () => {
    if (!newPhone) {
      message.error('请输入新手机号');
      return;
    }
    if (!verificationCode) {
      message.error('请输入验证码');
      return;
    }
    // 模拟更改手机号
    form.setFieldsValue({ phone: newPhone });
    setPhoneModalVisible(false);
    message.success('手机号已更改');
  };

  const handleSubmit = (values: any) => {
    message.success('保存成功');
    console.log('保存的数据:', values);
  };

  if (!userData) {
    return <div>加载中...</div>;
  }

  return (
    <PageContainer
      header={{
        title: editable ? '编辑用户' : '用户详情',
      }}
    >
      <div style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={userData}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              disabled 
              suffix={
                <CopyOutlined 
                  onClick={handleCopyUsername} 
                  style={{ cursor: 'pointer' }} 
                />
              } 
            />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input 
              disabled 
              suffix={
                editable && (
                  <Button 
                    type="link" 
                    onClick={handleOpenPhoneModal}
                  >
                    更改
                  </Button>
                )
              } 
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input disabled={!editable} />
          </Form.Item>
          <Form.Item
            name="role"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select disabled={!editable}>
              <Option value="用户">用户</Option>
              <Option value="管理员">管理员</Option>
            </Select>
          </Form.Item>
          {editable && (
            <Form.Item>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>

      {/* 手机号更改弹窗 */}
      <Modal
        title="更改手机号"
        open={phoneModalVisible}
        onCancel={() => setPhoneModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPhoneModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handleConfirmPhoneChange}
          >
            确认
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>更改前手机号：{userData.phone}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Input
              placeholder="更改后手机号"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              onClick={handleSendVerificationCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
            </Button>
          </div>
          <Input
            placeholder="验证码"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
        </div>
      </Modal>
    </PageContainer>
  );
};

export default UserDetailPage;