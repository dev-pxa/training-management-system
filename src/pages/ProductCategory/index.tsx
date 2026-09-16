import {
  addProductCategory,
  deleteProductCategory,
  getProductCategories,
  ProductCategoryRef,
  updateProductCategory,
} from '@/services/productCategory';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, message, Modal, Popconfirm, Space } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

interface CategoryTreeItem extends ProductCategoryRef {
  key: number;
  children?: CategoryTreeItem[];
}

type CategoryModalState =
  | { mode: 'create-primary' }
  | { mode: 'create-secondary'; parent: ProductCategoryRef }
  | { mode: 'edit'; category: ProductCategoryRef }
  | undefined;

const ProductCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<CategoryModalState>();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const primaryResult = await getProductCategories(0);
      if (primaryResult.code !== 0 || !Array.isArray(primaryResult.data)) {
        message.error(primaryResult.des || '获取产品分类失败');
        return;
      }
      const primaryCategories = primaryResult.data as ProductCategoryRef[];
      const childrenResults = await Promise.all(
        primaryCategories.map((category) => getProductCategories(category.id)),
      );
      const categoryTree = primaryCategories.map((category, index) => {
        const childrenResult = childrenResults[index];
        const children =
          childrenResult.code === 0 && Array.isArray(childrenResult.data)
            ? (childrenResult.data as ProductCategoryRef[]).map((item) => ({
                ...item,
                key: item.id,
              }))
            : [];
        return { ...category, key: category.id, children };
      });
      const failedResult = childrenResults.find((result) => result.code !== 0);
      if (failedResult) {
        message.warning(failedResult.des || '部分二级分类加载失败');
      }
      setCategories(categoryTree);
    } catch (error: any) {
      message.error(error?.message || '获取产品分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openModal = (state: Exclude<CategoryModalState, undefined>) => {
    setModalState(state);
    form.setFieldsValue({
      name: state.mode === 'edit' ? state.category.name : '',
    });
  };

  const handleSubmit = async () => {
    const { name } = await form.validateFields();
    const normalizedName = name.trim();
    setSubmitting(true);
    try {
      let result;
      if (modalState?.mode === 'edit') {
        result = await updateProductCategory(modalState.category.id, {
          name: normalizedName,
        });
      } else if (modalState?.mode === 'create-secondary') {
        result = await addProductCategory({
          parentId: modalState.parent.id,
          name: normalizedName,
        });
      } else {
        result = await addProductCategory({
          parentId: 0,
          name: normalizedName,
        });
      }
      if (
        handleApiResponse(
          result,
          modalState?.mode === 'edit' ? '分类已更新' : '分类已添加',
        )
      ) {
        setModalState(undefined);
        form.resetFields();
        await loadCategories();
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: ProductCategoryRef) => {
    try {
      const result = await deleteProductCategory(category.id);
      if (handleApiResponse(result, '分类已删除')) {
        await loadCategories();
      }
    } catch (error: any) {
      message.error(error?.message || '删除分类失败');
    }
  };

  const modalTitle =
    modalState?.mode === 'edit'
      ? '编辑分类'
      : modalState?.mode === 'create-secondary'
      ? '新增二级分类'
      : '新增一级分类';

  const columns: any[] = [
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 360,
    },
    {
      title: '分类层级',
      dataIndex: 'parentId',
      width: 140,
      render: (parentId: number) => (parentId === 0 ? '一级分类' : '二级分类'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 300,
      render: (_: unknown, record: ProductCategoryRef) => (
        <Space size={0}>
          <Button
            type="link"
            onClick={() => openModal({ mode: 'edit', category: record })}
          >
            编辑
          </Button>
          {record.parentId === 0 && (
            <Button
              type="link"
              onClick={() =>
                openModal({ mode: 'create-secondary', parent: record })
              }
            >
              新增二级分类
            </Button>
          )}
          <Popconfirm
            title="确定要删除该分类吗？"
            description="已关联产品或含有二级分类时无法删除。"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
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
    <PageContainer header={{ title: '产品分类管理' }}>
      <ProTable<CategoryTreeItem>
        headerTitle="产品分类"
        rowKey="id"
        loading={loading}
        search={false}
        pagination={false}
        dataSource={categories}
        columns={columns}
        expandable={{ defaultExpandAllRows: true }}
        toolBarRender={() => [
          <Button
            key="add-primary"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal({ mode: 'create-primary' })}
          >
            新增一级分类
          </Button>,
        ]}
      />
      <Modal
        open={!!modalState}
        title={modalTitle}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalState(undefined)}
        destroyOnClose
      >
        {modalState?.mode === 'create-secondary' && (
          <p>新分类将添加到一级分类“{modalState.parent.name}”下。</p>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 50, message: '分类名称不能超过50个字符' },
            ]}
          >
            <Input autoFocus maxLength={50} placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProductCategoryPage;
