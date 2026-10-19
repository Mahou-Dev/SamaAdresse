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
let lastRefreshData: AuthResponseData | null = null;

export const setMemoryAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (!token) {
    lastRefreshData = null;
  }
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

let activeRefreshPromise: Promise<AuthResponseData | null> | null = null;
let lastRefreshTime = 0;

export async function refreshAuth(): Promise<AuthResponseData | null> {
  if (inMemoryAccessToken && lastRefreshData) {
    return lastRefreshData;
  }
  if (lastRefreshData && Date.now() - lastRefreshTime < 5000) {
    if (!inMemoryAccessToken) {
      setMemoryAccessToken(lastRefreshData.accessToken);
    }
    return lastRefreshData;
  }
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const authData: AuthResponseData = await refreshRes.json();
        setMemoryAccessToken(authData.accessToken);
        lastRefreshData = authData;
        lastRefreshTime = Date.now();
        setSessionIndicator();
        return authData;
      } else {
        if (refreshRes.status === 401 || refreshRes.status === 403) {
          clearSessionIndicator();
          setMemoryAccessToken(null);
        }
        return null;
      }
    } catch {
      // Perte de réseau / offline : ne pas effacer le session indicator
      setMemoryAccessToken(null);
      return null;
    } finally {
      setTimeout(() => {
        activeRefreshPromise = null;
      }, 500);
    }
  })();

  return activeRefreshPromise;
}

export async function refreshAccessToken(): Promise<string | null> {
  const auth = await refreshAuth();
  return auth?.accessToken ?? null;
}

export async function customFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  if (
    !inMemoryAccessToken &&
    hasSessionIndicator() &&
    endpoint !== '/api/auth/login' &&
    endpoint !== '/api/auth/register' &&
    endpoint !== '/api/auth/refresh'
  ) {
    await refreshAccessToken();
  }

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
    const newToken = await refreshAccessToken();
    if (newToken) {
      return customFetch<T>(endpoint, options, true);
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
