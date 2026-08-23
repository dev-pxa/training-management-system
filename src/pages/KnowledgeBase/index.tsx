import {
  createKnowledgeBase,
  getKnowledgeBase,
  getKnowledgeBasePage,
  updateKnowledgeBase,
  updateKnowledgeBaseStatus,
} from '@/services/knowledge';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProForm,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Form, Modal, Space, Tag, message } from 'antd';
import { useRef, useState } from 'react';

interface KnowledgeBaseRow {
  id: number;
  name: string;
  knowledgeCount: number;
  enabledKnowledgeCount: number;
  status: number;
}

export default () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'view' | 'edit';
    id?: number;
  }>({ open: false, mode: 'view' });
  const [loading, setLoading] = useState(false);

  const openDialog = async (id: number, mode: 'view' | 'edit') => {
    setDialog({ open: true, mode, id });
    setLoading(true);
    form.resetFields();
    try {
      const res = await getKnowledgeBase(id);
      if (res.code !== 0) {
        message.error(res.des || '获取知识库详情失败');
        setDialog({ open: false, mode });
        return;
      }
      form.setFieldsValue(res.data);
    } finally {
      setLoading(false);
    }
  };
  const columns: ProColumns<KnowledgeBaseRow>[] = [
    { title: '知识库名称', dataIndex: 'name', ellipsis: true },
    {
      title: '知识数量',
      dataIndex: 'knowledgeCount',
      search: false,
      width: 120,
    },
    {
      title: '启用知识',
      dataIndex: 'enabledKnowledgeCount',
      search: false,
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 110,
      valueEnum: { 0: { text: '停用' }, 1: { text: '启用' } },
      render: (_, row) => (
        <Tag color={row.status === 1 ? 'success' : 'default'}>
          {row.status === 1 ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 370,
      render: (_, row) => (
        <Space size={0}>
          <Button type="link" onClick={() => openDialog(row.id, 'view')}>
            查看
          </Button>
          <Button type="link" onClick={() => openDialog(row.id, 'edit')}>
            编辑
          </Button>
          <Button
            type="link"
            onClick={() =>
              history.push(`/knowledge/manage?knowledgeBaseId=${row.id}`)
            }
          >
            知识管理
          </Button>
          <Button
            type="link"
            disabled={row.status !== 1}
            onClick={() =>
              history.push(`/knowledge/recall?knowledgeBaseId=${row.id}`)
            }
          >
            召回测试
          </Button>
          <Button
            type="link"
            onClick={async () => {
              const res = await updateKnowledgeBaseStatus(
                row.id,
                row.status === 1 ? 0 : 1,
              );
              if (
                handleApiResponse(res, row.status === 1 ? '已停用' : '已启用')
              )
                actionRef.current?.reload();
            }}
          >
            {row.status === 1 ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="知识库管理">
      <Modal
        title={dialog.mode === 'view' ? '查看知识库' : '编辑知识库'}
        open={dialog.open}
        confirmLoading={loading}
        width={560}
        destroyOnClose
        okText={dialog.mode === 'view' ? '关闭' : '保存'}
        cancelButtonProps={{
          style: { display: dialog.mode === 'view' ? 'none' : undefined },
        }}
        onCancel={() => setDialog({ open: false, mode: dialog.mode })}
        onOk={async () => {
          if (dialog.mode === 'view') {
            setDialog({ open: false, mode: 'view' });
            return;
          }
          const values = await form.validateFields();
          setLoading(true);
          try {
            const res = await updateKnowledgeBase(dialog.id!, values);
            if (!handleApiResponse(res, '编辑成功')) return;
            setDialog({ open: false, mode: 'edit' });
            actionRef.current?.reload();
          } finally {
            setLoading(false);
          }
        }}
      >
        <ProForm
          form={form}
          submitter={false}
          disabled={dialog.mode === 'view'}
        >
          <ProFormText
            name="name"
            label="知识库名称"
            rules={[
              { required: true, message: '请输入知识库名称' },
              { max: 100 },
            ]}
          />
          <ProFormTextArea
            name="description"
            label="知识库描述"
            fieldProps={{ rows: 4 }}
            rules={[{ max: 500 }]}
          />
          <ProFormRadio.Group
            name="status"
            label="状态"
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
          />
        </ProForm>
      </Modal>
      <ProTable<KnowledgeBaseRow>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        headerTitle="知识库列表"
        toolBarRender={() => [
          <ModalForm
            key="create"
            title="新增知识库"
            trigger={
              <Button type="primary" icon={<PlusOutlined />}>
                新增知识库
              </Button>
            }
            width={560}
            initialValues={{ status: 1 }}
            modalProps={{ destroyOnClose: true }}
            onFinish={async (values) => {
              const res = await createKnowledgeBase(values as any);
              if (!handleApiResponse(res, '新增成功')) return false;
              actionRef.current?.reload();
              return true;
            }}
          >
            <ProFormText
              name="name"
              label="知识库名称"
              rules={[
                { required: true, message: '请输入知识库名称' },
                { max: 100 },
              ]}
            />
            <ProFormTextArea
              name="description"
              label="知识库描述"
              fieldProps={{ rows: 4 }}
              rules={[{ max: 500 }]}
            />
            <ProFormRadio.Group
              name="status"
              label="状态"
              options={[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
            />
          </ModalForm>,
        ]}
        request={async (params) => {
          const res = await getKnowledgeBasePage({
            pageNum: params.current || 1,
            pageSize: params.pageSize || 10,
            name: params.name,
            status: params.status,
          });
          if (res.code !== 0) {
            message.error(res.des || '获取知识库失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data.list || [],
            success: true,
            total: res.data.total || 0,
          };
        }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        search={{ labelWidth: 90 }}
      />
    </PageContainer>
  );
};
