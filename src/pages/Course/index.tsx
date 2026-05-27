import { CourseListItem, deleteCourse, getCourseList } from '@/services/course';
import { handleApiResponse } from '@/utils/response';
import { PlusOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import { Link, Outlet, history } from '@umijs/max';
import { Button, Popconfirm, message } from 'antd';
import React, { useRef, useState } from 'react';

const CoursePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<CourseListItem[]>([]);

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

  const columns = [
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
      title: '课程简介',
      dataIndex: 'desc',
      key: 'desc',
      valueType: 'text',
      ellipsis: true,
      hideInSearch: true,
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
      title: '操作',
      key: 'action',
      valueType: 'option',
      width: 280,
      hideInSearch: true,
      render: (_: any, record: CourseListItem) => (
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
      ),
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
              hasTest:
                params.hasTest !== undefined
                  ? params.hasTest === 'true' || params.hasTest === true
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
