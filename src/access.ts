export default (initialState: { currentUser?: AuthAPI.UserInfo }) => {
  const isAdmin = Number(initialState?.currentUser?.permission) === 1;
  return { isAdmin };
};
