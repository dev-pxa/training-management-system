import ResourceSelector from '@/components/ResourceSelector';
import {
  addCourse,
  Chapter,
  CourseResourceRef,
  getCourseDetail,
  updateCourse,
} from '@/services/course';
import {
  addCourseCategory,
  CourseCategoryRef,
  getCourseCategories,
} from '@/services/courseCategory';
import { getResourceList, ResourceListItem } from '@/services/resource';
import { getTestList, TestListItem } from '@/services/test';
import { handleApiResponse } from '@/utils/response';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Select,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;
type CategoryLevel = 'primary' | 'secondary';

const normalizeResource = (
  resource?: CourseResourceRef,
  contentUrl?: string,
): CourseResourceRef | undefined => {
  if (resource) {
    return resource;
  }
  if (contentUrl) {
    return { contentUrl };
  }
  return undefined;
};

const formatResource = (resource?: CourseResourceRef) =>
  resource
    ? {
        id: resource.id,
        name: resource.name,
        contentUrl: resource.contentUrl,
        type: resource.type,
        duration: resource.duration,
        downloadable: resource.downloadable,
      }
    : undefined;

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
  const [testList, setTestList] = useState<TestListItem[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [primaryCategories, setPrimaryCategories] = useState<
    CourseCategoryRef[]
  >([]);
  const [secondaryCategories, setSecondaryCategories] = useState<
    CourseCategoryRef[]
  >([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryModalLevel, setCategoryModalLevel] = useState<CategoryLevel>();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryCreating, setCategoryCreating] = useState(false);
  const selectedPrimaryId = Form.useWatch('primaryCategoryId', form);

  const loadPrimaryCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await getCourseCategories(0);
      if (res.code === 0 && Array.isArray(res.data)) {
        setPrimaryCategories(res.data);
      } else {
        message.error(res.des || '获取一级分类失败');
      }
    } catch (error: any) {
      message.error(error?.message || '获取一级分类失败');
    } finally {
      setCategoryLoading(false);
    }
  };

  const loadSecondaryCategories = async (primaryId?: number) => {
    if (!primaryId) {
      setSecondaryCategories([]);
      return [];
    }
    setCategoryLoading(true);
    try {
      const res = await getCourseCategories(primaryId);
      if (res.code === 0 && Array.isArray(res.data)) {
        setSecondaryCategories(res.data);
        return res.data as CourseCategoryRef[];
      }
      message.error(res.des || '获取二级分类失败');
    } catch (error: any) {
      message.error(error?.message || '获取二级分类失败');
    } finally {
      setCategoryLoading(false);
    }
    return [];
  };

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

  const loadTests = async () => {
    setTestLoading(true);
    try {
      const res = await getTestList({
        pageSize: 100,
        pageNum: 1,
      });
      if (res.code === 0 && res.data?.list) {
        setTestList(res.data.list);
      } else {
        message.error(res.des || '获取测试列表失败');
      }
    } catch (error: any) {
      message.error(error?.message || '获取测试列表失败');
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    // 加载资源列表和测试列表
    loadResources();
    loadTests();
    void loadPrimaryCategories();

    if (!isAddMode && id) {
      const fetchData = async () => {
        try {
          const res = await getCourseDetail(id);
          if (res.code === 0 && res.data) {
            const data = res.data;
            if (data.primaryCategory?.id) {
              await loadSecondaryCategories(data.primaryCategory.id);
            }
            setCourseType(data.type);
            setChapters(
              Array.isArray(data.details)
                ? data.details.map((chapter: any) => ({
                    name: chapter.name,
                    desc: chapter.desc,
                    contentResource: normalizeResource(
                      chapter.contentResource,
                      chapter.contentUrl,
                    ),
                  }))
                : [],
            );
            form.setFieldsValue({
              name: data.name,
              desc: data.desc,
              type: data.type,
              primaryCategoryId: data.primaryCategory?.id,
              secondaryCategoryId: data.secondaryCategory?.id,
              owner: data.owner,
              hasTest: data.hasTest,
              coverResource: normalizeResource(
                data.coverResource,
                data.coverUrl,
              ),
              certificateResource: normalizeResource(
                data.certificateResource,
                data.certificateUrl,
              ),
              testInfo: data.testInfo,
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
      if (!chapters[i].contentResource?.contentUrl) {
        message.error(`第 ${i + 1} 章：请选择章节内容`);
        return;
      }
    }

    const selectedTest = testList.find(
      (test) => test.id === values.testInfo?.id,
    );
    const data = {
      name: values.name,
      desc: values.desc,
      type: values.type,
      primaryCategoryId: values.primaryCategoryId,
      secondaryCategoryId: values.secondaryCategoryId,
      hasTest: values.hasTest,
      coverResource: formatResource(values.coverResource),
      certificateResource: formatResource(values.certificateResource),
      testInfo: values.hasTest
        ? {
            id: values.testInfo?.id,
            name: selectedTest?.name || values.testInfo?.name,
          }
        : undefined,
      details: chapters.map((chapter) => ({
        name: chapter.name,
        desc: chapter.desc,
        contentResource: formatResource(chapter.contentResource),
      })),
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

  const handleHasTestChange = (value: boolean) => {
    if (!value) {
      form.setFieldsValue({
        testInfo: undefined,
      });
    }
  };

  const getTestOptions = () => {
    const options = testList.map((test) => ({
      value: test.id,
      label: `${test.id}-${test.name}`,
    }));
    const currentTestInfo = form.getFieldValue('testInfo');
    const currentTestId = currentTestInfo?.id;
    const currentTestName = currentTestInfo?.name;

    if (
      currentTestId &&
      currentTestName &&
      !options.some((option) => option.value === currentTestId)
    ) {
      options.unshift({
        value: currentTestId,
        label: `${currentTestId}-${currentTestName}`,
      });
    }

    return options;
  };

  const handlePrimaryChange = (primaryId?: number) => {
    form.setFieldValue('secondaryCategoryId', undefined);
    void loadSecondaryCategories(primaryId);
  };

  const openCategoryModal = (level: CategoryLevel) => {
    if (level === 'secondary' && !form.getFieldValue('primaryCategoryId')) {
      message.warning('请先选择一级分类');
      return;
    }
    setNewCategoryName('');
    setCategoryModalLevel(level);
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      message.warning('请输入分类名称');
      return;
    }
    const primaryId = form.getFieldValue('primaryCategoryId') as
      | number
      | undefined;
    if (categoryModalLevel === 'secondary' && !primaryId) {
      message.warning('请先选择一级分类');
      return;
    }
    setCategoryCreating(true);
    try {
      const parentId = categoryModalLevel === 'secondary' ? primaryId! : 0;
      const res = await addCourseCategory({ parentId, name });
      if (res.code !== 0 || !res.data) {
        message.error(res.des || '新增分类失败');
        return;
      }
      const category = res.data as CourseCategoryRef;
      if (categoryModalLevel === 'primary') {
        await loadPrimaryCategories();
        form.setFieldsValue({
          primaryCategoryId: category.id,
          secondaryCategoryId: undefined,
        });
        setSecondaryCategories([]);
      } else {
        await loadSecondaryCategories(primaryId);
        form.setFieldValue('secondaryCategoryId', category.id);
      }
      message.success('分类新增成功');
      setCategoryModalLevel(undefined);
      setNewCategoryName('');
    } catch (error: any) {
      message.error(error?.message || '新增分类失败');
    } finally {
      setCategoryCreating(false);
    }
  };

  const categoryDropdown = (menu: React.ReactNode, level: CategoryLevel) => (
    <>
      {menu}
      {editable && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Button
            type="text"
            block
            icon={<PlusOutlined />}
            disabled={level === 'secondary' && !selectedPrimaryId}
            onClick={() => openCategoryModal(level)}
          >
            添加{level === 'primary' ? '一级' : '二级'}分类
          </Button>
        </>
      )}
    </>
  );

  const primaryName = primaryCategories.find(
    (item) => item.id === form.getFieldValue('primaryCategoryId'),
  )?.name;

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

          <Form.Item name="coverResource" label="课程封面">
            <ResourceSelector
              value={form.getFieldValue('coverResource')}
              onChange={(resource) =>
                form.setFieldsValue({ coverResource: resource })
              }
              resourceList={resourceList}
              onRefreshResourceList={loadResources}
              placeholder="请选择课程封面"
              disabled={!editable}
              allowedTypes={[0]}
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

          <Form.Item
            name="primaryCategoryId"
            label="一级分类"
            rules={[{ required: true, message: '请选择一级分类' }]}
          >
            <Select
              disabled={!editable}
              loading={categoryLoading}
              placeholder="请选择一级分类"
              options={primaryCategories.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
              onChange={handlePrimaryChange}
              popupRender={(menu) => categoryDropdown(menu, 'primary')}
            />
          </Form.Item>

          <Form.Item name="secondaryCategoryId" label="二级分类（选填）">
            <Select
              allowClear
              disabled={!editable || !selectedPrimaryId}
              loading={categoryLoading}
              placeholder={
                selectedPrimaryId ? '请选择二级分类' : '请先选择一级分类'
              }
              notFoundContent={
                selectedPrimaryId ? '暂无二级分类' : '请先选择一级分类'
              }
              options={
                selectedPrimaryId
                  ? secondaryCategories.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))
                  : []
              }
              popupRender={(menu) => categoryDropdown(menu, 'secondary')}
            />
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
            <Select
              disabled={!editable}
              placeholder="请选择"
              onChange={handleHasTestChange}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="certificateResource"
            label="证书"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('hasTest') && !value?.contentUrl) {
                    return Promise.reject(new Error('需要考试时请选择证书'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <ResourceSelector
              value={form.getFieldValue('certificateResource')}
              onChange={(resource) =>
                form.setFieldsValue({ certificateResource: resource })
              }
              resourceList={resourceList}
              onRefreshResourceList={loadResources}
              placeholder="请选择证书"
              disabled={!editable}
              allowedTypes={[0]} // 证书只能是图片资源
            />
          </Form.Item>

          <Form.Item name={['testInfo', 'name']} hidden>
            <Input />
          </Form.Item>

          <Form.Item
            shouldUpdate={(prev, current) => prev.hasTest !== current.hasTest}
          >
            {({ getFieldValue }) =>
              getFieldValue('hasTest') ? (
                <Form.Item
                  name={['testInfo', 'id']}
                  label="考试"
                  rules={[{ required: true, message: '请选择考试' }]}
                >
                  <Select
                    disabled={!editable}
                    loading={testLoading}
                    placeholder="请选择考试"
                    options={getTestOptions()}
                    onChange={(value) => {
                      const selectedTest = testList.find(
                        (test) => test.id === value,
                      );
                      form.setFieldsValue({
                        testInfo: {
                          id: value,
                          name: selectedTest?.name,
                        },
                      });
                    }}
                  />
                </Form.Item>
              ) : null
            }
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
                    value={chapter.contentResource}
                    onChange={(resource) =>
                      updateChapter(index, 'contentResource', resource)
                    }
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

      <Modal
        open={!!categoryModalLevel}
        title={`添加${categoryModalLevel === 'primary' ? '一级' : '二级'}分类`}
        okText="确认添加"
        cancelText="取消"
        confirmLoading={categoryCreating}
        onOk={handleCreateCategory}
        onCancel={() => setCategoryModalLevel(undefined)}
      >
        {categoryModalLevel === 'secondary' && (
          <div style={{ marginBottom: 12 }}>
            新分类将添加到一级分类“{primaryName || '-'}”下。
          </div>
        )}
        <Input
          value={newCategoryName}
          maxLength={50}
          placeholder="请输入分类名称"
          onChange={(event) => setNewCategoryName(event.target.value)}
          onPressEnter={handleCreateCategory}
        />
      </Modal>
    </PageContainer>
  );
};

export default CourseDetailPage;
