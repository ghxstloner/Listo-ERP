import { HttpClient } from './http';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const api = new HttpClient({
  baseUrl: API_BASE_URL,
});

export const getApiBaseUrl = () => API_BASE_URL;

export const setApiToken = (token: string | null) => {
  api.setToken(token);
};

export const getApiToken = () => {
  return api.getToken();
};

export const setApiCompanyId = (companyId: string | null) => {
  api.setCompanyId(companyId);
};

export const getApiCompanyId = () => {
  return api.getCompanyId();
};

export const setApiUserInfo = (userInfo: { id: number; email: string; name: string } | null) => {
  api.setUserInfo(userInfo);
};

export const getApiUserInfo = () => {
  return api.getUserInfo();
};

export const logout = () => {
  api.setToken(null);
  api.setCompanyId(null);
  api.setUserInfo(null);
};
