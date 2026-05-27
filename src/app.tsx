import { checkLogin } from '@/services/auth';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Popconfirm } from 'antd';

let appReady = false;
let currentUserCache: AuthAPI.UserInfo | undefined;

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
  if (!appReady) return;
  if (location.pathname !== '/login' && !currentUserCache) {
    history.push('/login');
  }
}

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
