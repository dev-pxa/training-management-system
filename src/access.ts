export default (initialState: { currentUser?: AuthAPI.UserInfo }) => {
  const isAdmin = initialState?.currentUser?.permission === 2;
  return { isAdmin };
};
