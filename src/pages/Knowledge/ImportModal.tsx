import {
  createKnowledgeImport,
  getKnowledgeBases,
  getKnowledgeImport,
} from '@/services/knowledge';
import { InboxOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Form, Modal, Progress, Select, Steps, Upload, message } from 'antd';
import { useEffect, useRef, useState } from 'react';

export default ({
  open,
  onClose,
  defaultKnowledgeBaseId,
}: {
  open: boolean;
  onClose: () => void;
  defaultKnowledgeBaseId?: number;
}) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File>();
  const [batchId, setBatchId] = useState<number>();
  const [baseOptions, setBaseOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const finishedRef = useRef(false);
  const failedRef = useRef(false);
  const finish = (id: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setTimeout(() => {
      onClose();
      history.push(`/knowledge/imports/${id}/review`);
    }, 500);
  };
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ knowledgeBaseId: defaultKnowledgeBaseId });
      getKnowledgeBases().then((res) =>
        setBaseOptions(
          (res.data || []).map((x: any) => ({ label: x.name, value: x.id })),
        ),
      );
    }
  }, [open, defaultKnowledgeBaseId]);
  useEffect(() => {
    if (!batchId) return;
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(
      `${scheme}://${location.host}/api/ws/knowledge-import?batchId=${batchId}`,
    );
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.percent || 0);
      setProgressText(data.message || '');
      if (data.stage === 'COMPLETED') {
        socket.close();
        finish(batchId);
      }
      if (data.stage === 'FAILED' && !failedRef.current) {
        failedRef.current = true;
        setFailed(true);
        socket.close();
        message.error(data.message || '解析失败');
      }
    };
    return () => socket.close();
  }, [batchId]);
  useEffect(() => {
    if (!batchId) return;
    const timer = setInterval(async () => {
      const res = await getKnowledgeImport(batchId);
      if (res.code !== 0) return;
      setProgress(res.data.progress || 0);
      setProgressText(res.data.progressMessage || '');
      if (res.data.status === 'REVIEWING' || res.data.status === 'COMPLETED') {
        clearInterval(timer);
        finish(batchId);
      }
      if (res.data.status === 'FAILED') {
        clearInterval(timer);
        setFailed(true);
        if (!failedRef.current) {
          failedRef.current = true;
          message.error(res.data.errorMessage || '解析失败');
        }
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [batchId]);
  const reset = () => {
    finishedRef.current = false;
    failedRef.current = false;
    setFailed(false);
    setFile(undefined);
    setBatchId(undefined);
    setProgress(0);
    setProgressText('');
    setSubmitting(false);
    form.resetFields();
  };
  const close = () => {
    reset();
    onClose();
  };
  return (
    <Modal
      title="批量导入知识"
      open={open}
      width={640}
      onCancel={close}
      cancelText={batchId ? undefined : '取消'}
      cancelButtonProps={{ style: { display: batchId ? 'none' : undefined } }}
      okText={batchId ? '关闭' : '确定上传'}
      confirmLoading={submitting}
      onOk={async () => {
        if (batchId) {
          close();
          return;
        }
        const values = await form.validateFields();
        if (!file) {
          message.warning('请选择DOCX文档');
          return;
        }
        setSubmitting(true);
        try {
          const res = await createKnowledgeImport(file, values.knowledgeBaseId);
          if (res.code !== 0) {
            message.error(res.des || '上传失败');
            return;
          }
          setBatchId(res.data.id);
          setProgress(res.data.progress || 1);
          setProgressText(res.data.progressMessage || '解析任务已触发');
          message.success('解析任务已触发');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Steps
        current={batchId ? 1 : 0}
        size="small"
        items={['上传文档', '解析与生成', '人工审核', '提交结果'].map(
          (title) => ({ title }),
        )}
        style={{ marginBottom: 28 }}
      />
      {!batchId ? (
        <Form form={form} layout="vertical">
          <Form.Item
            name="knowledgeBaseId"
            label="默认目标知识库"
            rules={[{ required: true, message: '请选择默认目标知识库' }]}
          >
            <Select
              placeholder="请选择知识库"
              showSearch
              optionFilterProp="label"
              options={baseOptions}
              onFocus={async () => {
                const res = await getKnowledgeBases();
                setBaseOptions(
                  (res.data || []).map((x: any) => ({
                    label: x.name,
                    value: x.id,
                  })),
                );
              }}
            />
          </Form.Item>
          <Upload.Dragger
            accept=".docx"
            maxCount={1}
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(undefined)}
            fileList={file ? [file as any] : []}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>点击或拖拽上传 Word 文档</p>
            <p className="ant-upload-hint">仅支持 DOCX，单个文件不超过20MB</p>
          </Upload.Dragger>
        </Form>
      ) : (
        <div style={{ padding: '28px 10px' }}>
          <Progress
            percent={progress}
            status={
              failed ? 'exception' : progress === 100 ? 'success' : 'active'
            }
          />
          <div
            style={{
              textAlign: 'center',
              marginTop: 12,
              color: failed ? '#ff4d4f' : '#666',
            }}
          >
            {progressText}
          </div>
        </div>
      )}
    </Modal>
  );
};
