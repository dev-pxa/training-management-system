import { checkLogin } from '@/services/auth';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, RequestConfig } from '@umijs/max';
import { message, Popconfirm } from 'antd';

let appReady = false;
let currentUserCache: AuthAPI.UserInfo | undefined;
// 多个请求可能同时返回 401，用这个标记避免重复弹提示、重复跳登录页。
let redirectingToLogin = false;

const goLoginWhenUnauthorized = () => {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  // 本地登录态立即清空，避免菜单和路由继续按已登录状态展示。
  currentUserCache = undefined;

  if (history.location.pathname !== '/login') {
    message.warning('未登录或登录已过期，请重新登录');
    history.replace('/login');
  }

  // 给页面跳转留一点时间，防止同一批请求继续触发重复提示。
  setTimeout(() => {
    redirectingToLogin = false;
  }, 1000);
};

export async function getInitialState(): Promise<{
  currentUser?: AuthAPI.UserInfo;
}> {
  try {
    const res = await checkLogin();
    if (res?.code === 0 && res?.data) {
      currentUserCache = res.data;
      appReady = true;
      return { currentUser: res.data };
    }
  } catch {
    // not logged in or network error
  }
  currentUserCache = undefined;
  appReady = true;
  return {};
}

export function onRouteChange({
  location,
}: {
  location: { pathname: string };
}) {
  if (location.pathname === '/login') {
    // 已经到登录页后，允许后续新的 401 再次触发提示和跳转逻辑。
    redirectingToLogin = false;
  }
  if (!appReady) return;
  if (location.pathname !== '/login' && !currentUserCache) {
    history.push('/login');
  }
}

export const request: RequestConfig = {
  responseInterceptors: [
    (response) => {
      const data = response?.data as { code?: number } | undefined;
      // 后端业务返回 code=401 时，也按未登录处理。
      if (data?.code === 401) {
        goLoginWhenUnauthorized();
      }
      return response;
    },
  ],
  errorConfig: {
    errorHandler: (error: any) => {
      // 如果服务直接返回 HTTP 401，同样提示用户重新登录。
      if (error?.response?.status === 401) {
        goLoginWhenUnauthorized();
        return;
      }
      throw error;
    },
  },
};

export const layout = () => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
    menuFooterRender: (props: { collapsed?: boolean }) => {
      if (!currentUserCache) return null;
      const collapsed = props?.collapsed;

      const handleGoProfile = () => history.push('/profile');
      const handleLogout = () => {
        currentUserCache = undefined;
        history.push('/login');
      };

      if (collapsed) {
        return (
          <div
            style={{
              padding: '12px 0',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: 18,
            }}
            onClick={handleGoProfile}
          >
            <UserOutlined />
          </div>
        );
      }

      return (
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: 18,
          }}
        >
          <div
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
            }}
            onClick={handleGoProfile}
          >
            <UserOutlined />
            <span>{currentUserCache.name}</span>
          </div>
          <Popconfirm
            title="确定退出登录？"
            onConfirm={handleLogout}
            okText="确定"
            cancelText="取消"
            placement="topRight"
          >
            <LogoutOutlined style={{ cursor: 'pointer' }} />
          </Popconfirm>
        </div>
      );
    },
  };
};
