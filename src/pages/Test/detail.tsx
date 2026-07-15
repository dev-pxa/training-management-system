import {
  addTest,
  ChoiceQuestion,
  FillQuestion,
  generateTestQuestions,
  getTestDetail,
  Question,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_FILL,
  updateTest,
} from '@/services/test';
import { handleApiResponse } from '@/utils/response';
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  RobotOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

const ACCEPTED_AI_FILE_EXTENSIONS = ['doc', 'docx', 'pdf'];

const normalizeUploadFileList = (event: any) => {
  if (Array.isArray(event)) {
    return event;
  }
  return event?.fileList;
};

const TestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAddMode = location.pathname === '/test/add';
  const editable = isAddMode || location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [loading, setLoading] = useState(!isAddMode);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!isAddMode) {
      const fetchData = async () => {
        try {
          const res = await getTestDetail(id as unknown as number);
          if (res?.code === 0 && res?.data) {
            const data = res.data;
            const timeLimit = data.timeLimit ?? 30 * 60;
            const timeLimitMinutes = Math.floor(timeLimit / 60);
            form.setFieldsValue({
              name: data.name,
              desc: data.desc,
              tag: data.tag,
              passScore: data.passScore,
              timeLimitHours: Math.floor(timeLimitMinutes / 60),
              timeLimitMinutes: timeLimitMinutes % 60,
            });
            setQuestions(
              (data.questions || []).map((question: Question) => ({
                ...question,
                score: question.score ?? 5,
              })),
            );
          } else if (res?.code !== 0) {
            message.error(res?.des || res?.desc || '获取测试信息失败');
          }
        } catch (error: any) {
          message.error(error?.message || '获取测试信息失败');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, form, isAddMode]);

  const handleSubmit = async (values: any) => {
    // 校验题目
    if (questions.length === 0) {
      message.error('请至少添加一道题目');
      return;
    }

    const timeLimit =
      (Number(values.timeLimitHours || 0) * 60 +
        Number(values.timeLimitMinutes || 0)) *
      60;
    if (timeLimit <= 0) {
      message.error('测试时长必须大于0分钟');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title || q.title.trim() === '') {
        message.error(`第${i + 1}题的题目标题不能为空`);
        return;
      }
      if (q.score === undefined || q.score === null || Number(q.score) <= 0) {
        message.error(`第${i + 1}题的分值必须大于0`);
        return;
      }

      if (q.type === QUESTION_TYPE_CHOICE) {
        const cq = q as ChoiceQuestion;
        for (let j = 0; j < cq.options.length; j++) {
          if (!cq.options[j] || cq.options[j].trim() === '') {
            message.error(
              `第${i + 1}题的选项${String.fromCharCode(65 + j)}不能为空`,
            );
            return;
          }
        }
      } else {
        const fq = q as FillQuestion;
        for (let j = 0; j < fq.answers.length; j++) {
          if (!fq.answers[j] || fq.answers[j].trim() === '') {
            message.error(`第${i + 1}题的第${j + 1}空答案不能为空`);
            return;
          }
        }
      }
    }

    const totalScore = questions.reduce(
      (sum, question) => sum + Number(question.score || 0),
      0,
    );
    const passScore = Number(values.passScore);
    if (passScore > totalScore) {
      message.error(`通过分数不能大于题目总分（当前总分${totalScore}分）`);
      return;
    }

    try {
      const payload = {
        name: values.name,
        desc: values.desc,
        tag: values.tag,
        timeLimit,
        passScore,
        questions: questions.map((question) => ({
          ...question,
          score: Number(question.score),
        })),
      };
      const res = isAddMode
        ? await addTest(payload)
        : await updateTest(id as unknown as number, payload);

      if (handleApiResponse(res)) {
        history.push('/test');
      }
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const openAiGenerateModal = () => {
    aiForm.setFieldsValue({
      choiceCount: 5,
      fillCount: 5,
      score: 5,
      file: [],
    });
    setAiModalOpen(true);
  };

  const closeAiGenerateModal = () => {
    if (aiGenerating) {
      return;
    }
    setAiModalOpen(false);
  };

  const handleAiGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      const fileList: UploadFile[] = values.file || [];
      const file = fileList[0]?.originFileObj;

      if (!file) {
        message.error('请上传Word或PDF文档');
        return;
      }

      setAiGenerating(true);
      const score = Number(values.score || 5);
      const res = await generateTestQuestions({
        file,
        choiceCount: Number(values.choiceCount || 0),
        fillCount: Number(values.fillCount || 0),
        score,
      });

      if (res?.code === 0) {
        const generatedQuestions: Question[] = res?.data?.questions || [];
        setQuestions(
          generatedQuestions.map((question) => ({
            ...question,
            score,
          })),
        );
        message.success(`AI已生成${generatedQuestions.length}道题目`);
        setAiModalOpen(false);
        aiForm.resetFields();
      } else {
        message.error(res?.des || res?.desc || 'AI生成题目失败');
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || 'AI生成题目失败');
    } finally {
      setAiGenerating(false);
    }
  };

  // 添加选择题
  const addChoiceQuestion = () => {
    const newQuestion: ChoiceQuestion = {
      type: QUESTION_TYPE_CHOICE,
      title: '',
      score: 5,
      options: ['', '', '', ''],
      answer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  // 添加填空题
  const addFillQuestion = () => {
    const newQuestion: FillQuestion = {
      type: QUESTION_TYPE_FILL,
      title: '$',
      score: 5,
      blankCount: 1,
      answers: [''],
    };
    setQuestions([...questions, newQuestion]);
  };

  // 删除题目
  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // 更新选择题
  const updateChoiceQuestion = (
    index: number,
    field: keyof ChoiceQuestion,
    value: any,
  ) => {
    updateQuestion(index, field, value);
  };

  // 更新选择题选项
  const updateChoiceOption = (
    qIndex: number,
    oIndex: number,
    value: string,
  ) => {
    const newQuestions = [...questions];
    const q = newQuestions[qIndex] as ChoiceQuestion;
    const newOptions = [...q.options];
    newOptions[oIndex] = value;
    newQuestions[qIndex] = { ...q, options: newOptions };
    setQuestions(newQuestions);
  };

  // 添加选择题选项
  const addChoiceOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const q = newQuestions[qIndex] as ChoiceQuestion;
    newQuestions[qIndex] = { ...q, options: [...q.options, ''] };
    setQuestions(newQuestions);
  };

  // 删除选择题选项
  const removeChoiceOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const q = newQuestions[qIndex] as ChoiceQuestion;
    if (q.options.length <= 2) {
      message.warning('选择题至少需要2个选项');
      return;
    }
    const newOptions = [...q.options];
    newOptions.splice(oIndex, 1);
    let newAnswer = q.answer;
    if (newAnswer >= newOptions.length) {
      newAnswer = newOptions.length - 1;
    }
    newQuestions[qIndex] = { ...q, options: newOptions, answer: newAnswer };
    setQuestions(newQuestions);
  };

  // 更新填空答案
  const updateFillAnswer = (qIndex: number, aIndex: number, value: string) => {
    const newQuestions = [...questions];
    const q = newQuestions[qIndex] as FillQuestion;
    const newAnswers = [...q.answers];
    newAnswers[aIndex] = value;
    newQuestions[qIndex] = { ...q, answers: newAnswers };
    setQuestions(newQuestions);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <PageContainer
      header={{
        title: isAddMode ? '添加测试' : editable ? '编辑测试' : '测试详情',
      }}
    >
      <div style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            tag: '',
            timeLimitHours: 0,
            timeLimitMinutes: 30,
          }}
        >
          <Form.Item
            name="name"
            label="测试名称"
            rules={[{ required: true, message: '请输入测试名称' }]}
          >
            <Input disabled={!editable} placeholder="请输入测试名称" />
          </Form.Item>

          <Form.Item
            name="tag"
            label="标签"
            rules={[{ required: true, message: '请输入标签' }]}
          >
            <Input disabled={!editable} placeholder="请输入标签" />
          </Form.Item>

          <Form.Item
            name="desc"
            label="测试描述"
            rules={[{ required: true, message: '请输入测试描述' }]}
          >
            <TextArea
              disabled={!editable}
              rows={4}
              placeholder="请输入测试描述"
            />
          </Form.Item>

          <Form.Item label="测试时长" required>
            <Space>
              <Form.Item
                name="timeLimitHours"
                noStyle
                rules={[{ required: true, message: '请输入小时' }]}
              >
                <InputNumber
                  disabled={!editable}
                  min={0}
                  precision={0}
                  style={{ width: 120 }}
                  placeholder="小时"
                />
              </Form.Item>
              <span>小时</span>
              <Form.Item
                name="timeLimitMinutes"
                noStyle
                rules={[{ required: true, message: '请输入分钟' }]}
              >
                <InputNumber
                  disabled={!editable}
                  min={0}
                  max={59}
                  precision={0}
                  style={{ width: 120 }}
                  placeholder="分钟"
                />
              </Form.Item>
              <span>分钟</span>
            </Space>
          </Form.Item>

          <Form.Item
            name="passScore"
            label="通过分数"
            rules={[{ required: true, message: '请输入通过分数' }]}
          >
            <InputNumber
              disabled={!editable}
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="请输入通过分数"
            />
          </Form.Item>

          <Form.Item label="题目列表">
            <div>
              {editable && (
                <Space style={{ marginBottom: 16 }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addChoiceQuestion}
                  >
                    添加选择题
                  </Button>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addFillQuestion}
                  >
                    添加填空题
                  </Button>
                  <Button
                    type="primary"
                    icon={<RobotOutlined />}
                    onClick={openAiGenerateModal}
                  >
                    AI智能生成题目
                  </Button>
                </Space>
              )}

              {questions.map((q, qIndex) => (
                <Card
                  key={qIndex}
                  style={{ marginBottom: 16 }}
                  title={
                    <Space>
                      <Text strong>
                        {q.type === QUESTION_TYPE_CHOICE
                          ? `第${qIndex + 1}题（选择题）`
                          : `第${qIndex + 1}题（填空题）`}
                      </Text>
                    </Space>
                  }
                  extra={
                    editable ? (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeQuestion(qIndex)}
                      />
                    ) : null
                  }
                >
                  <Form.Item label="分值" required>
                    <InputNumber
                      disabled={!editable}
                      min={1}
                      precision={0}
                      value={q.score}
                      onChange={(value) =>
                        updateQuestion(qIndex, 'score', value)
                      }
                      style={{ width: 160 }}
                      placeholder="请输入分值"
                    />
                  </Form.Item>

                  {q.type === QUESTION_TYPE_CHOICE ? (
                    <div>
                      <Form.Item label="题目标题" required>
                        <Input
                          disabled={!editable}
                          value={q.title}
                          onChange={(e) =>
                            updateChoiceQuestion(
                              qIndex,
                              'title',
                              e.target.value,
                            )
                          }
                          placeholder="请输入题目标题"
                        />
                      </Form.Item>

                      <div style={{ marginBottom: 16 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {q.options.map((opt, oIndex) => (
                            <Space key={oIndex} style={{ width: '100%' }}>
                              {editable ? (
                                <Radio
                                  checked={q.answer === oIndex}
                                  onChange={() =>
                                    updateChoiceQuestion(
                                      qIndex,
                                      'answer',
                                      oIndex,
                                    )
                                  }
                                >
                                  答案
                                </Radio>
                              ) : (
                                <Text
                                  type={
                                    q.answer === oIndex
                                      ? 'success'
                                      : 'secondary'
                                  }
                                >
                                  {q.answer === oIndex ? '✓ 答案' : ''}
                                </Text>
                              )}
                              <Input
                                disabled={!editable}
                                value={opt}
                                onChange={(e) =>
                                  updateChoiceOption(
                                    qIndex,
                                    oIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder={`选项${String.fromCharCode(
                                  65 + oIndex,
                                )}`}
                                style={{ flex: 1 }}
                              />
                              {editable && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<MinusCircleOutlined />}
                                  onClick={() =>
                                    removeChoiceOption(qIndex, oIndex)
                                  }
                                />
                              )}
                            </Space>
                          ))}
                        </Space>
                        {editable && (
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => addChoiceOption(qIndex)}
                            style={{ marginTop: 8 }}
                          >
                            添加选项
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Form.Item
                        label="题目标题"
                        required
                        extra="用 $ 占位表示填空"
                      >
                        <Input
                          disabled={!editable}
                          value={q.title}
                          onChange={(e) => {
                            const title = e.target.value;
                            const count = (title.match(/\$/g) || []).length;
                            const newCount = count > 0 ? count : 1;
                            // 同时更新标题和填空数量
                            const newQuestions = [...questions];
                            const qq = newQuestions[qIndex] as FillQuestion;
                            const newAnswers = [...qq.answers];
                            if (newCount > newAnswers.length) {
                              for (
                                let i = newAnswers.length;
                                i < newCount;
                                i++
                              ) {
                                newAnswers.push('');
                              }
                            } else {
                              newAnswers.splice(newCount);
                            }
                            newQuestions[qIndex] = {
                              ...qq,
                              title,
                              blankCount: newCount,
                              answers: newAnswers,
                            };
                            setQuestions(newQuestions);
                          }}
                          placeholder="请输入题目标题，例如：《$》是$的作者"
                        />
                      </Form.Item>

                      {!editable && (
                        <Form.Item label="填空数量">
                          <Text>{q.blankCount}</Text>
                        </Form.Item>
                      )}

                      <div>
                        <Text
                          strong
                          style={{ display: 'block', marginBottom: 8 }}
                        >
                          答案：
                        </Text>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {q.answers.map((ans, aIndex) => (
                            <Space key={aIndex}>
                              <Text>第{aIndex + 1}空：</Text>
                              <Input
                                disabled={!editable}
                                value={ans}
                                onChange={(e) =>
                                  updateFillAnswer(
                                    qIndex,
                                    aIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder={`请输入第${aIndex + 1}空的答案`}
                                style={{ width: 300 }}
                              />
                            </Space>
                          ))}
                        </Space>
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {questions.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '40px 0',
                  }}
                >
                  暂无题目
                </div>
              )}
            </div>
          </Form.Item>

          {editable && (
            <Form.Item>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
      <Modal
        title="AI智能生成题目"
        open={aiModalOpen}
        confirmLoading={aiGenerating}
        okText="确定"
        cancelText="取消"
        onOk={handleAiGenerate}
        onCancel={closeAiGenerateModal}
        maskClosable={!aiGenerating}
        destroyOnClose
      >
        <Form
          form={aiForm}
          layout="vertical"
          initialValues={{
            choiceCount: 5,
            fillCount: 5,
            score: 5,
          }}
        >
          <Form.Item
            name="file"
            label="文档"
            valuePropName="fileList"
            getValueFromEvent={normalizeUploadFileList}
            rules={[{ required: true, message: '请上传Word或PDF文档' }]}
          >
            <Upload
              accept=".doc,.docx,.pdf"
              maxCount={1}
              beforeUpload={(file) => {
                const extension = file.name.split('.').pop()?.toLowerCase();
                if (
                  !extension ||
                  !ACCEPTED_AI_FILE_EXTENSIONS.includes(extension)
                ) {
                  message.error('仅支持上传Word或PDF文档');
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>上传Word或PDF文档</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="choiceCount"
            label="选择题数量"
            rules={[{ required: true, message: '请输入选择题数量' }]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="请输入选择题数量"
            />
          </Form.Item>

          <Form.Item
            name="fillCount"
            label="填空题数量"
            dependencies={['choiceCount']}
            rules={[
              { required: true, message: '请输入填空题数量' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const choiceCount = Number(getFieldValue('choiceCount') || 0);
                  const fillCount = Number(value || 0);
                  if (choiceCount + fillCount <= 0) {
                    return Promise.reject(
                      new Error('选择题和填空题数量不能同时为0'),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="请输入填空题数量"
            />
          </Form.Item>

          <Form.Item
            name="score"
            label="每题分数"
            rules={[{ required: true, message: '请输入每题分数' }]}
          >
            <InputNumber
              min={1}
              precision={0}
              style={{ width: '100%' }}
              placeholder="请输入每题分数"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TestDetailPage;
