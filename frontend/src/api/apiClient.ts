export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'ADMIN' | 'PROPRIETAIRE';
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export const SA_SESSION_KEY = 'sa_session';

export const hasSessionIndicator = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SA_SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

export const setSessionIndicator = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SA_SESSION_KEY, '1');
    }
  } catch {
    // ignore storage errors
  }
};

export const clearSessionIndicator = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SA_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

let inMemoryAccessToken: string | null = null;

export const setMemoryAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getMemoryAccessToken = () => inMemoryAccessToken;

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function customFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (inMemoryAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(endpoint, config);

  if (
    response.status === 401 &&
    !isRetry &&
    hasSessionIndicator() &&
    endpoint !== '/api/auth/login' &&
    endpoint !== '/api/auth/register' &&
    endpoint !== '/api/auth/refresh'
  ) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const authData: AuthResponseData = await refreshRes.json();
        setMemoryAccessToken(authData.accessToken);
        setSessionIndicator();
        return customFetch<T>(endpoint, options, true);
      } else {
        clearSessionIndicator();
        setMemoryAccessToken(null);
      }
    } catch {
      clearSessionIndicator();
      setMemoryAccessToken(null);
    }
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Erreur HTTP ${response.status}` };
    }
    throw new ApiError(response.status, errorData.message || errorData.error || 'Une erreur est survenue', errorData);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}
