import { uploadResourceFile } from '@/services/resource';
import { updateUser, updateUserPassword } from '@/services/users';
import { handleApiResponse } from '@/utils/response';
import { LockOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
  Avatar,
  Button,
  Form,
  Image,
  Input,
  message,
  Modal,
  Upload,
  UploadFile,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Dragger } = Upload;

const allowedAvatarTypes = ['.png', '.jpg', '.jpeg', '.webp'];

const validatePasswordStrength = (password?: string) => {
  if (!password || password.length < 6) {
    return false;
  }

  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  return checks.filter(Boolean).length >= 3;
};

const ProfilePage: React.FC = () => {
  const { initialState, refresh, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string>();

  useEffect(() => {
    setAvatarUrl(currentUser?.avatarUrl);
  }, [currentUser?.avatarUrl]);

  if (!currentUser) {
    history.push('/login');
    return null;
  }

  const buildProfilePayload = (
    values: Partial<{
      uname: string;
      phone: string;
      name: string;
    }>,
    profileAvatarUrl = avatarUrl ?? currentUser.avatarUrl,
  ) => ({
    uname: values.uname || currentUser.uname,
    phone: values.phone || currentUser.phone,
    name: values.name || currentUser.name,
    permission: String(currentUser.permission),
    avatarUrl: profileAvatarUrl,
  });

  const handleSubmit = async (values: {
    uname: string;
    phone: string;
    name: string;
  }) => {
    try {
      const payload = buildProfilePayload(values);
      const res = await updateUser(String(currentUser.id), payload);
      if (handleApiResponse(res)) {
        setInitialState?.((state: { currentUser?: AuthAPI.UserInfo }) => ({
          ...state,
          currentUser: {
            ...currentUser,
            ...payload,
            permission: currentUser.permission,
          },
        }));
        refresh();
      }
    } catch (error: any) {
      message.error(error?.message || '更新失败');
    }
  };

  const handleOpenAvatarModal = () => {
    setPendingAvatarUrl(avatarUrl);
    setAvatarModalOpen(true);
  };

  const handleCancelAvatarModal = () => {
    setAvatarModalOpen(false);
    setPendingAvatarUrl(undefined);
  };

  const handleOpenPasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handleCancelPasswordModal = () => {
    setPasswordModalOpen(false);
    passwordForm.resetFields();
  };

  const beforeAvatarUpload = (file: UploadFile) => {
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedAvatarTypes.some((type) =>
      fileName.endsWith(type),
    );
    if (!isAllowed) {
      message.error(`仅支持上传图片格式：${allowedAvatarTypes.join('、')}`);
      return false;
    }

    const fileSize = (file.size ?? 0) / 1024 / 1024;
    if (fileSize > 5) {
      message.error('头像文件大小不能超过5MB');
      return false;
    }
    return true;
  };

  const handleAvatarUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    if (!file) {
      onError?.('文件不存在');
      return;
    }

    try {
      const res = await uploadResourceFile(file as File);
      if (res.code === 0 && res.data?.url) {
        setPendingAvatarUrl(res.data.url);
        message.success('上传成功');
        onSuccess?.();
      } else {
        const errorMsg = res?.des || '上传失败';
        message.error(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error: any) {
      message.error(error?.message || '上传失败');
      onError?.(error);
    }
  };

  const handleSaveAvatar = async () => {
    if (!pendingAvatarUrl) {
      message.error('请先上传头像');
      return;
    }

    setAvatarSaving(true);
    try {
      const values = form.getFieldsValue();
      const payload = buildProfilePayload(values, pendingAvatarUrl);
      const res = await updateUser(String(currentUser.id), payload);
      if (handleApiResponse(res)) {
        setAvatarUrl(pendingAvatarUrl);
        setInitialState?.((state: { currentUser?: AuthAPI.UserInfo }) => ({
          ...state,
          currentUser: {
            ...currentUser,
            ...payload,
            permission: currentUser.permission,
          },
        }));
        setAvatarModalOpen(false);
        setPendingAvatarUrl(undefined);
      }
    } catch (error: any) {
      message.error(error?.message || '头像保存失败');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSavePassword = async () => {
    try {
      const values = await passwordForm.validateFields();

      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }

      if (!validatePasswordStrength(values.newPassword)) {
        message.error(
          '新密码长度不能低于6位，且需包含大写字母、小写字母、数字和特殊符号中的至少三种',
        );
        return;
      }

      setPasswordSaving(true);
      const res = await updateUserPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      if (handleApiResponse(res)) {
        message.success('密码修改成功');
        handleCancelPasswordModal();
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || '密码修改失败');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <PageContainer header={{ title: '个人中心' }}>
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 500, flex: 1 }}>
          <div
            style={{
              marginBottom: 24,
              padding: '12px 16px',
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
            }}
          >
            公司：{currentUser.companyName || '-'}
          </div>

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

        <div style={{ width: 180, textAlign: 'center' }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="头像"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
              preview={{ src: avatarUrl }}
            />
          ) : (
            <Avatar size={120} icon={<UserOutlined />} />
          )}
          <Button
            style={{ marginTop: 16 }}
            icon={<UploadOutlined />}
            onClick={handleOpenAvatarModal}
          >
            更换头像
          </Button>
          <Button
            style={{ marginTop: 12 }}
            icon={<LockOutlined />}
            onClick={handleOpenPasswordModal}
          >
            修改密码
          </Button>
        </div>
      </div>

      <Modal
        title="更换头像"
        open={avatarModalOpen}
        onCancel={handleCancelAvatarModal}
        onOk={handleSaveAvatar}
        confirmLoading={avatarSaving}
        destroyOnClose
      >
        <Dragger
          accept={allowedAvatarTypes.join(',')}
          beforeUpload={beforeAvatarUpload}
          customRequest={handleAvatarUpload}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽图片到该区域上传</p>
          <p className="ant-upload-hint">
            仅支持 {allowedAvatarTypes.join('、')}，最大5MB
          </p>
        </Dragger>

        {pendingAvatarUrl && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Image
              src={pendingAvatarUrl}
              alt="头像预览"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
              preview={{ src: pendingAvatarUrl }}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={handleCancelPasswordModal}
        onOk={handleSavePassword}
        confirmLoading={passwordSaving}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" autoComplete="off">
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProfilePage;
