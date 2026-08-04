import {
  CertificateVerifyResult,
  verifyCertificate,
} from '@/services/certificate';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useState } from 'react';

const { Paragraph, Text } = Typography;

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
};

const formatScore = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `${Number(value).toLocaleString('zh-CN')} 分`;
};

const CertificateVerifyPage: React.FC = () => {
  const [form] = Form.useForm<{ certificateNo: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerifyResult>();
  const [searched, setSearched] = useState(false);

  const handleSearch = async (values: { certificateNo: string }) => {
    const certificateNo = values.certificateNo?.trim();
    if (!certificateNo) {
      message.warning('请输入证书编号');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCertificate(certificateNo);
      if (res.code !== 0) {
        message.error(res.des || '证书验伪失败');
        return;
      }
      setSearched(true);
      setResult(res.data);
      if (res.data?.exists) {
        message.success('证书查询成功');
      }
    } catch (error: any) {
      message.error(error?.message || '证书验伪失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: '证书验伪',
      }}
    >
      <Card title="证书编号查询">
        <Paragraph type="secondary">
          请输入学员证书上的完整证书编号，系统会查询该编号对应的考试结果信息。
        </Paragraph>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="certificateNo"
            rules={[{ required: true, message: '请输入证书编号' }]}
            style={{ minWidth: 420 }}
          >
            <Input
              allowClear
              placeholder="例如：QXT-2-20260804-000010"
              onPressEnter={() => form.submit()}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                查询
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setResult(undefined);
                  setSearched(false);
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="验伪结果" style={{ marginTop: 24 }}>
        {!searched ? (
          <Empty description="请输入证书编号进行查询" />
        ) : result?.exists ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="证书状态" span={2}>
              <Tag color="success">有效</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="证书编号" span={2}>
              <Text copyable>{result.certificateNo}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="获证人">
              {result.userName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {result.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="课程名称">
              {result.courseName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="考试名称">
              {result.quizName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="考试成绩">
              {formatScore(result.score)}
            </Descriptions.Item>
            <Descriptions.Item label="及格分数">
              {formatScore(result.passScore)}
            </Descriptions.Item>
            <Descriptions.Item label="总分">
              {formatScore(result.totalScore)}
            </Descriptions.Item>
            <Descriptions.Item label="答对题数">
              {result.correctCount ?? '-'}/{result.totalCount ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="考试结果">
              {result.passed ? (
                <Tag color="success">已通过</Tag>
              ) : (
                <Tag color="error">未通过</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="考试记录ID">
              {result.examRecordId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {formatDateTime(result.submittedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="证书签发时间">
              {formatDateTime(result.certificateIssuedAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="证书不存在" />
        )}
      </Card>
    </PageContainer>
  );
};

export default CertificateVerifyPage;
