'use client';

import { useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(
  url: string,
  options: ApiOptions = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, ...rest });

  // Handle 401 — auto logout
  if (res.status === 401 && !skipAuth) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  // Parse response
  let data: any;
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null
        ? data.error || data.message || `Request failed (${res.status})`
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export function useApi() {
  const addToast = useUIStore((s) => s.addToast);

  const get = useCallback(
    <T = any>(url: string, options?: ApiOptions) =>
      request<T>(url, { ...options, method: 'GET' }),
    [],
  );

  const post = useCallback(
    <T = any>(url: string, body?: any, options?: ApiOptions) =>
      request<T>(url, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [],
  );

  const put = useCallback(
    <T = any>(url: string, body?: any, options?: ApiOptions) =>
      request<T>(url, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [],
  );

  const patch = useCallback(
    <T = any>(url: string, body?: any, options?: ApiOptions) =>
      request<T>(url, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [],
  );

  const del = useCallback(
    <T = any>(url: string, options?: ApiOptions) =>
      request<T>(url, { ...options, method: 'DELETE' }),
    [],
  );

  return { get, post, put, patch, del, request };
}

export { request, ApiError };
