import type { CourseCategoryRef } from '@/services/courseCategory';
import { request } from '@umijs/max';

export interface CourseResourceRef {
  id?: number;
  name?: string;
  contentUrl: string;
  type?: number;
  duration?: number;
  downloadable?: boolean;
}

export interface CourseTestInfo {
  id?: number;
  name?: string;
}

export interface CourseListItem {
  id: string;
  name: string;
  desc: string;
  type: number;
  primaryCategory?: CourseCategoryRef;
  secondaryCategory?: CourseCategoryRef;
  owner: string;
  hasTest: boolean;
  isOnline?: boolean;
  coverResource?: CourseResourceRef;
  certificateResource?: CourseResourceRef;
  testInfo?: CourseTestInfo;
}

export interface Chapter {
  name: string;
  desc: string;
  contentResource?: CourseResourceRef;
}

export interface CourseDetail {
  id: string;
  name: string;
  desc: string;
  type: number;
  primaryCategory?: CourseCategoryRef;
  secondaryCategory?: CourseCategoryRef;
  primaryCategoryId: number;
  secondaryCategoryId?: number;
  owner: string;
  hasTest: boolean;
  coverResource?: CourseResourceRef;
  certificateResource?: CourseResourceRef;
  testInfo?: CourseTestInfo;
  details: Chapter[];
}

export interface CourseListRequest {
  queryInfo?: {
    name?: string;
    type?: number;
    primaryCategoryId?: number;
    secondaryCategoryId?: number;
    hasTest?: boolean;
    isOnline?: boolean;
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

/** 修改课程上下线状态 PUT /api/course/online */
export async function updateCourseOnlineStatus(
  body: { id: string | number; isOnline: boolean },
  options?: { [key: string]: any },
) {
  return request('/api/course/online', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
