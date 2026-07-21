import {
  addResource,
  ResourceListItem,
  updateResource,
  uploadResourceFile,
} from '@/services/resource';
import { handleApiResponse } from '@/utils/response';
import {
  FileImageOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Form, Input, message, Modal, Select, Upload, UploadFile } from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;
const { Dragger } = Upload;

interface ResourceFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (resource: ResourceListItem) => void;
  initialResource?: ResourceListItem;
  allowedTypes?: number[]; // 允许的资源类型：0-图片，1-视频，2-PDF
}

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

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  open,
  onCancel,
  onSuccess,
  initialResource,
  allowedTypes,
}) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [resourceType, setResourceType] = useState<number>(0);
  const isEditMode = !!initialResource;

  // 获取默认类型：如果有允许的类型，使用第一个允许的类型，否则默认为0
  const getDefaultType = () => {
    if (allowedTypes && allowedTypes.length > 0) {
      return allowedTypes[0];
    }
    return 0;
  };

  // 检查类型是否允许
  const isTypeAllowed = (type: number) => {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    return allowedTypes.includes(type);
  };

  useEffect(() => {
    if (open) {
      if (initialResource) {
        setResourceType(initialResource.type || getDefaultType());
        form.setFieldsValue({
          resourceId: initialResource.id,
          name: initialResource.name,
          contentUrl: initialResource.contentUrl,
          type: initialResource.type,
          duration: initialResource.duration,
        });
      } else {
        const defaultType = getDefaultType();
        setResourceType(defaultType);
        form.resetFields();
        form.setFieldsValue({
          type: defaultType,
        });
      }
    }
  }, [open, initialResource, form, allowedTypes]);

  const handleTypeChange = (value: number) => {
    setResourceType(value);
    form.setFieldsValue({
      resourceId: undefined,
      contentUrl: undefined,
      duration: undefined,
    });
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
          resourceId: res.data.id,
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

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const resourceId = values.resourceId || initialResource?.id;
      const resourceData = {
        name: values.name,
        contentUrl: values.contentUrl,
        type: values.type,
        duration: values.duration,
      };

      const res = resourceId
        ? await updateResource(resourceId, resourceData)
        : await addResource(resourceData);
      if (!handleApiResponse(res)) {
        return;
      }

      onSuccess({
        id: resourceId || res.data?.id,
        ...resourceData,
      });
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEditMode ? '编辑资源' : '添加资源'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={uploading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="name"
          label="资源名称"
          rules={[{ required: true, message: '请输入资源名称' }]}
        >
          <Input placeholder="请输入资源名称" />
        </Form.Item>

        <Form.Item
          name="type"
          label="资源类型"
          rules={[{ required: true, message: '请选择资源类型' }]}
        >
          <Select
            placeholder="请选择资源类型"
            onChange={handleTypeChange}
            disabled={allowedTypes && allowedTypes.length === 1}
          >
            {isTypeAllowed(0) && <Option value={0}>图片资源</Option>}
            {isTypeAllowed(1) && <Option value={1}>视频资源</Option>}
            {isTypeAllowed(2) && <Option value={2}>PDF资源</Option>}
          </Select>
        </Form.Item>

        <Form.Item name="resourceId" hidden>
          <Input />
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
          <Dragger
            accept={allowedFileTypes[resourceType].join(',')}
            beforeUpload={beforeUpload}
            customRequest={handleFileUpload}
            fileList={
              form.getFieldValue('contentUrl')
                ? [
                    {
                      uid: '1',
                      name: form.getFieldValue('contentUrl')?.split('/').pop(),
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
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResourceFormModal;
