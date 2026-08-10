import {
  addResource,
  getResourceDetail,
  updateResource,
  uploadResourceFile,
} from '@/services/resource';
import { handleApiResponse } from '@/utils/response';
import {
  FileImageOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useParams } from '@umijs/max';
import {
  Button,
  Form,
  Image,
  Input,
  message,
  Select,
  Switch,
  Typography,
  Upload,
  UploadFile,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;
const { Dragger } = Upload;
const { Text } = Typography;

const allowedFileTypes: Record<number, string[]> = {
  0: ['.png', '.jpg', '.jpeg'],
  1: ['.mp4', '.mov'],
  2: ['.pdf'],
};

const fileTypeLabels: Record<number, string> = {
  0: '图片资源',
  1: '视频资源',
  2: 'PDF资源',
};

const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAddMode = location.pathname === '/resource/add';
  const editable = isAddMode || location.search.includes('editable=true');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isAddMode);
  const [uploading, setUploading] = useState(false);
  const [resourceType, setResourceType] = useState<number>(0);
  const watchedContentUrl = Form.useWatch('contentUrl', form);

  useEffect(() => {
    if (!isAddMode) {
      const fetchData = async () => {
        try {
          const res = await getResourceDetail(id as unknown as number);
          if (res?.code === 0 && res?.data) {
            const data = res.data;
            setResourceType(data.type || 0);
            form.setFieldsValue({
              name: data.name,
              contentUrl: data.contentUrl,
              type: data.type,
              duration: data.duration,
              downloadable: data.downloadable ?? true,
            });
          } else if (res?.code !== 0) {
            message.error(res?.des || res?.desc || '获取资源信息失败');
          }
        } catch (error: any) {
          message.error(error?.message || '获取资源信息失败');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, form, isAddMode]);

  const handleTypeChange = (value: number) => {
    setResourceType(value);
    form.setFieldsValue({ contentUrl: undefined, duration: undefined });
  };

  const handleFileUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    if (!file) {
      onError?.('文件不存在');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadResourceFile(file as File);
      if (res.code === 0 && res.data?.url) {
        message.success('上传成功');
        form.setFieldsValue({
          contentUrl: res.data.url,
          duration: res.data.duration,
        });
        onSuccess?.();
      } else {
        const errorMsg = res?.des || '上传失败';
        message.error(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error: any) {
      message.error(error?.message || '上传失败');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: UploadFile) => {
    const fileName = file.name.toLowerCase();
    const allowedTypes = allowedFileTypes[resourceType];

    const isAllowed = allowedTypes.some((type) => fileName.endsWith(type));
    if (!isAllowed) {
      message.error(
        `仅支持上传${fileTypeLabels[resourceType]}格式：${allowedTypes.join(
          '、',
        )}`,
      );
      return false;
    }

    const fileSize = (file.size ?? 0) / 1024 / 1024;
    const maxSize = resourceType === 1 ? 100 : 20;
    if (fileSize > maxSize) {
      message.error(`文件大小不能超过${maxSize}MB`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (values: any) => {
    try {
      let res;
      if (isAddMode) {
        res = await addResource({
          name: values.name,
          contentUrl: values.contentUrl,
          type: values.type,
          duration: values.duration,
          downloadable: values.downloadable ?? true,
        });
      } else {
        res = await updateResource(id as unknown as number, {
          name: values.name,
          contentUrl: values.contentUrl,
          type: values.type,
          duration: values.duration,
          downloadable: values.downloadable ?? true,
        });
      }

      if (handleApiResponse(res)) {
        history.push('/resource');
      }
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  const contentUrl = watchedContentUrl;
  const isImage = resourceType === 0 && contentUrl;
  const isVideo = resourceType === 1 && contentUrl;
  const isPdf = resourceType === 2 && contentUrl;

  return (
    <PageContainer
      header={{
        title: isAddMode ? '添加资源' : editable ? '编辑资源' : '资源详情',
      }}
    >
      <div style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ downloadable: true }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="资源名称"
            rules={[{ required: true, message: '请输入资源名称' }]}
          >
            <Input disabled={!editable} placeholder="请输入资源名称" />
          </Form.Item>

          <Form.Item
            name="downloadable"
            label="是否可下载"
            valuePropName="checked"
            tooltip="关闭后，App 课程章节中的图片和 PDF 仅支持预览"
          >
            <Switch
              checkedChildren="允许"
              unCheckedChildren="禁止"
              disabled={!editable}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="资源类型"
            rules={[{ required: true, message: '请选择资源类型' }]}
          >
            <Select
              disabled={!editable}
              placeholder="请选择资源类型"
              onChange={handleTypeChange}
            >
              <Option value={0}>图片资源</Option>
              <Option value={1}>视频资源</Option>
              <Option value={2}>PDF资源</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="contentUrl"
            label="资源内容"
            rules={[{ required: true, message: '请上传资源文件' }]}
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="duration" hidden>
            <Input />
          </Form.Item>
          <Form.Item label=" ">
            {editable && (
              <Dragger
                accept={allowedFileTypes[resourceType].join(',')}
                beforeUpload={beforeUpload}
                customRequest={handleFileUpload}
                fileList={
                  contentUrl
                    ? [
                        {
                          uid: '1',
                          name: contentUrl.split('/').pop(),
                          status: 'done',
                        },
                      ]
                    : []
                }
                onChange={() => {}}
              >
                <p className="ant-upload-drag-icon">
                  {resourceType === 0 ? (
                    <FileImageOutlined />
                  ) : resourceType === 1 ? (
                    <PlayCircleOutlined />
                  ) : (
                    <FileTextOutlined />
                  )}
                </p>
                <p className="ant-upload-text">点击或拖拽文件到该区域上传</p>
                <p className="ant-upload-hint">
                  仅支持 {fileTypeLabels[resourceType]} 格式：
                  {allowedFileTypes[resourceType].join('、')}
                  {resourceType === 1 ? '（最大100MB）' : '（最大20MB）'}
                </p>
              </Dragger>
            )}

            {contentUrl && (
              <div style={{ marginTop: editable ? 16 : 0 }}>
                {isImage && (
                  <div>
                    <Image
                      src={contentUrl}
                      style={{ maxWidth: '100%', maxHeight: 300 }}
                      preview={{ src: contentUrl }}
                    />
                    <Text
                      type="secondary"
                      style={{ display: 'block', marginTop: 8 }}
                    >
                      {contentUrl}
                    </Text>
                  </div>
                )}
                {isVideo && (
                  <div>
                    <video
                      src={contentUrl}
                      controls
                      style={{ maxWidth: '100%', maxHeight: 300 }}
                    />
                    <Text
                      type="secondary"
                      style={{ display: 'block', marginTop: 8 }}
                    >
                      {contentUrl}
                    </Text>
                  </div>
                )}
                {isPdf && (
                  <div>
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <FileTextOutlined
                        style={{ fontSize: 24, color: '#1890ff' }}
                      />
                      <span>{contentUrl}</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </Form.Item>

          {editable && (
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={uploading}>
                确定
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </PageContainer>
  );
};

export default ResourceDetailPage;
