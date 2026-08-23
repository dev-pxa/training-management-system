import { getKnowledgeBases, testKnowledgeRecall } from '@/services/knowledge';
import {
  PageContainer,
  ProForm,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useLocation } from '@umijs/max';
import { Card, Empty, Table, Tag, message } from 'antd';
import { useState } from 'react';

export default () => {
  const [result, setResult] = useState<any>();
  const knowledgeBaseId = new URLSearchParams(useLocation().search).get(
    'knowledgeBaseId',
  );
  const matchedTypeText: Record<string, string> = {
    STANDARD: '标准问题',
    VARIANT: '相似问法',
  };
  return (
    <PageContainer title="召回测试">
      <div
        style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}
      >
        <Card title="测试参数">
          <ProForm
            initialValues={{
              knowledgeBaseId: knowledgeBaseId
                ? Number(knowledgeBaseId)
                : undefined,
              mode: 'HYBRID',
              topK: 5,
              scoreThreshold: 0.65,
            }}
            submitter={{
              searchConfig: { submitText: '执行测试' },
              resetButtonProps: false,
            }}
            onFinish={async (values) => {
              const res = await testKnowledgeRecall(values);
              if (res.code === 0) setResult(res.data);
              else message.error(res.des);
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
            <ProFormTextArea
              name="query"
              label="测试问题"
              rules={[{ required: true }, { max: 2000 }]}
            />
            <ProFormRadio.Group
              name="mode"
              label="检索方式"
              options={[
                { label: '语义检索', value: 'VECTOR' },
                { label: '关键词检索', value: 'KEYWORD' },
                { label: '混合检索', value: 'HYBRID' },
              ]}
            />
            <ProFormDigit name="topK" label="Top K" min={1} max={20} />
            <ProFormDigit
              name="scoreThreshold"
              label="相似度阈值"
              min={0}
              max={1}
              fieldProps={{ step: 0.05 }}
            />
          </ProForm>
        </Card>
        <Card
          title={result ? `召回结果（${result.elapsedMs} ms）` : '召回结果'}
        >
          {!result ? (
            <Empty description="输入问题后执行测试" />
          ) : (
            <Table
              rowKey={(r) => `${r.entryId}-${r.rank}`}
              pagination={false}
              dataSource={result.results}
              tableLayout="fixed"
              scroll={{ y: 560 }}
              columns={[
                { title: '排名', dataIndex: 'rank', width: 60 },
                {
                  title: '标准问题',
                  dataIndex: 'standardQuestion',
                  width: '17%',
                  render: (v) => (
                    <div style={{ overflowWrap: 'anywhere' }}>{v}</div>
                  ),
                },
                {
                  title: '命中文本',
                  dataIndex: 'matchedText',
                  width: '17%',
                  render: (v) => (
                    <div style={{ overflowWrap: 'anywhere' }}>{v}</div>
                  ),
                },
                {
                  title: '类型',
                  dataIndex: 'matchedType',
                  width: 90,
                  render: (v) => matchedTypeText[v] || '未知类型',
                },
                {
                  title: '相似度',
                  dataIndex: 'vectorScore',
                  width: 80,
                  render: (v) => Number(v).toFixed(4),
                },
                {
                  title: '阈值',
                  dataIndex: 'passedThreshold',
                  width: 75,
                  render: (v) => (
                    <Tag color={v ? 'success' : 'error'}>
                      {v ? '通过' : '未通过'}
                    </Tag>
                  ),
                },
                {
                  title: '答案',
                  dataIndex: 'answer',
                  render: (v) => (
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {v}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
