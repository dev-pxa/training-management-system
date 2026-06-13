declare namespace AuthAPI {
  interface UserInfo {
    id: number;
    uname: string;
    phone: string;
    name: string;
    permission: 1 | 2;
  }

  interface Company {
    code: string;
    name: string;
  }

  interface LoginConfig {
    companies: Company[];
  }
}
