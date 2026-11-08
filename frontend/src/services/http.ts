import axios from 'axios';

export const TOKEN_KEY = 'torque.accessToken';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

http.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && window.localStorage.getItem(TOKEN_KEY)) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('torque:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function getApiError(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data.error?.message ?? fallback;
  }
  return fallback;
}
