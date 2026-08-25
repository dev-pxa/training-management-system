import {
  approveKnowledgeImportItem,
  deleteKnowledgeImportItem,
  generateVariantQuestions,
  getKnowledgeBases,
  getKnowledgeImport,
  getKnowledgeImportItems,
  KnowledgeImportBatch,
  KnowledgeImportItem,
} from '@/services/knowledge';
import { handleApiResponse } from '@/utils/response';
import {
  PageContainer,
  ProForm,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  message,
  Pagination,
  Popconfirm,
  Space,
  Steps,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';

export default () => {
  const { id } = useParams();
  const batchId = Number(id);
  const [batch, setBatch] = useState<KnowledgeImportBatch>();
  const [item, setItem] = useState<KnowledgeImportItem>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const load = async (target = page) => {
    const [bRes, iRes] = await Promise.all([
      getKnowledgeImport(batchId),
      getKnowledgeImportItems(batchId, { pageNum: target, pageSize: 1 }),
    ]);
    if (bRes.code === 0) setBatch(bRes.data);
    if (iRes.code === 0) {
      const next = iRes.data.list?.[0];
      setItem(next);
      setTotal(iRes.data.total || 0);
      if (next)
        form.setFieldsValue({
          ...next,
          variantQuestions: (next.variantQuestions || []).map(
            (question: string) => ({ question }),
          ),
        });
    }
  };
  useEffect(() => {
    load(page);
  }, [page]);
  if (batch?.status === 'COMPLETED' && !item)
    return (
      <PageContainer title="人工审核">
        <Steps
          current={3}
          items={['上传文档', '解析与生成', '人工审核', '提交结果'].map(
            (title) => ({ title }),
          )}
        />
        <Card style={{ marginTop: 24, textAlign: 'center' }}>
          <h2>批量处理完成</h2>
          <p>
            识别 {batch.totalCount} 条，通过 {batch.approvedCount} 条，删除{' '}
            {batch.deletedCount} 条。
          </p>
          <Space>
            <Button
              type="primary"
              onClick={() =>
                history.push(
                  `/knowledge/manage?knowledgeBaseId=${batch.knowledgeBaseId}`,
                )
              }
            >
              查看添加的知识
            </Button>
            <Button onClick={() => history.push('/knowledge/imports')}>
              返回批量生成记录
            </Button>
          </Space>
        </Card>
      </PageContainer>
    );
  return (
    <PageContainer
      title="人工审核"
      subTitle={
        batch ? `${batch.fileName} · ${batch.knowledgeBaseName || ''}` : ''
      }
    >
      <Steps
        current={2}
        items={['上传文档', '解析与生成', '人工审核', '提交结果'].map(
          (title) => ({ title }),
        )}
      />
      <Card
        style={{ marginTop: 20 }}
        title={
          <Space>
            待审核 {batch?.pendingCount || total} 条
            {item?.confidence && (
              <Tag color={item.confidence >= 0.8 ? 'green' : 'orange'}>
                置信度 {Math.round(item.confidence * 100)}%
              </Tag>
            )}
          </Space>
        }
        extra={
          <Pagination
            simple
            current={page}
            total={total}
            pageSize={1}
            onChange={setPage}
          />
        }
      >
        {!item ? (
          <Empty description="没有待审核记录" />
        ) : (
          <>
            <ProForm form={form} submitter={false}>
              <ProFormSelect
                name="knowledgeBaseId"
                label="所属知识库"
                rules={[{ required: true, message: '请选择知识库' }]}
                request={async () => {
                  const r = await getKnowledgeBases();
                  return (r.data || []).map((x: any) => ({
                    label: x.name,
                    value: x.id,
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
                    form.getFieldValue('standardQuestion');
                  const answer = form.getFieldValue('answer');
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
                      form.setFieldValue(
                        'variantQuestions',
                        (res.data || []).map((question: string) => ({
                          question,
                        })),
                      );
                      message.success('已生成相似问法，请确认后提交');
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
            </ProForm>
            {!!item.warnings?.length && (
              <Alert
                style={{ marginTop: 18 }}
                type="warning"
                showIcon
                message="模型提示"
                description={item.warnings.join('；')}
              />
            )}
            <Collapse
              ghost
              style={{ marginTop: 12 }}
              items={[
                {
                  key: 'source',
                  label: '查看提取依据原文',
                  children: (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {item.sourceText || '无'}
                    </div>
                  ),
                },
              ]}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 18,
              }}
            >
              <Popconfirm
                title="确定删除当前候选知识？删除后无法恢复。"
                onConfirm={async () => {
                  const r = await deleteKnowledgeImportItem(batchId, item.id);
                  if (handleApiResponse(r, '已删除')) {
                    setPage(1);
                    await load(1);
                  }
                }}
              >
                <Button danger>删除</Button>
              </Popconfirm>
              <Button
                type="primary"
                loading={loading}
                onClick={async () => {
                  const values = await form.validateFields();
                  setLoading(true);
                  try {
                    const r = await approveKnowledgeImportItem(
                      batchId,
                      item.id,
                      {
                        ...values,
                        variantQuestions: (values.variantQuestions || [])
                          .map((v: any) => v.question)
                          .filter(Boolean),
                        status: 1,
                      },
                    );
                    if (handleApiResponse(r, '已添加到知识库')) {
                      setPage(1);
                      await load(1);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                通过并添加知识
              </Button>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
};
