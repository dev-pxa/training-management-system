import { uploadResourceFile } from '@/services/resource';
import { updateUser } from '@/services/users';
import { handleApiResponse } from '@/utils/response';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
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
import React, { useState } from 'react';

const { Dragger } = Upload;

const allowedAvatarTypes = ['.png', '.jpg', '.jpeg', '.webp'];

const ProfilePage: React.FC = () => {
  const { initialState, refresh } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [form] = Form.useForm();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string>();

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
    avatarUrl?: string,
  ) => ({
    uname: values.uname || currentUser.uname,
    phone: values.phone || currentUser.phone,
    name: values.name || currentUser.name,
    permission: String(currentUser.permission),
    avatarUrl,
  });

  const handleSubmit = async (values: {
    uname: string;
    phone: string;
    name: string;
  }) => {
    try {
      const res = await updateUser(
        String(currentUser.id),
        buildProfilePayload(values, currentUser.avatarUrl),
      );
      if (handleApiResponse(res)) {
        refresh();
      }
    } catch (error: any) {
      message.error(error?.message || '更新失败');
    }
  };

  const handleOpenAvatarModal = () => {
    setPendingAvatarUrl(currentUser.avatarUrl);
    setAvatarModalOpen(true);
  };

  const handleCancelAvatarModal = () => {
    setAvatarModalOpen(false);
    setPendingAvatarUrl(undefined);
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
      const res = await updateUser(
        String(currentUser.id),
        buildProfilePayload(values, pendingAvatarUrl),
      );
      if (handleApiResponse(res)) {
        setAvatarModalOpen(false);
        setPendingAvatarUrl(undefined);
        await refresh();
      }
    } catch (error: any) {
      message.error(error?.message || '头像保存失败');
    } finally {
      setAvatarSaving(false);
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
          {currentUser.avatarUrl ? (
            <Image
              src={currentUser.avatarUrl}
              alt="头像"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
              preview={{ src: currentUser.avatarUrl }}
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
    </PageContainer>
  );
};

export default ProfilePage;
