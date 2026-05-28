import { request } from '@umijs/max';

// 题目类型枚举
export const QUESTION_TYPE_CHOICE = 0;
export const QUESTION_TYPE_FILL = 1;

// 选择题
export interface ChoiceQuestion {
  type: typeof QUESTION_TYPE_CHOICE;
  title: string;
  options: string[];
  answer: number;
}

// 填空题
export interface FillQuestion {
  type: typeof QUESTION_TYPE_FILL;
  title: string;
  blankCount: number;
  answers: string[];
}

export type Question = ChoiceQuestion | FillQuestion;

export interface TestListItem {
  id: number;
  name: string;
  desc: string;
  owner?: string;
}

export interface TestDetail extends TestListItem {
  questions: Question[];
}

export interface TestListRequest {
  queryInfo?: {
    name?: string;
    owner?: string;
  };
  pageSize: number;
  pageNum: number;
}

/** 获取测试列表 GET /api/tests */
export async function getTestList(
  params: TestListRequest,
  options?: { [key: string]: any },
) {
  return request('/api/tests', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 获取测试详情 GET /api/test?id={id} */
export async function getTestDetail(
  id: number,
  options?: { [key: string]: any },
) {
  return request('/api/test', {
    method: 'GET',
    params: { id },
    ...(options || {}),
  });
}

/** 删除测试 DELETE /api/tests */
export async function deleteTest(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request('/api/tests', {
    method: 'DELETE',
    data: body,
    ...(options || {}),
  });
}

/** 添加测试 POST /api/test */
export async function addTest(
  body: {
    name: string;
    desc: string;
    questions: Question[];
  },
  options?: { [key: string]: any },
) {
  return request('/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新测试 PUT /api/test?id={id} */
export async function updateTest(
  id: number,
  body: {
    name: string;
    desc: string;
    questions: Question[];
  },
  options?: { [key: string]: any },
) {
  return request('/api/test', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { id },
    data: body,
    ...(options || {}),
  });
}
