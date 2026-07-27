import { request } from '@umijs/max';

export interface ResourceListItem {
  id: number;
  name: string;
  contentUrl: string;
  type: number;
  duration?: number;
  owner?: string;
}

export interface ResourceDetail {
  id: number;
  name: string;
  contentUrl: string;
  type: number;
  duration?: number;
  owner?: string;
}

export interface ResourceListRequest {
  queryInfo?: {
    name?: string;
    type?: string;
    owner?: string;
  };
  pageSize: number;
  pageNum: number;
}

export interface UploadResponse {
  code: number;
  des: string;
  data: {
    url: string;
    type: number;
    duration?: number;
  };
}

export interface ResourceMutationResponse {
  code: number;
  des: string;
  data?: ResourceListItem;
}

export interface ResourcePayload {
  name: string;
  contentUrl: string;
  type: number;
  duration?: number;
}

/** 获取资源列表 GET /api/resources */
export async function getResourceList(
  params: ResourceListRequest,
  options?: { [key: string]: any },
) {
  return request('/api/resources', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 获取资源详情 GET /api/resource?id={id} */
export async function getResourceDetail(
  id: number,
  options?: { [key: string]: any },
) {
  return request('/api/resource', {
    method: 'GET',
    params: { id },
    ...(options || {}),
  });
}

/** 删除资源 DELETE /api/resources */
export async function deleteResource(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request('/api/resources', {
    method: 'DELETE',
    data: body,
    ...(options || {}),
  });
}

/** 上传文件 POST /api/resource/upload */
export async function uploadResourceFile(
  file: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();
  formData.append('file', file);

  return request<UploadResponse>('/api/resource/upload', {
    method: 'POST',
    data: formData,
    ...(options || {}),
  });
}

/** 添加资源 POST /api/resource */
export async function addResource(
  body: ResourcePayload,
  options?: { [key: string]: any },
) {
  return request<ResourceMutationResponse>('/api/resource', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新资源 PUT /api/resource?id={id} */
export async function updateResource(
  id: number,
  body: ResourcePayload,
  options?: { [key: string]: any },
) {
  return request('/api/resource', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { id },
    data: body,
    ...(options || {}),
  });
}
