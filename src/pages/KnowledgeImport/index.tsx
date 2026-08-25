import {
  deleteKnowledgeImports,
  getKnowledgeImports,
  KnowledgeImportBatch,
} from '@/services/knowledge';
import { handleApiResponse } from '@/utils/response';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, message, Modal, Progress, Space, Tag } from 'antd';
import { useRef } from 'react';

const statusText: Record<string, string> = {
  PARSING: '解析中',
  REVIEWING: '待审核',
  COMPLETED: '已完成',
  FAILED: '解析失败',
};
const statusColor: Record<string, string> = {
  PARSING: 'processing',
  REVIEWING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
};
export default () => {
  const actionRef = useRef<ActionType>();
  const confirmDelete = (rows: KnowledgeImportBatch[]) =>
    Modal.confirm({
      title: `确认删除${
        rows.length > 1 ? `选中的 ${rows.length} 条` : ''
      }批量生成记录？`,
      content:
        '删除后，批次记录及其尚未审核的候选知识将一并删除且无法恢复；解析中的记录不能删除。已通过生成的正式知识不受影响。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await deleteKnowledgeImports(rows.map((v) => v.id));
        if (handleApiResponse(res, '删除成功')) actionRef.current?.reload();
      },
    });
  const columns: ProColumns<KnowledgeImportBatch>[] = [
    { title: '文件名称', dataIndex: 'fileName', ellipsis: true, width: 300 },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 95,
      valueEnum: {
        PARSING: '解析中',
        REVIEWING: '待审核',
        COMPLETED: '已完成',
        FAILED: '解析失败',
      },
      render: (_, r) => (
        <Tag color={statusColor[r.status]}>{statusText[r.status]}</Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      search: false,
      width: 135,
      render: (_, r) => <Progress percent={r.progress || 0} size="small" />,
    },
    { title: '识别数量', dataIndex: 'totalCount', search: false, width: 76 },
    { title: '待审核', dataIndex: 'pendingCount', search: false, width: 58 },
    { title: '已通过', dataIndex: 'approvedCount', search: false, width: 58 },
    { title: '已删除', dataIndex: 'deletedCount', search: false, width: 58 },
    {
      title: '操作',
      valueType: 'option',
      width: 170,
      render: (_, r) => (
        <Space size={0}>
          {r.status === 'REVIEWING' && (
            <Button
              type="link"
              onClick={() => history.push(`/knowledge/imports/${r.id}/review`)}
            >
              继续审核
            </Button>
          )}
          {r.status === 'COMPLETED' && (
            <Button
              type="link"
              onClick={() => history.push(`/knowledge/imports/${r.id}/review`)}
            >
              查看结果
            </Button>
          )}
          {r.status === 'FAILED' && (
            <Button
              type="link"
              danger
              onClick={() =>
                Modal.error({
                  title: '解析失败原因',
                  width: 600,
                  content: (
                    <div>
                      <div style={{ marginBottom: 12, color: '#666' }}>
                        文件：{r.fileName}
                      </div>
                      <div
                        style={{
                          padding: 12,
                          background: '#fafafa',
                          border: '1px solid #f0f0f0',
                          borderRadius: 6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          userSelect: 'text',
                        }}
                      >
                        {r.errorMessage || '未记录具体失败原因，请查看后端日志'}
                      </div>
                    </div>
                  ),
                  okText: '知道了',
                })
              }
            >
              查看原因
            </Button>
          )}
          {r.status === 'PARSING' ? (
            <span style={{ color: '#999' }}>处理中</span>
          ) : (
            <Button type="link" danger onClick={() => confirmDelete([r])}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];
  return (
    <PageContainer title="批量生成记录">
      <ProTable
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        headerTitle="生成批次"
        request={async (p) => {
          const res = await getKnowledgeImports({
            pageNum: p.current || 1,
            pageSize: p.pageSize || 10,
            fileName: p.fileName,
            status: p.status,
          });
          if (res.code !== 0) {
            message.error(res.des || '获取批次失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data.list || [],
            success: true,
            total: res.data.total || 0,
          };
        }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        search={{ labelWidth: 80 }}
      />
    </PageContainer>
  );
};
