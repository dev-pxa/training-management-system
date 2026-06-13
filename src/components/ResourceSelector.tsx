import ResourceFormModal from '@/components/ResourceFormModal';
import { CourseResourceRef } from '@/services/course';
import { ResourceListItem } from '@/services/resource';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Image, Select } from 'antd';
import React, { useState } from 'react';

interface ResourceSelectorProps {
  value?: CourseResourceRef | ResourceListItem;
  onChange?: (resource?: CourseResourceRef | ResourceListItem) => void;
  resourceList: ResourceListItem[];
  onRefreshResourceList?: () => void;
  placeholder?: string;
  disabled?: boolean;
  allowedTypes?: number[];
}

const fileTypeLabels: Record<number, string> = {
  0: '图片资源',
  1: '视频资源',
  2: 'PDF资源',
};

const getResourceLabel = (resource: CourseResourceRef | ResourceListItem) =>
  resource.name
    ? `${resource.name}—${fileTypeLabels[resource.type ?? -1] || '资源'}`
    : resource.contentUrl;

const getResourceType = (
  resource?: CourseResourceRef | ResourceListItem,
  allowedTypes?: number[],
) => {
  if (typeof resource?.type === 'number') {
    return resource.type;
  }
  if (allowedTypes?.length === 1) {
    return allowedTypes[0];
  }

  const url = resource?.contentUrl?.toLowerCase() || '';
  if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|#|$)/.test(url)) {
    return 0;
  }
  if (/\.(mp4|mov|webm|ogg)(\?|#|$)/.test(url)) {
    return 1;
  }
  if (/\.pdf(\?|#|$)/.test(url)) {
    return 2;
  }

  return undefined;
};

const renderResourcePreview = (
  resource?: CourseResourceRef | ResourceListItem,
  allowedTypes?: number[],
) => {
  const contentUrl = resource?.contentUrl;
  if (!contentUrl) {
    return null;
  }

  const resourceType = getResourceType(resource, allowedTypes);

  if (resourceType === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <Image
          src={contentUrl}
          alt={resource?.name || '资源预览'}
          style={{ maxWidth: 160, maxHeight: 120, objectFit: 'cover' }}
          preview={{ src: contentUrl }}
        />
      </div>
    );
  }

  if (resourceType === 1) {
    return (
      <video
        src={contentUrl}
        controls
        style={{ marginTop: 8, maxWidth: '100%', maxHeight: 240 }}
      />
    );
  }

  if (resourceType === 2) {
    return (
      <div style={{ marginTop: 8 }}>
        <a href={contentUrl} target="_blank" rel="noopener noreferrer">
          预览 PDF
        </a>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <a href={contentUrl} target="_blank" rel="noopener noreferrer">
        打开资源
      </a>
    </div>
  );
};

const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  value,
  onChange,
  resourceList,
  onRefreshResourceList,
  placeholder = '请选择资源',
  disabled = false,
  allowedTypes,
}) => {
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [currentResource, setCurrentResource] = useState<
    CourseResourceRef | ResourceListItem | null
  >(null);

  const filteredResourceList = allowedTypes
    ? resourceList.filter((r) => allowedTypes.includes(r.type))
    : resourceList;

  const selectedResource = filteredResourceList.find((r) => r.id === value?.id);
  const displayResource = selectedResource || currentResource || value;

  const handleResourceModalSuccess = (resource: ResourceListItem) => {
    setCurrentResource(resource);

    if (onChange) {
      onChange(resource);
    }
    if (onRefreshResourceList) {
      onRefreshResourceList();
    }
    setResourceModalVisible(false);
  };

  const handleSelectChange = (selectedId: number) => {
    const selected = filteredResourceList.find((r) => r.id === selectedId);
    setCurrentResource(null);

    if (onChange) {
      onChange(selected);
    }
  };

  React.useEffect(() => {
    if (value?.id) {
      const found = filteredResourceList.find((r) => r.id === value.id);
      if (found) {
        setCurrentResource(null);
      }
    }
  }, [resourceList, value, filteredResourceList]);

  if (disabled) {
    return (
      <div>
        <div>
          {displayResource ? getResourceLabel(displayResource) : '未设置'}
        </div>
        {renderResourcePreview(displayResource, allowedTypes)}
      </div>
    );
  }

  const selectValue = displayResource?.id;

  const options = filteredResourceList.map((resource) => ({
    value: resource.id,
    label: getResourceLabel(resource),
  }));

  if (
    displayResource?.id &&
    displayResource.name &&
    !options.some((option) => option.value === displayResource.id)
  ) {
    options.unshift({
      value: displayResource.id,
      label: getResourceLabel(displayResource),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <Select
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0 }}
          value={selectValue}
          onChange={handleSelectChange}
          options={options}
        />
        <Button
          icon={<UploadOutlined />}
          onClick={() => setResourceModalVisible(true)}
        >
          上传
        </Button>
      </div>
      {renderResourcePreview(displayResource, allowedTypes)}

      <ResourceFormModal
        open={resourceModalVisible}
        onCancel={() => setResourceModalVisible(false)}
        onSuccess={handleResourceModalSuccess}
        allowedTypes={allowedTypes}
      />
    </>
  );
};

export default ResourceSelector;
