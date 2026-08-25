import {
  KnowledgeEntry,
  deleteKnowledgeEntries,
  getKnowledgeBases,
  getKnowledgeEntries,
  reindexKnowledgeEntry,
  updateKnowledgeStatus,
} from '@/services/knowledge';
import { handleApiResponse } from '@/utils/response';
import {
  ImportOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Button, Modal, Popconfirm, Space, Tag, Tooltip, message } from 'antd';
import React, { useRef, useState } from 'react';
import ImportModal from './ImportModal';

const statusEnum = {
  0: { text: '草稿', status: 'Default' },
  1: { text: '启用', status: 'Success' },
  2: { text: '停用', status: 'Warning' },
};
const indexColor: Record<string, string> = {
  SUCCESS: 'success',
  FAILED: 'error',
  PROCESSING: 'processing',
  PENDING: 'warning',
  NOT_INDEXED: 'default',
};
const indexText: Record<string, string> = {
  NOT_INDEXED: '未索引',
  PENDING: '待索引',
  PROCESSING: '索引中',
  SUCCESS: '索引成功',
  FAILED: '索引失败',
};
const titleWithHelp = (title: string, help: React.ReactNode) => (
  <Space size={4}>
    {title}
    <Tooltip title={help}>
      <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
    </Tooltip>
  </Space>
);

