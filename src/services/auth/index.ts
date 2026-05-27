import { request } from '@umijs/max';

/** 密码登录 POST /api/auth/login */
export async function loginByPassword(
  body: { phone: string; password: string },
  options?: { [key: string]: any },
) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 验证码登录 POST /api/auth/loginBySms */
export async function loginBySms(
  body: { phone: string; code: string },
  options?: { [key: string]: any },
) {
  return request('/api/auth/loginBySms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 校验登录状态 GET /api/auth/checkLogin */
export async function checkLogin(options?: { [key: string]: any }) {
  return request('/api/auth/checkLogin', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 发送验证码 POST /api/auth/sendSmsCode */
export async function sendSmsCode(
  body: { phone: string },
  options?: { [key: string]: any },
) {
  return request('/api/auth/sendSmsCode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
