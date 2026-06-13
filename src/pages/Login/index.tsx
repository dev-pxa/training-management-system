import useAuth from '@/hooks/useAuth';
import {
  getLoginConfig,
  loginByPassword,
  loginBySms,
  sendSmsCode,
} from '@/services/auth';
import { handleApiResponse } from '@/utils/response';
import {
  BankOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Form, Input, Select, Tabs, message } from 'antd';
import React, { useEffect, useState } from 'react';

const LoginPage: React.FC = () => {
  const { refresh } = useAuth();
  const [activeTab, setActiveTab] = useState('password');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [companies, setCompanies] = useState<AuthAPI.Company[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchLoginConfig = async () => {
      try {
        setConfigLoading(true);
        const res = await getLoginConfig();
        if (res?.code === 0) {
          const companyList = res.data?.companies || [];
          setCompanies(companyList);
          if (companyList.length > 0) {
            form.setFieldsValue({ companyCode: companyList[0].code });
          }
        } else {
          message.error(res?.des || res?.desc || '获取登录配置失败');
        }
      } catch {
        message.error('获取登录配置失败，请稍后重试');
      } finally {
        setConfigLoading(false);
      }
    };

    fetchLoginConfig();
  }, [form]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    try {
      await form.validateFields(['phone']);
      const phone = form.getFieldValue('phone');
      setSending(true);
      const res = await sendSmsCode({ phone });
      if (handleApiResponse(res, '验证码已发送')) {
        startCountdown();
      }
    } catch {
      // validation failed
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (values: {
    companyCode: string;
    phone: string;
    password?: string;
    code?: string;
  }) => {
    try {
      let res;
      if (activeTab === 'password') {
        res = await loginByPassword({
          companyCode: values.companyCode,
          phone: values.phone,
          password: values.password!,
        });
      } else {
        res = await loginBySms({
          companyCode: values.companyCode,
          phone: values.phone,
          code: values.code!,
        });
      }
      if (handleApiResponse(res, '登录成功')) {
        await refresh();
        history.push('/');
      }
    } catch {
      message.error('登录失败，请稍后重试');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <div
        style={{
          width: 400,
          padding: '40px 32px',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 32 }}>培训管理系统</h2>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            form.resetFields(['password', 'code']);
          }}
          centered
          items={[
            {
              key: 'password',
              label: '密码登录',
            },
            {
              key: 'sms',
              label: '验证码登录',
            },
          ]}
        />
        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item
            name="companyCode"
            rules={[{ required: true, message: '请选择公司' }]}
          >
            <Select
              loading={configLoading}
              placeholder="请选择公司"
              suffixIcon={<BankOutlined />}
              options={companies.map((company) => ({
                label: company.name,
                value: company.code,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input prefix={<MobileOutlined />} placeholder="请输入手机号" />
          </Form.Item>

          {activeTab === 'password' ? (
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="code"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="请输入验证码"
                suffix={
                  <Button
                    type="link"
                    size="small"
                    disabled={countdown > 0}
                    loading={sending}
                    onClick={handleSendCode}
                    style={{ padding: 0 }}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                }
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
