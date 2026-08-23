import {
  KnowledgeEntry,
  deleteKnowledgeEntries,
  getKnowledgeBases,
  getKnowledgeEntries,
  reindexKnowledgeEntry,
  updateKnowledgeStatus,
} from '@/services/knowledge';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Button, Popconfirm, Space, Tag, Tooltip, message } from 'antd';
import React, { useRef } from 'react';

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
  const knowledgeBaseId = new URLSearchParams(useLocation().search).get(
    'knowledgeBaseId',
  );
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
      width: 320,
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
          <Button
            type="link"
            onClick={async () => {
              const res = await updateKnowledgeStatus(
                row.id,
                row.status === 1 ? 2 : 1,
              );
              if (handleApiResponse(res)) actionRef.current?.reload();
            }}
          >
            {row.status === 1 ? '停用' : '启用'}
          </Button>
          {row.status === 1 && (
            <Button
              type="link"
              onClick={async () => {
                const res = await reindexKnowledgeEntry(row.id);
                if (handleApiResponse(res)) actionRef.current?.reload();
              }}
            >
              重建索引
            </Button>
          )}
          <Popconfirm
            title="删除后该知识将不再参与智能问答，确定删除吗？"
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
      <ProTable<KnowledgeEntry>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        headerTitle="问答知识"
        toolBarRender={() => [
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
