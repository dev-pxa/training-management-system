import ResourceFormModal from '@/components/ResourceFormModal';
import { ResourceListItem } from '@/services/resource';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import React, { useState } from 'react';

interface ResourceSelectorProps {
  value?: string;
  onChange?: (url: string) => void;
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
  const [currentResource, setCurrentResource] = useState<{
    name: string;
    type: number;
  } | null>(null);

  const filteredResourceList = allowedTypes
    ? resourceList.filter((r) => allowedTypes.includes(r.type))
    : resourceList;

  const selectedResource = filteredResourceList.find(
    (r) => r.contentUrl === value,
  );
  const displayResource = selectedResource || currentResource;

  const handleResourceModalSuccess = (resource: {
    url: string;
    name: string;
    type: number;
  }) => {
    setCurrentResource({ name: resource.name, type: resource.type });

    if (onChange) {
      onChange(resource.url);
    }
    if (onRefreshResourceList) {
      onRefreshResourceList();
    }
    setResourceModalVisible(false);
  };

  const handleSelectChange = (selectedValue: string) => {
    setCurrentResource(null);

    if (onChange && selectedValue) {
      onChange(selectedValue);
    }
  };

  React.useEffect(() => {
    if (value) {
      const found = filteredResourceList.find((r) => r.contentUrl === value);
      if (found) {
        setCurrentResource(null);
      }
    }
  }, [resourceList, value, filteredResourceList]);

  if (disabled) {
    return (
      <div>
        {displayResource
          ? `${displayResource.name}—${fileTypeLabels[displayResource.type]}`
          : value || '未设置'}
      </div>
    );
  }

  const selectValue = displayResource && value ? value : undefined;

  const options = filteredResourceList.map((resource) => ({
    value: resource.contentUrl,
    label: `${resource.name}—${fileTypeLabels[resource.type]}`,
  }));

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
