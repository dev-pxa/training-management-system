import { request } from '@umijs/max';

/** 获取人员列表 GET /api/users */
export async function getUserList(
  params?: {
    queryInfo?: {
      name?: string;
      phone?: string;
      uname?: string;
      permission?: number;
    };
    pageNum?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request('/api/users', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 获取人员详情 GET /api/user?id={id} */
export async function getUserDetail(
  id: string,
  options?: { [key: string]: any },
) {
  return request('/api/user', {
    method: 'GET',
    params: { id },
    ...(options || {}),
  });
}

/** 添加人员 POST /api/user */
export async function addUser(
  body: {
    uname?: string;
    phone: string;
    name: string;
    permission: string;
    avatarUrl?: string;
  },
  options?: { [key: string]: any },
) {
  return request('/api/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量导入人员 POST /api/users/import */
export async function importUsers(
  file: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();
  formData.append('file', file);

  return request('/api/users/import', {
    method: 'POST',
    data: formData,
    ...(options || {}),
  });
}

/** 更新人员 PUT /api/user?id={id} */
export async function updateUser(
  id: string,
  body: {
    uname: string;
    phone: string;
    name: string;
    permission: string;
    avatarUrl?: string;
  },
  options?: { [key: string]: any },
) {
  return request('/api/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { id },
    data: body,
    ...(options || {}),
  });
}

/** 修改当前登录用户密码 PUT /api/user/password */
export async function updateUserPassword(
  body: {
    oldPassword: string;
    newPassword: string;
  },
  options?: { [key: string]: any },
) {
  return request('/api/user/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除人员 DELETE /api/users */
export async function deleteUser(
  body: {
    ids: string[];
  },
  options?: { [key: string]: any },
) {
  return request('/api/users', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
