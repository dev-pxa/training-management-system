const users = [
  {
    id: '1',
    username: 'user1',
    phone: '13800138001',
    name: '张三',
    permission: '用户',
  },
  {
    id: '2',
    username: 'admin1',
    phone: '13800138002',
    name: '李四',
    permission: '管理员',
  },
  {
    id: '3',
    username: 'user2',
    phone: '13800138003',
    name: '王五',
    permission: '用户',
  },
  {
    id: '4',
    username: 'user3',
    phone: '13800138004',
    name: '赵六',
    permission: '用户',
  },
  {
    id: '5',
    username: 'admin2',
    phone: '13800138005',
    name: '钱七',
    permission: '管理员',
  },
  {
    id: '6',
    username: 'user4',
    phone: '13800138006',
    name: '孙八',
    permission: '用户',
  },
  {
    id: '7',
    username: 'user5',
    phone: '13800138007',
    name: '周九',
    permission: '用户',
  },
  {
    id: '8',
    username: 'admin3',
    phone: '13800138008',
    name: '吴十',
    permission: '管理员',
  },
  {
    id: '9',
    username: 'user6',
    phone: '13800138009',
    name: '郑十一',
    permission: '用户',
  },
  {
    id: '10',
    username: 'user7',
    phone: '13800138010',
    name: '王十二',
    permission: '用户',
  },
  {
    id: '11',
    username: 'admin4',
    phone: '13800138011',
    name: '李十三',
    permission: '管理员',
  },
  {
    id: '12',
    username: 'user8',
    phone: '13800138012',
    name: '张十四',
    permission: '用户',
  },
  {
    id: '13',
    username: 'user9',
    phone: '13800138013',
    name: '赵十五',
    permission: '用户',
  },
  {
    id: '14',
    username: 'admin5',
    phone: '13800138014',
    name: '钱十六',
    permission: '管理员',
  },
  {
    id: '15',
    username: 'user10',
    phone: '13800138015',
    name: '孙十七',
    permission: '用户',
  },
  {
    id: '16',
    username: 'user11',
    phone: '13800138016',
    name: '周十八',
    permission: '用户',
  },
  {
    id: '17',
    username: 'admin6',
    phone: '13800138017',
    name: '吴十九',
    permission: '管理员',
  },
  {
    id: '18',
    username: 'user12',
    phone: '13800138018',
    name: '郑二十',
    permission: '用户',
  },
  {
    id: '19',
    username: 'user13',
    phone: '13800138019',
    name: '王二十一',
    permission: '用户',
  },
  {
    id: '20',
    username: 'admin7',
    phone: '13800138020',
    name: '李二十二',
    permission: '管理员',
  },
  {
    id: '21',
    username: 'user14',
    phone: '13800138021',
    name: '张二十三',
    permission: '用户',
  },
  {
    id: '22',
    username: 'user15',
    phone: '13800138022',
    name: '赵二十四',
    permission: '用户',
  },
  {
    id: '23',
    username: 'admin8',
    phone: '13800138023',
    name: '钱二十五',
    permission: '管理员',
  },
  {
    id: '24',
    username: 'user16',
    phone: '13800138024',
    name: '孙二十六',
    permission: '用户',
  },
  {
    id: '25',
    username: 'user17',
    phone: '13800138025',
    name: '周二十七',
    permission: '用户',
  },
  {
    id: '26',
    username: 'admin9',
    phone: '13800138026',
    name: '吴二十八',
    permission: '管理员',
  },
  {
    id: '27',
    username: 'user18',
    phone: '13800138027',
    name: '郑二十九',
    permission: '用户',
  },
  {
    id: '28',
    username: 'user19',
    phone: '13800138028',
    name: '王三十',
    permission: '用户',
  },
  {
    id: '29',
    username: 'admin10',
    phone: '13800138029',
    name: '李三十一',
    permission: '管理员',
  },
  {
    id: '30',
    username: 'user20',
    phone: '13800138030',
    name: '张三十二',
    permission: '用户',
  },
  {
    id: '31',
    username: 'user21',
    phone: '13800138031',
    name: '赵三十三',
    permission: '用户',
  },
  {
    id: '32',
    username: 'admin11',
    phone: '13800138032',
    name: '钱三十四',
    permission: '管理员',
  },
  {
    id: '33',
    username: 'user22',
    phone: '13800138033',
    name: '孙三十五',
    permission: '用户',
  },
  {
    id: '34',
    username: 'user23',
    phone: '13800138034',
    name: '周三十六',
    permission: '用户',
  },
  {
    id: '35',
    username: 'admin12',
    phone: '13800138035',
    name: '吴三十七',
    permission: '管理员',
  },
];

export default {
  'GET /api/v1/queryUserList': (req: any, res: any) => {
    res.json({
      success: true,
      data: { list: users },
      errorCode: 0,
    });
  },
  'PUT /api/v1/user/': (req: any, res: any) => {
    res.json({
      success: true,
      errorCode: 0,
    });
  },
  'POST /getUser': (req: any, res: any) => {
    const { queryInfo, pageSize = 10, pageNum = 1 } = req.body || {};

    // 筛选数据
    let filteredData = [...users];

    if (queryInfo) {
      if (queryInfo.uname) {
        filteredData = filteredData.filter((item) =>
          item.username?.toLowerCase().includes(queryInfo.uname.toLowerCase()),
        );
      }
      if (queryInfo.phone) {
        filteredData = filteredData.filter((item) =>
          item.phone?.includes(queryInfo.phone),
        );
      }
      if (queryInfo.name) {
        filteredData = filteredData.filter((item) =>
          item.name?.toLowerCase().includes(queryInfo.name.toLowerCase()),
        );
      }
      if (queryInfo.permission) {
        filteredData = filteredData.filter(
          (item) => item.permission === queryInfo.permission,
        );
      }
    }

    // 分页
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filteredData.slice(start, end);

    res.json({
      success: true,
      data: {
        list: paginatedData,
        total: filteredData.length,
      },
    });
  },
};
