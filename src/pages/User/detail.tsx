import {
  addUser,
  getUserDetail,
  importUsers,
  updateUser,
} from '@/services/users';
import { handleApiResponse } from '@/utils/response';
import { UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Upload,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

interface ImportErrorItem {
  row?: number;
  field?: string;
  message?: string;
}

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAddMode = location.pathname === '/user/add';
  const editable = isAddMode || location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isAddMode);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File>();
  const [importErrors, setImportErrors] = useState<ImportErrorItem[]>([]);

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
        const uname = values.uname?.trim();
        res = await addUser({
          ...(uname ? { uname } : {}),
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

  const handleOpenImportModal = () => {
    setImportFile(undefined);
    setImportErrors([]);
    setImportModalOpen(true);
  };

  const handleCancelImportModal = () => {
    setImportModalOpen(false);
    setImportFile(undefined);
    setImportErrors([]);
  };

  const handleImportUsers = async () => {
    if (!importFile) {
      message.error('请先上传xlsx文件');
      return;
    }

    setImporting(true);
    try {
      const res = await importUsers(importFile);
      const isSuccess = res?.code === 0 || res?.success === true;
      if (isSuccess) {
        message.success(res?.des || res?.desc || '导入成功');
        handleCancelImportModal();
        history.push('/user');
        return;
      }

      const errors = Array.isArray(res?.data?.errors) ? res.data.errors : [];
      setImportErrors(errors);
      message.error(res?.des || res?.desc || '批量添加失败');
    } catch (error: any) {
      message.error(error?.message || '批量添加失败');
    } finally {
      setImporting(false);
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
            extra={
              isAddMode ? '不填写时，系统将自动生成一个唯一用户名' : undefined
            }
            rules={
              isAddMode ? [] : [{ required: true, message: '请输入用户名' }]
            }
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
              <Option value={1}>用户</Option>
              <Option value={2}>管理员</Option>
            </Select>
          </Form.Item>

          {editable && (
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  确定
                </Button>
                {isAddMode && (
                  <Button
                    icon={<UploadOutlined />}
                    onClick={handleOpenImportModal}
                  >
                    批量添加
                  </Button>
                )}
              </Space>
            </Form.Item>
          )}
        </Form>
      </div>

      <Modal
        title="批量添加人员"
        open={importModalOpen}
        onCancel={handleCancelImportModal}
        onOk={handleImportUsers}
        confirmLoading={importing}
        okText="确认导入"
        destroyOnClose
      >
        <Upload
          accept=".xlsx"
          maxCount={1}
          beforeUpload={(file) => {
            if (!file.name.toLowerCase().endsWith('.xlsx')) {
              message.error('请上传xlsx文件');
              return Upload.LIST_IGNORE;
            }
            setImportFile(file as File);
            setImportErrors([]);
            return false;
          }}
          onRemove={() => {
            setImportFile(undefined);
            setImportErrors([]);
          }}
        >
          <Button icon={<UploadOutlined />}>上传xlsx文件</Button>
        </Upload>
        <div style={{ marginTop: 12, color: '#666' }}>
          xlsx列格式：手机号、姓名、权限。权限仅允许填写1或2，1表示普通用户，2表示管理员。
        </div>
        {importErrors.length > 0 && (
          <Table
            style={{ marginTop: 16 }}
            size="small"
            rowKey={(_, index) => String(index)}
            dataSource={importErrors}
            pagination={false}
            columns={[
              {
                title: '行号',
                dataIndex: 'row',
                key: 'row',
                width: 80,
                render: (value) => value ?? '-',
              },
              {
                title: '字段',
                dataIndex: 'field',
                key: 'field',
                width: 120,
                render: (value) => value || '-',
              },
              {
                title: '错误原因',
                dataIndex: 'message',
                key: 'message',
                render: (value) => value || '-',
              },
            ]}
          />
        )}
      </Modal>
    </PageContainer>
  );
};

export default UserDetailPage;
