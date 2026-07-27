import { request } from '@umijs/max';

export interface CourseCategoryRef {
  id: number;
  name: string;
}

/** 查询当前公司的课程分类。 */
export async function getCourseCategories(
  params?: { keyword?: string },
  options?: { [key: string]: any },
) {
  return request('/api/course-categories', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 新增课程分类。 */
export async function addCourseCategory(
  body: { name: string },
  options?: { [key: string]: any },
) {
  return request('/api/course-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
