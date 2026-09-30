export type RegisterPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthTokenPayload = {
  id: string;
  email: string;
  username: string;
};