export default () => {
  const actionRef = useRef<ActionType>();
  const [importOpen, setImportOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<KnowledgeEntry[]>([]);
  const knowledgeBaseId = new URLSearchParams(useLocation().search).get(
    'knowledgeBaseId',
  );
  const finishBatchAction = () => {
    setSelectedRows([]);
    actionRef.current?.reload();
  };
  const confirmBatchStatus = (status: 1 | 2) =>
    Modal.confirm({
      title: `确认批量${status === 1 ? '启用' : '停用'} ${
        selectedRows.length
      } 条知识？`,
      content:
        status === 1
          ? '启用后这些知识将参与问答召回；当前版本尚未索引的知识会自动提交索引任务。'
          : '停用后这些知识将立即停止参与问答召回，但已生成的向量会保留，之后可以重新启用。',
      okText: `确认${status === 1 ? '启用' : '停用'}`,
      cancelText: '取消',
      onOk: async () => {
        const results = await Promise.all(
          selectedRows.map((row) => updateKnowledgeStatus(row.id, status)),
        );
        const failed = results.filter((v) => v.code !== 0);
        if (failed.length) message.error(`${failed.length} 条操作失败`);
        else message.success('操作成功');
        finishBatchAction();
      },
    });
  const confirmBatchReindex = () => {
    const unavailable = selectedRows.filter((row) => row.status !== 1);
    if (unavailable.length) {
      message.warning(
        `有 ${unavailable.length} 条知识不是启用状态，请重新选择`,
      );
      return;
    }
    Modal.confirm({
      title: `确认重建 ${selectedRows.length} 条知识的索引？`,
      content:
        '系统将逐条重新调用向量模型并覆盖当前版本索引，会消耗模型调用额度；请在提交后留意索引状态。',
      okText: '确认重建',
      cancelText: '取消',
      onOk: async () => {
        const results = await Promise.all(
          selectedRows.map((row) => reindexKnowledgeEntry(row.id)),
        );
        const failed = results.filter((v) => v.code !== 0);
        if (failed.length) message.error(`${failed.length} 条提交失败`);
        else message.success('已提交重建索引');
        finishBatchAction();
      },
    });
  };
  const confirmBatchDelete = () =>
    Modal.confirm({
      title: `确认删除选中的 ${selectedRows.length} 条知识？`,
      content:
        '删除后这些知识将立即从管理列表和问答召回中移除，关联向量也会异步删除，且无法在管理端恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await deleteKnowledgeEntries(
          selectedRows.map((row) => row.id),
        );
        if (handleApiResponse(res, '删除成功')) finishBatchAction();
      },
    });
  const columns: ProColumns<KnowledgeEntry>[] = [
    {
      title: '所属知识库',
      dataIndex: 'knowledgeBaseId',
      valueType: 'select',
      width: 160,
      request: async () => {
        const res = await getKnowledgeBases();
        return (res.data || []).map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      },
      render: (_, row) => row.knowledgeBaseName || '-',
    },
    {
      title: '标准问题',
      dataIndex: 'standardQuestion',
      ellipsis: true,
      width: 215,
    },
    {
      title: titleWithHelp(
        '状态',
        <>
          <div>草稿：仅保存，不参与问答。</div>
          <div>启用：可以参与问答召回。</div>
          <div>停用：不参与召回，但保留已有向量。</div>
        </>,
      ),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
      width: 110,
    },
    {
      title: titleWithHelp(
        '索引状态',
        <>
          <div>未索引：尚未生成向量。</div>
          <div>待索引：已进入处理队列。</div>
          <div>索引中：正在生成或更新向量。</div>
          <div>索引成功：当前版本可参与语义召回。</div>
          <div>索引失败：生成向量失败，可查看原因后重试。</div>
        </>,
      ),
      dataIndex: 'indexStatus',
      valueType: 'select',
      width: 145,
      valueEnum: {
        NOT_INDEXED: { text: '未索引' },
        PENDING: { text: '待索引' },
        PROCESSING: { text: '处理中' },
        SUCCESS: { text: '成功' },
        FAILED: { text: '失败' },
      },
      render: (_, row) => (
        <Tag color={indexColor[row.indexStatus]}>
          {indexText[row.indexStatus] || '未知状态'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 380,
      render: (_, row) => (
        <Space size={0}>
          <Button
            type="link"
            onClick={() =>
              history.push(`/knowledge/detail/${row.id}?editable=false`)
            }
          >
            查看
          </Button>
          <Button
            type="link"
            onClick={() =>
              history.push(`/knowledge/detail/${row.id}?editable=true`)
            }
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => history.push(`/knowledge/recall?entryId=${row.id}`)}
          >
            召回测试
          </Button>
          <Popconfirm
            title={row.status === 1 ? '确认停用该知识？' : '确认启用该知识？'}
            description={
              row.status === 1
                ? '停用后将立即停止参与问答召回，但已生成的向量会保留，之后可重新启用。'
                : '启用后将参与问答召回；如果当前版本尚未索引，系统会自动提交索引任务。'
            }
            okText={row.status === 1 ? '确认停用' : '确认启用'}
            cancelText="取消"
            onConfirm={async () => {
              const res = await updateKnowledgeStatus(
                row.id,
                row.status === 1 ? 2 : 1,
              );
              if (handleApiResponse(res)) actionRef.current?.reload();
            }}
          >
            <Button type="link">{row.status === 1 ? '停用' : '启用'}</Button>
          </Popconfirm>
          {row.status === 1 && (
            <Popconfirm
              title="确认重建索引？"
              description="系统将重新调用向量模型并覆盖该知识当前版本的索引，会消耗模型调用额度；任务完成前请留意索引状态。"
              okText="确认重建"
              cancelText="取消"
              onConfirm={async () => {
                const res = await reindexKnowledgeEntry(row.id);
                if (handleApiResponse(res)) actionRef.current?.reload();
              }}
            >
              <Button type="link">重建索引</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除该知识？"
            description="删除后该知识将立即从管理列表和问答召回中移除，关联向量也会异步删除，且无法在管理端恢复。"
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              const res = await deleteKnowledgeEntries([row.id]);
              if (handleApiResponse(res)) actionRef.current?.reload();
            }}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <PageContainer title="知识管理">
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        defaultKnowledgeBaseId={
          knowledgeBaseId ? Number(knowledgeBaseId) : undefined
        }
      />
      <ProTable<KnowledgeEntry>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((row) => row.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertOptionRender={() => (
          <Space>
            <Button size="small" onClick={() => confirmBatchStatus(1)}>
              批量启用
            </Button>
            <Button size="small" onClick={() => confirmBatchStatus(2)}>
              批量停用
            </Button>
            <Button size="small" onClick={confirmBatchReindex}>
              批量重建索引
            </Button>
            <Button size="small" danger onClick={confirmBatchDelete}>
              批量删除
            </Button>
          </Space>
        )}
        headerTitle="问答知识"
        toolBarRender={() => [
          <Button
            key="import"
            icon={<ImportOutlined />}
            onClick={() => setImportOpen(true)}
          >
            批量导入
          </Button>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/knowledge/add')}
          >
            新建知识
          </Button>,
        ]}
        request={async (params) => {
          const res = await getKnowledgeEntries({
            pageNum: params.current || 1,
            pageSize: params.pageSize || 10,
            knowledgeBaseId: params.knowledgeBaseId,
            standardQuestion: params.standardQuestion,
            status: params.status,
            indexStatus: params.indexStatus,
          });
          if (res.code !== 0) {
            message.error(res.des || '获取知识失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data.list || [],
            success: true,
            total: res.data.total || 0,
          };
        }}
        form={{
          initialValues: {
            knowledgeBaseId: knowledgeBaseId
              ? Number(knowledgeBaseId)
              : undefined,
          },
        }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        search={{ labelWidth: 90 }}
      />
    </PageContainer>
  );
};
