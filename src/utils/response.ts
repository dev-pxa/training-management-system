import { message } from 'antd';

export interface ApiResponse {
  code?: number;
  des?: string;
  desc?: string;
  success?: boolean;
  data?: any;
}

export function handleApiResponse(
  res: ApiResponse,
  successText?: string,
): boolean {
  const desc = res?.des || res?.desc || '操作失败';
  const isSuccess = res?.code === 0 || res?.success === true;

  if (isSuccess) {
    message.success(successText || desc);
    return true;
  } else {
    message.error(desc);
    return false;
  }
}

export function handleApiError(error: any): void {
  console.error('API Error:', error);
  message.error(error?.message || '网络错误，请稍后重试');
}
