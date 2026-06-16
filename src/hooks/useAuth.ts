import { history, useModel } from '@umijs/max';

export default function useAuth() {
  const { initialState, loading, refresh } = useModel('@@initialState');

  const currentUser = initialState?.currentUser;
  const isLoggedIn = !!currentUser;
  const isAdmin = Number(currentUser?.permission) === 1;

  const logout = () => {
    refresh();
    history.push('/login');
  };

  return { isLoggedIn, isAdmin, currentUser, loading, refresh, logout };
}
