import ResourceSelector from '@/components/ResourceSelector';
import {
  addProduct,
  getProductDetail,
  ProductRequest,
  updateProduct,
} from '@/services/product';
import {
  addProductCategory,
  getProductCategories,
  ProductCategoryRef,
} from '@/services/productCategory';
import { getResourceList, ResourceListItem } from '@/services/resource';
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
  Space,
  Spin,
} from 'antd';
import React, { useEffect, useState } from 'react';

type CategoryLevel = 'primary' | 'secondary';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAddMode = location.pathname === '/product/add';
  const editable = isAddMode || location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isAddMode);
  const [submitting, setSubmitting] = useState(false);
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<
    ProductCategoryRef[]
  >([]);
  const [secondaryCategories, setSecondaryCategories] = useState<
    ProductCategoryRef[]
  >([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryModalLevel, setCategoryModalLevel] = useState<CategoryLevel>();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryCreating, setCategoryCreating] = useState(false);
  const selectedPrimaryId = Form.useWatch('primaryCategoryId', form);

  const loadResources = async () => {
    try {
      const res = await getResourceList({ pageNum: 1, pageSize: 100 });
      if (res.code === 0 && Array.isArray(res.data?.list)) {
        setResources(res.data.list);
      }
    } catch (error: any) {
      message.error(error?.message || '获取资源列表失败');
    }
  };

  const loadPrimaryCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await getProductCategories(0);
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
      const res = await getProductCategories(primaryId);
      if (res.code === 0 && Array.isArray(res.data)) {
        setSecondaryCategories(res.data);
        return res.data as ProductCategoryRef[];
      }
      message.error(res.des || '获取二级分类失败');
    } catch (error: any) {
      message.error(error?.message || '获取二级分类失败');
    } finally {
      setCategoryLoading(false);
    }
    return [];
  };

  useEffect(() => {
    void loadResources();
    void loadPrimaryCategories();

    if (!isAddMode && id) {
      const loadDetail = async () => {
        try {
          const res = await getProductDetail(id);
          if (res.code !== 0 || !res.data) {
            message.error(res.des || '获取产品详情失败');
            return;
          }
          const data = res.data;
          if (data.primaryCategory?.id) {
            await loadSecondaryCategories(data.primaryCategory.id);
          }
          form.setFieldsValue({
            name: data.name,
            description: data.description,
            coverResource: data.coverResource,
            videoResource: data.videoResource,
            primaryCategoryId: data.primaryCategory?.id,
            secondaryCategoryId: data.secondaryCategory?.id,
            specs: Array.isArray(data.specs) ? data.specs : [],
          });
        } catch (error: any) {
          message.error(error?.message || '获取产品详情失败');
        } finally {
          setLoading(false);
        }
      };
      void loadDetail();
    }
  }, [id, isAddMode, form]);

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
      const res = await addProductCategory({ parentId, name });
      if (res.code !== 0 || !res.data) {
        message.error(res.des || '新增分类失败');
        return;
      }
      const category = res.data as ProductCategoryRef;
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

  const handleSubmit = async (values: any) => {
    const body: ProductRequest = {
      name: values.name,
      description: values.description,
      coverResourceId: values.coverResource.id,
      videoResourceId: values.videoResource?.id,
      primaryCategoryId: values.primaryCategoryId,
      secondaryCategoryId: values.secondaryCategoryId,
      specs: values.specs || [],
    };
    setSubmitting(true);
    try {
      const res = isAddMode
        ? await addProduct(body)
        : await updateProduct(id!, body);
      if (handleApiResponse(res)) history.push('/product');
    } finally {
      setSubmitting(false);
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

  return (
    <PageContainer
      header={{
        title: isAddMode ? '新增产品' : editable ? '编辑产品' : '产品详情',
        onBack: () => history.push('/product'),
      }}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          disabled={!editable}
          onFinish={handleSubmit}
          initialValues={{ specs: [] }}
        >
          <Card title="基础信息">
            <Form.Item
              name="name"
              label="产品名称"
              rules={[
                { required: true, message: '请输入产品名称' },
                { max: 100, message: '产品名称不能超过100个字符' },
              ]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="产品描述"
              rules={[
                { required: true, message: '请输入产品描述' },
                { max: 2000, message: '产品描述不能超过2000个字符' },
              ]}
            >
              <Input.TextArea rows={4} placeholder="请输入产品描述" />
            </Form.Item>

            <Form.Item
              name="primaryCategoryId"
              label="一级分类"
              rules={[{ required: true, message: '请选择一级分类' }]}
            >
              <Select
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
                loading={categoryLoading}
                disabled={!editable || !selectedPrimaryId}
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
          </Card>

          <Card title="媒体资源" style={{ marginTop: 16 }}>
            <Form.Item
              name="coverResource"
              label="产品图片"
              rules={[{ required: true, message: '请选择产品图片' }]}
            >
              <ResourceSelector
                resourceList={resources}
                onRefreshResourceList={loadResources}
                allowedTypes={[0]}
                placeholder="请选择图片资源"
                disabled={!editable}
              />
            </Form.Item>

            <Form.Item name="videoResource" label="介绍视频（选填）">
              <ResourceSelector
                resourceList={resources}
                onRefreshResourceList={loadResources}
                allowedTypes={[1]}
                placeholder="请选择视频资源"
                disabled={!editable}
              />
            </Form.Item>
          </Card>

          <Card title="说明信息" style={{ marginTop: 16 }}>
            <Form.List name="specs">
              {(fields, { add, remove }) => (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`第 ${index + 1} 项`}
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, 'title']}
                        label="标题"
                        rules={[
                          { required: true, message: '请输入标题' },
                          { max: 50, message: '标题不能超过50个字符' },
                        ]}
                      >
                        <Input placeholder="例如：上市时间" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'content']}
                        label="内容"
                        rules={[
                          { required: true, message: '请输入内容' },
                          { max: 2000, message: '内容不能超过2000个字符' },
                        ]}
                      >
                        <Input.TextArea rows={3} placeholder="请输入说明内容" />
                      </Form.Item>
                      {editable && (
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          删除该项
                        </Button>
                      )}
                    </Card>
                  ))}
                  {editable && (
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      disabled={fields.length >= 100}
                      onClick={() => add({ title: '', content: '' })}
                    >
                      添加说明信息
                    </Button>
                  )}
                </Space>
              )}
            </Form.List>
          </Card>

          <Space style={{ marginTop: 24 }}>
            {editable && (
              <Button type="primary" htmlType="submit" loading={submitting}>
                保存
              </Button>
            )}
            <Button onClick={() => history.push('/product')}>返回</Button>
          </Space>
        </Form>
      </Spin>

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

export default ProductDetailPage;
