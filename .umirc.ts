import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  hash: true,
  layout: {
    title: '培训管理系统',
  },
  routes: [
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/profile',
      component: './Profile',
    },
    {
      path: '/',
      redirect: '/course',
    },
    {
      name: '人员管理',
      icon: 'UserOutlined',
      path: '/user',
      component: './User',
      access: 'isAdmin',
    },
    {
      path: '/user/add',
      component: './User/detail',
      access: 'isAdmin',
    },
    {
      path: '/user/detail/:id',
      component: './User/detail',
      access: 'isAdmin',
    },
    {
      name: '课程管理',
      icon: 'BookOutlined',
      path: '/course',
      component: './Course',
    },
    {
      path: '/course/add',
      component: './Course/detail',
    },
    {
      path: '/course/detail/:id',
      component: './Course/detail',
    },
    {
      name: '产品管理',
      icon: 'ShoppingOutlined',
      path: '/product',
      component: './Product',
      access: 'isAdmin',
    },
    {
      path: '/product/add',
      component: './Product/detail',
      access: 'isAdmin',
    },
    {
      path: '/product/detail/:id',
      component: './Product/detail',
      access: 'isAdmin',
    },
    {
      name: '资源管理',
      icon: 'FolderOutlined',
      path: '/resource',
      component: './Resource',
    },
    {
      path: '/resource/add',
      component: './Resource/detail',
    },
    {
      path: '/resource/detail/:id',
      component: './Resource/detail',
    },
    {
      name: '测试管理',
      icon: 'FileTextOutlined',
      path: '/test',
      component: './Test',
    },
    {
      path: '/test/add',
      component: './Test/detail',
    },
    {
      path: '/test/detail/:id',
      component: './Test/detail',
    },
    {
      name: '证书验伪',
      icon: 'SafetyCertificateOutlined',
      path: '/certificate-verify',
      component: './CertificateVerify',
      access: 'isAdmin',
    },
    {
      name: '知识问答',
      icon: 'BulbOutlined',
      path: '/knowledge',
      routes: [
        { path: '/knowledge', redirect: '/knowledge/bases' },
        {
          name: '知识库管理',
          path: '/knowledge/bases',
          component: './KnowledgeBase',
        },
        {
          name: '知识管理',
          path: '/knowledge/manage',
          component: './Knowledge',
        },
        {
          name: '召回测试',
          path: '/knowledge/recall',
          component: './Knowledge/recall',
        },
      ],
    },
    { path: '/knowledge/add', component: './Knowledge/detail' },
    { path: '/knowledge/detail/:id', component: './Knowledge/detail' },
  ],

  /* ==================== 以下代理配置，仅用于开发环境，上线前请删除 ==================== */
  // #region 代理配置
  proxy: {
    // '/api': {
    //   target: 'http://127.0.0.1:4523/m1/8000488-7754565-default',
    //   changeOrigin: true,
    // },
    // '/api': {
    //   target: 'http://127.0.0.1:8080',
    //   changeOrigin: true,
    // },
    '/api': {
      target: 'http://49.232.34.105:8080',
      changeOrigin: true,
    },
  },
  // #endregion 代理配置
  /* ==================== 以上代理配置，仅用于开发环境，上线前请删除 ==================== */

  npmClient: 'pnpm',
});
