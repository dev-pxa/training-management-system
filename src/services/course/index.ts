import { request } from '@umijs/max';

export interface CourseListItem {
  id: string;
  name: string;
  desc: string;
  type: number;
  owner: string;
  hasTest: boolean;
  certificateUrl?: string;
}

export interface Chapter {
  name: string;
  desc: string;
  contentUrl: string;
}

export interface CourseDetail {
  id: string;
  name: string;
  desc: string;
  type: number;
  owner: string;
  hasTest: boolean;
  certificateUrl?: string;
  details: Chapter[];
}

export interface CourseListRequest {
  queryInfo?: {
    name?: string;
    type?: number;
    hasTest?: boolean;
    owner?: string;
  };
  pageSize: number;
  pageNum: number;
}

/** 获取课程列表 GET /api/courses */
export async function getCourseList(
  params: CourseListRequest,
  options?: { [key: string]: any },
) {
  return request('/api/courses', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 获取课程详情 GET /api/course?id={id} */
export async function getCourseDetail(
  id: string | number,
  options?: { [key: string]: any },
) {
  return request('/api/course', {
    method: 'GET',
    params: { id },
    ...(options || {}),
  });
}

/** 删除课程 DELETE /api/courses */
export async function deleteCourse(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request('/api/courses', {
    method: 'DELETE',
    data: body,
    ...(options || {}),
  });
}

/** 添加课程 POST /api/course */
export async function addCourse(
  body: Omit<CourseDetail, 'id' | 'owner'>,
  options?: { [key: string]: any },
) {
  return request('/api/course', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新课程 PUT /api/course?id={id} */
export async function updateCourse(
  id: string | number,
  body: CourseDetail,
  options?: { [key: string]: any },
) {
  return request('/api/course', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { id },
    data: body,
    ...(options || {}),
  });
}
