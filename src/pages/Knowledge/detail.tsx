import {
  createKnowledgeEntry,
  generateVariantQuestions,
  getKnowledgeBases,
  getKnowledgeEntry,
  KnowledgePayload,
  updateKnowledgeEntry,
} from '@/services/knowledge';
import { handleApiResponse } from '@/utils/response';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormInstance,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  message,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const statusText: Record<number, string> = { 0: '草稿', 1: '启用', 2: '停用' };
const statusColor: Record<number, string> = {
  0: 'default',
  1: 'success',
  2: 'warning',
};
const indexText: Record<string, string> = {
  NOT_INDEXED: '未索引',
  PENDING: '待索引',
  PROCESSING: '索引中',
  SUCCESS: '索引成功',
  FAILED: '索引失败',
};
const indexColor: Record<string, string> = {
  NOT_INDEXED: 'default',
  PENDING: 'warning',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'error',
};
const labelWithHelp = (label: string, help: React.ReactNode) => (
  <Space size={4}>
    {label}
    <Tooltip title={help}>
      <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
    </Tooltip>
  </Space>
);

export default () => {
  const { id } = useParams<{ id: string }>();
  const editable =
    !id ||
    new URLSearchParams(useLocation().search).get('editable') !== 'false';
  const [loading, setLoading] = useState(!!id);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [data, setData] = useState<any>();
  const formRef = useRef<ProFormInstance>();
  useEffect(() => {
    if (id)
      getKnowledgeEntry(Number(id))
        .then((res) => {
          if (res.code === 0)
            setData({
              ...res.data,
              variantQuestions: (res.data.variantQuestions || []).map(
                (question: string) => ({ question }),
              ),
            });
        })
        .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Spin />;
  if (!editable && data)
    return (
      <PageContainer
        title="查看知识"
        extra={
          <Button
            onClick={() =>
              history.push(`/knowledge/detail/${id}?editable=true`)
            }
          >
            编辑
          </Button>
        }
      >
        <Card>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="标准问题">
              {data.standardQuestion}
            </Descriptions.Item>
            <Descriptions.Item label="相似问法">
              {(data.variantQuestions || [])
                .map((v: any) => v.question)
                .join('；') || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="标准答案">
              <div style={{ whiteSpace: 'pre-wrap' }}>{data.answer}</div>
            </Descriptions.Item>
            <Descriptions.Item label="管理备注">
              {data.remark || '无'}
            </Descriptions.Item>
            <Descriptions.Item
              label={labelWithHelp(
                '状态',
                <>
                  <div>草稿：仅保存，不参与问答。</div>
                  <div>启用：可以参与问答召回。</div>
                  <div>停用：不参与召回，但保留已有向量。</div>
                </>,
              )}
            >
              <Tag color={statusColor[data.status]}>
                {statusText[data.status] || '未知状态'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              label={labelWithHelp(
                '索引状态',
                <>
                  <div>未索引：尚未生成向量。</div>
                  <div>待索引：已进入处理队列。</div>
                  <div>索引中：正在生成或更新向量。</div>
                  <div>索引成功：当前版本可参与语义召回。</div>
                  <div>索引失败：生成向量失败，可查看原因后重试。</div>
                </>,
              )}
            >
              <Tag color={indexColor[data.indexStatus]}>
                {indexText[data.indexStatus] || '未知状态'}
              </Tag>
              {data.indexMessage && <span>{data.indexMessage}</span>}
            </Descriptions.Item>
            <Descriptions.Item
              label={labelWithHelp(
                '版本',
                '当前内容版本每次编辑后递增；生效索引版本表示当前可用于语义召回的内容版本。两者不一致时，说明最新内容尚未完成索引。',
              )}
            >
              当前内容版本：{data.currentVersion}；生效索引版本：
              {data.activeIndexVersion ?? '暂无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </PageContainer>
    );
  return (
    <PageContainer title={id ? '编辑知识' : '新建知识'}>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="停用只会从检索结果中过滤，不删除已有向量；同一版本重新启用时无需重新索引。"
      />
      <Card>
        <ProForm
          formRef={formRef}
          initialValues={data || { status: 0, variantQuestions: [] }}
          submitter={{
            render: (_, buttons) => (
              <Space>
                {buttons}
                <Button onClick={() => history.back()}>取消</Button>
              </Space>
            ),
          }}
          onFinish={async (values: any) => {
            const payload: KnowledgePayload = {
              ...values,
              variantQuestions: (values.variantQuestions || [])
                .map((v: any) => v.question)
                .filter(Boolean),
            };
            const res = id
              ? await updateKnowledgeEntry(Number(id), payload)
              : await createKnowledgeEntry(payload);
            if (handleApiResponse(res, '保存成功'))
              history.push('/knowledge/manage');
          }}
        >
          <ProFormSelect
            name="knowledgeBaseId"
            label="所属知识库"
            rules={[{ required: true }]}
            request={async () => {
              const res = await getKnowledgeBases();
              return (res.data || []).map((v: any) => ({
                label: v.name,
                value: v.id,
              }));
            }}
          />
          <ProFormText
            name="standardQuestion"
            label="标准问题"
            rules={[{ required: true }, { max: 1000 }]}
          />
          <ProFormTextArea
            name="answer"
            label="标准答案"
            fieldProps={{ rows: 10 }}
            rules={[{ required: true }]}
          />
          <Button
            style={{ marginBottom: 12 }}
            loading={generatingVariants}
            onClick={async () => {
              const standardQuestion =
                formRef.current?.getFieldValue('standardQuestion');
              const answer = formRef.current?.getFieldValue('answer');
              if (!standardQuestion || !answer) {
                message.warning('请先填写标准问题和标准答案');
                return;
              }
              setGeneratingVariants(true);
              try {
                const res = await generateVariantQuestions({
                  standardQuestion,
                  answer,
                  count: 5,
                });
                if (res.code === 0) {
                  formRef.current?.setFieldValue(
                    'variantQuestions',
                    (res.data || []).map((question: string) => ({ question })),
                  );
                  message.success('已生成相似问法，请确认后保存');
                } else message.error(res.des || '生成失败');
              } finally {
                setGeneratingVariants(false);
              }
            }}
          >
            AI 生成相似问法
          </Button>
          <ProFormList
            name="variantQuestions"
            label="相似问法"
            creatorButtonProps={{ creatorButtonText: '添加相似问法' }}
            itemRender={({ listDom, action }) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 8,
                  width: '100%',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>{listDom}</div>
                {action}
              </div>
            )}
          >
            <ProFormText
              name="question"
              fieldProps={{ style: { width: '100%' } }}
              rules={[{ max: 1000 }]}
            />
          </ProFormList>
          <ProFormTextArea
            name="remark"
            label="管理备注"
            fieldProps={{ rows: 3 }}
          />
          <ProFormRadio.Group
            name="status"
            label={labelWithHelp(
              '状态',
              <>
                <div>草稿：仅保存，不参与问答。</div>
                <div>启用：可以参与问答召回。</div>
                <div>停用：不参与召回，但保留已有向量。</div>
              </>,
            )}
            options={[
              { label: '草稿', value: 0 },
              { label: '启用', value: 1 },
              { label: '停用', value: 2 },
            ]}
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};
