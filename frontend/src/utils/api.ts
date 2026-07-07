const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

export const clearRefreshToken = (): void => {
  localStorage.removeItem('refresh_token');
};

export const authHeaders = (additionalHeaders: Record<string, string> = {}) => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...additionalHeaders,
  };
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(body?.message || 'Request failed');
    Object.assign(error, { status: response.status, body });
    throw error;
  }

  return body;
};

export const loginRequest = async (payload: Record<string, unknown>) => {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user: payload }),
  });
};

export const signupRequest = async (payload: Record<string, unknown>) => {
  return apiFetch('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user: payload }),
  });
};

export const refreshTokenRequest = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Refresh token is missing');
  }

  return apiFetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};

export const logoutRequest = async () => {
  return apiFetch('/auth/logout', {
    method: 'DELETE',
    headers: authHeaders(),
  });
};

export const fetchCurrentUser = async () => {
  return apiFetch('/auth/me', {
    method: 'GET',
    headers: authHeaders(),
  });
};
