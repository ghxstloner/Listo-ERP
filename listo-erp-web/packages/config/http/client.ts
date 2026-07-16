import type { HttpClientConfig, HttpError, RequestConfig } from './types';

const AUTH_TOKEN_KEY = 'auth-token';
const SELECTED_COMPANY_KEY = 'selected-company';
const USER_INFO_KEY = 'user-info';
const PERMISSIONS_KEY = 'company-permissions';

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()!.split(';').shift()!);
  }
  return null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  setToken(token: string | null): void {
    if (token) {
      setCookie(AUTH_TOKEN_KEY, token);
    } else {
      deleteCookie(AUTH_TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return getCookie(AUTH_TOKEN_KEY);
  }

  setCompanyId(companyId: string | null): void {
    if (companyId) {
      setCookie(SELECTED_COMPANY_KEY, companyId);
    } else {
      deleteCookie(SELECTED_COMPANY_KEY);
    }
  }

  getCompanyId(): string | null {
    return getCookie(SELECTED_COMPANY_KEY);
  }

  setUserInfo(userInfo: { id: number; email: string; name: string } | null): void {
    if (userInfo) {
      setCookie(USER_INFO_KEY, JSON.stringify(userInfo));
    } else {
      deleteCookie(USER_INFO_KEY);
    }
  }

  getUserInfo(): { id: number; email: string; name: string } | null {
    const value = getCookie(USER_INFO_KEY);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const normalizedBase = this.baseUrl.endsWith("/")
      ? this.baseUrl
      : `${this.baseUrl}/`;
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;

    const url = new URL(normalizedEndpoint, normalizedBase);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }


  private getLocale(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('app-locale');
  }

  private buildHeaders(config?: RequestConfig, requiresAuth = true, omitContentType = false): Headers {
    const headers = new Headers(this.defaultHeaders);
    if (omitContentType) {
      headers.delete('Content-Type');
    }

    const locale = this.getLocale();
    if (locale) {
      headers.set('Accept-Language', locale);
    }
  
    if (config?.headers) {
      const customHeaders = config.headers as Record<string, string>;
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    if (requiresAuth) {
      const token = this.getToken();
      const companyId = this.getCompanyId();
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (companyId) {
        headers.set('X-Company-Id', companyId);
      }
    }
    
    return headers;
  }

  private buildFetchOptions(
    method: string,
    headers: Headers,
    config?: RequestConfig,
    body?: string | FormData | null
  ): RequestInit {
    const options: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined && body !== null) {
      options.body = body;
    }

    if (config?.cache) options.cache = config.cache;
    if (config?.credentials) options.credentials = config.credentials;
    if (config?.mode) options.mode = config.mode;
    if (config?.signal) options.signal = config.signal;

    return options;
  }

  setPermissions(permissions: string[] | null): void {
    if (permissions) {
      setCookie(PERMISSIONS_KEY, JSON.stringify(permissions));
    } else {
      deleteCookie(PERMISSIONS_KEY);
    }
  }

  getPermissions(): string[] {
    const value = getCookie(PERMISSIONS_KEY);
    if (!value) return [];
    try {
      const permissions = JSON.parse(value);
      return Array.isArray(permissions) ? permissions.filter((permission): permission is string => typeof permission === 'string') : [];
    } catch {
      return [];
    }
  }

  private extractErrorMessage(value: unknown, fallback: string): string {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (parsed !== value) {
          return this.extractErrorMessage(parsed, fallback);
        }
      } catch {
      }

      return value || fallback;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.extractErrorMessage(item, fallback)).join(', ');
    }

    if (value && typeof value === 'object') {
      const message = (value as { message?: unknown }).message;
      if (message !== undefined) {
        return this.extractErrorMessage(message, fallback);
      }
    }

    return fallback;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: HttpError = {
        status: response.status,
        message: response.statusText,
      };

      try {
        const errorBody = await response.json();
        error.message = this.extractErrorMessage(errorBody, response.statusText);
        error.errors = errorBody.errors;
      } catch {
      }

      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, config?: RequestConfig & { requiresAuth?: boolean }): Promise<T> {
    const { params, requiresAuth = true } = config || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config, requiresAuth);
    const options = this.buildFetchOptions('GET', headers, config);
    
    const response = await fetch(url, options);
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, config?: RequestConfig & { requiresAuth?: boolean }): Promise<T> {
    const { body, params, requiresAuth = true } = config || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config, requiresAuth);
    const serializedBody = body !== undefined ? JSON.stringify(body) : null;
    const options = this.buildFetchOptions('POST', headers, config, serializedBody);
    
    const response = await fetch(url, options);
    return this.handleResponse<T>(response);
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig & { requiresAuth?: boolean }
  ): Promise<T> {
    const { params, requiresAuth = true } = config || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config, requiresAuth, true);
    const options = this.buildFetchOptions('POST', headers, config, formData);
    
    const response = await fetch(url, options);
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, config?: RequestConfig & { requiresAuth?: boolean }): Promise<T> {
    const { body, params, requiresAuth = true } = config || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config, requiresAuth);
    const serializedBody = body !== undefined ? JSON.stringify(body) : null;
    const options = this.buildFetchOptions('PUT', headers, config, serializedBody);
    
    const response = await fetch(url, options);
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, config?: RequestConfig & { requiresAuth?: boolean }): Promise<T> {
    const { body, params, requiresAuth = true } = config || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config, requiresAuth);
    const serializedBody = body !== undefined ? JSON.stringify(body) : null;
    const options = this.buildFetchOptions('PATCH', headers, config, serializedBody);
    
    const response = await fetch(url, options);
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: RequestConfig & { requiresAuth?: boolean }): Promise<T> {
    const { params, requiresAuth = true } = config || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config, requiresAuth);
    const options = this.buildFetchOptions('DELETE', headers, config);
    
    const response = await fetch(url, options);
    return this.handleResponse<T>(response);
  }
}

export { HttpClient };

