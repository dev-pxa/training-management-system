/* eslint-disable */

declare namespace UserAPI {
  interface QueryInfo {
    /** 用户名 */
    uname?: string;
    /** 手机号 */
    phone?: string;
    /** 姓名 */
    name?: string;
    /** 权限 */
    permission?: string;
  }

  interface GetUserRequest {
    queryInfo?: QueryInfo;
    /** 每页的数量 */
    pageSize: number;
    /** 页数 */
    pageNum: number;
  }

  interface UserItem {
    id?: string;
    username?: string;
    phone?: string;
    name?: string;
    permission?: string;
  }

  interface GetUserResponse {
    success?: boolean;
    errorMessage?: string;
    data?: {
      list?: UserItem[];
      total?: number;
    };
  }
}
