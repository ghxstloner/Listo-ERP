import { cookies } from 'next/headers';
import { AUTH_TOKEN_KEY, SELECTED_COMPANY_KEY, USER_INFO_KEY } from './constants';
import type { LoginResponse } from './types';

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_KEY)?.value;
}

export async function getSelectedCompany() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SELECTED_COMPANY_KEY)?.value;
  return value ? JSON.parse(value) : null;
}

export async function getUserInfo(): Promise<LoginResponse['user'] | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(USER_INFO_KEY)?.value;
  return value ? JSON.parse(value) : null;
}

export async function setAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function setSelectedCompany(company: {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  role: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_COMPANY_KEY, JSON.stringify(company), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function setUserInfo(user: LoginResponse['user']) {
  const cookieStore = await cookies();
  cookieStore.set(USER_INFO_KEY, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_KEY);
  cookieStore.delete(SELECTED_COMPANY_KEY);
  cookieStore.delete(USER_INFO_KEY);
}
