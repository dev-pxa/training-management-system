import ResourceSelector from '@/components/ResourceSelector';
import {
  addCourse,
  Chapter,
  getCourseDetail,
  updateCourse,
} from '@/services/course';
import { getResourceList, ResourceListItem } from '@/services/resource';
import { handleApiResponse } from '@/utils/response';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import { Button, Card, Form, Input, message, Select } from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAddMode = location.pathname === '/course/add';
  const editable = isAddMode || location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courseType, setCourseType] = useState<number>(0);
  const [loading, setLoading] = useState(!isAddMode);
  const [resourceList, setResourceList] = useState<ResourceListItem[]>([]);

  const loadResources = async () => {
    try {
      const res = await getResourceList({
        pageSize: 100,
        pageNum: 1,
      });
      if (res.code === 0 && res.data?.list) {
        setResourceList(res.data.list);
      }
    } catch (error) {
      console.error('Load resources failed:', error);
    }
  };

  useEffect(() => {
    // 加载资源列表
    loadResources();

    if (!isAddMode && id) {
      const fetchData = async () => {
        try {
          const res = await getCourseDetail(id);
          if (res.code === 0 && res.data) {
            const data = res.data;
            setCourseType(data.type);
            setChapters(Array.isArray(data.details) ? data.details : []);
            form.setFieldsValue({
              name: data.name,
              desc: data.desc,
              type: data.type,
              owner: data.owner,
              hasTest: data.hasTest,
              certificateUrl: data.certificateUrl,
            });
          } else {
            message.error(res.des || '获取课程详情失败');
          }
        } catch (error: any) {
          message.error(error?.message || '获取课程详情失败');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, form, isAddMode]);

  const handleSubmit = async (values: any) => {
    for (let i = 0; i < chapters.length; i++) {
      if (!chapters[i].name) {
        message.error(`第 ${i + 1} 章：请输入章节名`);
        return;
      }
      if (!chapters[i].desc) {
        message.error(`第 ${i + 1} 章：请输入章节描述`);
        return;
      }
      if (!chapters[i].contentUrl) {
        message.error(`第 ${i + 1} 章：请选择章节内容`);
        return;
      }
    }

    const data = {
      ...values,
      details: chapters,
    };

    let res;
    if (isAddMode) {
      res = await addCourse(data);
    } else {
      res = await updateCourse(id!, {
        ...data,
        id: id!,
        owner: form.getFieldValue('owner'),
      });
    }

    if (handleApiResponse(res)) {
      history.push('/course');
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      name: '',
      desc: '',
      contentUrl: '',
    };
    setChapters([...chapters, newChapter]);
  };

  const removeChapter = (index: number) => {
    const newChapters = [...chapters];
    newChapters.splice(index, 1);
    setChapters(newChapters);
  };

  const updateChapter = (index: number, field: keyof Chapter, value: any) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapters(newChapters);
  };

  const handleTypeChange = (value: number) => {
    setCourseType(value);
    if (value === 0 && chapters.length > 0) {
      setChapters([chapters[0]]);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <PageContainer
      header={{
        title: isAddMode ? '添加课程' : editable ? '编辑课程' : '课程详情',
      }}
    >
      <div style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="课程/系列名称"
            rules={[{ required: true, message: '请输入课程/系列名称' }]}
          >
            <Input disabled={!editable} placeholder="请输入课程/系列名称" />
          </Form.Item>

          <Form.Item
            name="desc"
            label="课程简介"
            rules={[{ required: true, message: '请输入课程简介' }]}
          >
            <TextArea
              disabled={!editable}
              rows={4}
              placeholder="请输入课程简介"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select
              disabled={!editable}
              placeholder="请选择类型"
              onChange={handleTypeChange}
            >
              <Option value={0}>微课程</Option>
              <Option value={1}>系列课程</Option>
            </Select>
          </Form.Item>

          {!isAddMode && (
            <Form.Item name="owner" label="管理员">
              <Input disabled placeholder="管理员" />
            </Form.Item>
          )}

          <Form.Item
            name="hasTest"
            label="是否需要考试"
            rules={[{ required: true, message: '请选择是否需要考试' }]}
          >
            <Select disabled={!editable} placeholder="请选择">
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="certificateUrl"
            label="证书"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('hasTest') && !value) {
                    return Promise.reject(new Error('需要考试时请选择证书'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <ResourceSelector
              value={form.getFieldValue('certificateUrl')}
              onChange={(url) => form.setFieldsValue({ certificateUrl: url })}
              resourceList={resourceList}
              onRefreshResourceList={loadResources}
              placeholder="请选择证书"
              disabled={!editable}
              allowedTypes={[0]} // 证书只能是图片资源
            />
          </Form.Item>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3>章节列表</h3>
              {editable &&
                (courseType === 1 ||
                  (courseType === 0 && chapters.length === 0)) && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addChapter}
                  >
                    添加章节
                  </Button>
                )}
            </div>

            {chapters.map((chapter, index) => (
              <Card
                key={index}
                style={{ marginBottom: 16 }}
                title={`章节 ${index + 1}`}
                extra={
                  editable &&
                  chapters.length > 0 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeChapter(index)}
                    />
                  )
                }
              >
                <Form.Item
                  label="章节名"
                  name={`chapterName_${index}`}
                  rules={[{ required: true, message: '请输入章节名' }]}
                  initialValue={chapter.name}
                >
                  <Input
                    disabled={!editable}
                    placeholder="请输入章节名"
                    onChange={(e) =>
                      updateChapter(index, 'name', e.target.value)
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="章节描述"
                  name={`chapterDesc_${index}`}
                  rules={[{ required: true, message: '请输入章节描述' }]}
                  initialValue={chapter.desc}
                >
                  <TextArea
                    disabled={!editable}
                    rows={3}
                    placeholder="请输入章节描述"
                    onChange={(e) =>
                      updateChapter(index, 'desc', e.target.value)
                    }
                  />
                </Form.Item>

                <Form.Item label="章节内容">
                  <ResourceSelector
                    value={chapter.contentUrl}
                    onChange={(url) => updateChapter(index, 'contentUrl', url)}
                    resourceList={resourceList}
                    onRefreshResourceList={loadResources}
                    placeholder="请选择资源"
                    disabled={!editable}
                  />
                </Form.Item>
              </Card>
            ))}
          </div>

          {editable && (
            <Form.Item>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </PageContainer>
  );
};

export default CourseDetailPage;
