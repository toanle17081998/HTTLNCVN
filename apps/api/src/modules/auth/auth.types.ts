export type LoginDto = {
  email: string;
  password: string;
};

export type RefreshDto = {
  refreshToken: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthPermission = {
  action: string;
  resource: string;
};

export type AuthUser = {
  email: string;
  id: string;
  permissions: AuthPermission[];
  role: string;
  username: string;
};
