import { client, clientAuth } from '.';
import { handleApiError } from "@/lib/toast";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  inviteToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  password: string;
  id_user: string;
}

export interface UpdateProfilePayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id_user: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastPasswordUpdate: Date;
  phone: string;
}

export const authMe = async (): Promise<{user: User}> => {
  const resp = await clientAuth.auth.me.$get();
  return resp.json();
}

export const authLogin = async (data: LoginPayload): Promise<any> => {
  const resp = await client.auth.login.$post({ json: data });
  return resp.json();
}

export const authRegister = async (data: RegisterPayload): Promise<any> => {
  const resp = await client.auth.register.$post({ json: data });
  return resp.json();
}

export const authRefresh = async (refreshToken: string): Promise<any> => {
  const resp = await client.auth.refresh.$post({
    json: { refreshToken }
  });
  return resp.json();
}

export const authChangePassword = async (data: ChangePasswordPayload): Promise<any> => {
  const resp = await clientAuth.auth['change-password'].$patch({ json: data });
  return resp.json();
}

export const authUpdateProfile = async (data: UpdateProfilePayload): Promise<any> => {
  const resp = await clientAuth.user.me.$patch({ json: data });
  return resp.json();
}