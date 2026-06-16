declare namespace AuthAPI {
  interface UserInfo {
    id: number;
    uname: string;
    phone: string;
    name: string;
    companyName?: string;
    avatarUrl?: string;
    permission: 0 | 1;
  }

  interface Company {
    code: string;
    name: string;
  }

  interface LoginConfig {
    companies: Company[];
  }
}
