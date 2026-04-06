const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
  cache?: RequestCache;
  tags?: string[];
}

export async function api<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, cache, tags } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
    ...(cache && { cache }),
    ...(tags && { next: { tags } }),
  };

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data as T;
}
