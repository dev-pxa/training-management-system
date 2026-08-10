import {
  deleteProducts,
  getProductList,
  ProductListItem,
  updateProductOnline,
} from '@/services/product';
import {
  getProductCategories,
  ProductCategoryRef,
} from '@/services/productCategory';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProFormInstance,
  ProTable,
} from '@ant-design/pro-components';
import { history, Link } from '@umijs/max';
import { Button, Image, message, Modal, Popconfirm, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const ProductPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [selectedRows, setSelectedRows] = useState<ProductListItem[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<
    ProductCategoryRef[]
  >([]);
  const [secondaryCategories, setSecondaryCategories] = useState<
    ProductCategoryRef[]
  >([]);
  const [filterPrimaryId, setFilterPrimaryId] = useState<number>();

  const loadPrimaryCategories = async () => {
    try {
      const res = await getProductCategories(0);
      if (res.code === 0 && Array.isArray(res.data)) {
        setPrimaryCategories(res.data);
      } else {
        message.error(res.des || '获取一级分类失败');
      }
    } catch (error: any) {
      message.error(error?.message || '获取一级分类失败');
    }
  };

  const loadSecondaryCategories = async (primaryId?: number) => {
    if (!primaryId) {
      setSecondaryCategories([]);
      return;
    }
    try {
      const res = await getProductCategories(primaryId);
      if (res.code === 0 && Array.isArray(res.data)) {
        setSecondaryCategories(res.data);
      } else {
        message.error(res.des || '获取二级分类失败');
      }
    } catch (error: any) {
      message.error(error?.message || '获取二级分类失败');
    }
  };

  useEffect(() => {
    loadPrimaryCategories();
  }, []);

  const handleOnlineStatusChange = async (
    record: ProductListItem,
    isOnline: boolean,
  ) => {
    const res = await updateProductOnline({ id: record.id, isOnline });
    if (handleApiResponse(res, isOnline ? '上架成功' : '下架成功')) {
      actionRef.current?.reload();
    }
  };

  const confirmOnlineStatusChange = (
    record: ProductListItem,
    isOnline: boolean,
  ) => {
    Modal.confirm({
      title: isOnline ? '确定要上架该产品吗？' : '确定要下架该产品吗？',
      content: isOnline
        ? '上架后学员可以在产品说明中查看该产品。'
        : '下架后学员将无法查看该产品。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: !isOnline },
      onOk: () => handleOnlineStatusChange(record, isOnline),
    });
  };

  const handleDelete = async (id: number) => {
    const res = await deleteProducts({ ids: [id] });
    if (handleApiResponse(res)) actionRef.current?.reload();
  };

  const handleBatchDelete = async () => {
    const res = await deleteProducts({
      ids: selectedRows.map((item) => item.id),
    });
    if (handleApiResponse(res)) {
      setSelectedRows([]);
      actionRef.current?.reload();
    }
  };

  const columns: any[] = [
    {
      title: '产品图片',
      dataIndex: 'coverResource',
      width: 110,
      hideInSearch: true,
      render: (_: any, record: ProductListItem) =>
        record.coverResource?.contentUrl ? (
          <Image
            src={record.coverResource.contentUrl}
            width={72}
            height={54}
            style={{ objectFit: 'cover', borderRadius: 6 }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '一级分类',
      dataIndex: 'primaryCategoryId',
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: primaryCategories.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        onChange: (value?: number) => {
          setFilterPrimaryId(value);
          formRef.current?.setFieldValue('secondaryCategoryId', undefined);
          void loadSecondaryCategories(value);
        },
      },
      render: (_: any, record: ProductListItem) =>
        record.primaryCategory?.name || '-',
    },
    {
      title: '二级分类',
      dataIndex: 'secondaryCategoryId',
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        disabled: !filterPrimaryId,
        placeholder: filterPrimaryId ? '请选择二级分类' : '请先选择一级分类',
        options: secondaryCategories.map((item) => ({
          label: item.name,
          value: item.id,
        })),
      },
      render: (_: any, record: ProductListItem) =>
        record.secondaryCategory?.name || '-',
    },
    {
      title: '上下架状态',
      dataIndex: 'isOnline',
      valueType: 'select',
      width: 120,
      valueEnum: {
        true: { text: '已上架' },
        false: { text: '未上架' },
      },
      render: (_: any, record: ProductListItem) =>
        record.isOnline ? (
          <Tag color="green">已上架</Tag>
        ) : (
          <Tag color="default">未上架</Tag>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 320,
      render: (_: any, record: ProductListItem) => [
        <Link key="detail" to={`/product/detail/${record.id}?editable=false`}>
          详情
        </Link>,
        <Link key="edit" to={`/product/detail/${record.id}?editable=true`}>
          编辑
        </Link>,
        <Button
          key="online"
          type="link"
          danger={record.isOnline}
          onClick={() => confirmOnlineStatusChange(record, !record.isOnline)}
        >
          {record.isOnline ? '下架' : '上架'}
        </Button>,
        <Popconfirm
          key="delete"
          title="确定删除该产品吗？"
          okText="确定"
          cancelText="取消"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer header={{ title: '产品管理' }}>
      <ProTable<ProductListItem>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        headerTitle="产品列表"
        search={{ labelWidth: 100 }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/product/add')}
          >
            新增产品
          </Button>,
        ]}
        rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
        request={async (params) => {
          const res = await getProductList({
            queryInfo: {
              name: params.name,
              primaryCategoryId: params.primaryCategoryId
                ? Number(params.primaryCategoryId)
                : undefined,
              secondaryCategoryId: params.secondaryCategoryId
                ? Number(params.secondaryCategoryId)
                : undefined,
              isOnline:
                params.isOnline === undefined
                  ? undefined
                  : params.isOnline === true || params.isOnline === 'true',
            },
            pageNum: params.current || 1,
            pageSize: params.pageSize || 10,
          });
          if (res.code !== 0) {
            message.error(res.des || '获取产品列表失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.list || [],
            success: true,
            total: Number(res.data?.total || 0),
          };
        }}
      />

      {selectedRows.length > 0 && (
        <FooterToolbar extra={<span>已选择 {selectedRows.length} 项</span>}>
          <Popconfirm
            title="确定批量删除选中的产品吗？"
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button danger>批量删除</Button>
          </Popconfirm>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

export default ProductPage;
