import { request } from '@umijs/max';

export interface CourseCategoryRef {
  id: number;
  parentId: number;
  name: string;
}

/** 查询当前公司的课程分类。 */
export async function getCourseCategories(
  parentId: number,
  options?: { [key: string]: any },
) {
  return request('/api/course-categories', {
    method: 'GET',
    params: { parentId },
    ...(options || {}),
  });
}

/** 新增课程分类。 */
export async function addCourseCategory(
  body: { parentId: number; name: string },
  options?: { [key: string]: any },
) {
  return request('/api/course-category', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
