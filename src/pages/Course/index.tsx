import {
  CourseListItem,
  deleteCourse,
  getCourseList,
  updateCourseOnlineStatus,
} from '@/services/course';
import {
  CourseCategoryRef,
  getCourseCategories,
} from '@/services/courseCategory';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProFormInstance,
  ProTable,
} from '@ant-design/pro-components';
import { Link, Outlet, history } from '@umijs/max';
import { Button, Modal, Popconfirm, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const CoursePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [selectedRows, setSelectedRows] = useState<CourseListItem[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<
    CourseCategoryRef[]
  >([]);
  const [secondaryCategories, setSecondaryCategories] = useState<
    CourseCategoryRef[]
  >([]);
  const [filterPrimaryId, setFilterPrimaryId] = useState<number>();

  const loadSecondaryCategories = async (primaryId?: number) => {
    if (!primaryId) {
      setSecondaryCategories([]);
      return;
    }
    try {
      const res = await getCourseCategories(primaryId);
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
    getCourseCategories(0)
      .then((res) => {
        if (res.code === 0 && Array.isArray(res.data)) {
          setPrimaryCategories(res.data);
        } else {
          message.error(res.des || '获取一级分类失败');
        }
      })
      .catch(() => {
        message.error('获取一级分类失败');
      });
  }, []);

  const handleDelete = async (id: string) => {
    const res = await deleteCourse({ ids: [Number(id)] });
    if (handleApiResponse(res)) {
      actionRef.current?.reload();
    }
  };

  const handleBatchDelete = async () => {
    const selectedIds = selectedRows.map((row) => Number(row.id));
    const res = await deleteCourse({ ids: selectedIds });
    if (handleApiResponse(res)) {
      setSelectedRows([]);
      actionRef.current?.reload();
    }
  };

  const handleAdd = () => {
    history.push('/course/add');
  };

  const handleOnlineStatusChange = async (
    record: CourseListItem,
    isOnline: boolean,
  ) => {
    const res = await updateCourseOnlineStatus({
      id: record.id,
      isOnline,
    });
    if (handleApiResponse(res, isOnline ? '上线成功' : '下线成功')) {
      actionRef.current?.reload();
    }
  };

  const handleConfirmOnlineStatusChange = (
    record: CourseListItem,
    isOnline: boolean,
  ) => {
    Modal.confirm({
      title: isOnline ? '确定要上线该课程吗？' : '确定要下线该课程吗？',
      content: isOnline
        ? '上线后学员将可以看到该课程。'
        : '下线后学员将无法在课程列表中看到该课程。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: !isOnline,
      },
      onOk: () => handleOnlineStatusChange(record, isOnline),
    });
  };

  const columns: any[] = [
    {
      title: '课程/系列名称',
      dataIndex: 'name',
      key: 'name',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      valueType: 'select',
      search: {
        show: true,
        valueEnum: {
          0: { text: '微课程' },
          1: { text: '系列课程' },
        },
      },
      valueEnum: {
        0: { text: '微课程' },
        1: { text: '系列课程' },
      },
    },
    {
      title: '管理员',
      dataIndex: 'owner',
      key: 'owner',
      valueType: 'text',
      search: {
        show: true,
      },
    },
    {
      title: '一级分类',
      dataIndex: 'primaryCategoryId',
      key: 'primaryCategoryId',
      valueType: 'select',
      fieldProps: {
        options: primaryCategories.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        placeholder: '请选择一级分类',
        allowClear: true,
        onChange: (value?: number) => {
          setFilterPrimaryId(value);
          formRef.current?.setFieldValue('secondaryCategoryId', undefined);
          void loadSecondaryCategories(value);
        },
      },
      render: (_: any, record: CourseListItem) =>
        record.primaryCategory?.name || '-',
    },
    {
      title: '二级分类',
      dataIndex: 'secondaryCategoryId',
      key: 'secondaryCategoryId',
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
      render: (_: any, record: CourseListItem) =>
        record.secondaryCategory?.name || '-',
    },
    {
      title: '是否需要考试',
      dataIndex: 'hasTest',
      key: 'hasTest',
      valueType: 'select',
      width: 100,
      search: {
        show: true,
        valueEnum: {
          true: { text: '是' },
          false: { text: '否' },
        },
      },
      valueEnum: {
        true: { text: '是' },
        false: { text: '否' },
      },
    },
    {
      title: '上架状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      valueType: 'select',
      width: 100,
      search: {
        show: true,
        valueEnum: {
          true: { text: '已上线' },
          false: { text: '未上线' },
        },
      },
      valueEnum: {
        true: { text: '已上线' },
        false: { text: '未上线' },
      },
      render: (_: any, record: CourseListItem) =>
        record.isOnline ? (
          <Tag color="green">已上线</Tag>
        ) : (
          <Tag color="red">未上线</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      width: 340,
      hideInSearch: true,
      render: (_: any, record: CourseListItem) => {
        const isOnline = !!record.isOnline;
        return (
          <div>
            <Link to={`/course/detail/${record.id}?editable=false`}>
              <Button type="link" style={{ marginRight: 8 }}>
                详情
              </Button>
            </Link>
            <Link to={`/course/detail/${record.id}?editable=true`}>
              <Button type="link" style={{ marginRight: 8 }}>
                编辑
              </Button>
            </Link>
            <Button
              type="link"
              style={{ marginRight: 8 }}
              danger={isOnline}
              onClick={() => handleConfirmOnlineStatusChange(record, !isOnline)}
            >
              {isOnline ? '下线' : '上线'}
            </Button>
            <Popconfirm
              title="确定要删除吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: '课程管理',
      }}
    >
      <Outlet />
      <ProTable<CourseListItem>
        actionRef={actionRef}
        formRef={formRef}
        headerTitle="课程列表"
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>,
        ]}
        rowSelection={{
          onChange: (_, selectedRow) => {
            setSelectedRows(selectedRow);
          },
        }}
        request={async (params) => {
          const res = await getCourseList({
            queryInfo: {
              name: params.name,
              type: params.type !== undefined ? Number(params.type) : undefined,
              primaryCategoryId:
                params.primaryCategoryId !== undefined
                  ? Number(params.primaryCategoryId)
                  : undefined,
              secondaryCategoryId:
                params.secondaryCategoryId !== undefined
                  ? Number(params.secondaryCategoryId)
                  : undefined,
              hasTest:
                params.hasTest !== undefined
                  ? params.hasTest === 'true' || params.hasTest === true
                  : undefined,
              isOnline:
                params.isOnline !== undefined
                  ? params.isOnline === 'true' || params.isOnline === true
                  : undefined,
              owner: params.owner,
            },
            pageSize: 10,
            pageNum: params.current || 1,
          });

          if (res.code !== 0) {
            message.error(res.des || '获取列表失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }

          return {
            data: res.data.list || [],
            success: true,
            total: res.data.total || 0,
          };
        }}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: true,
        }}
      />
      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> 项
            </div>
          }
        >
          <Popconfirm
            title={`确定要删除选中的 ${selectedRows.length} 条记录吗？`}
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

export default CoursePage;
