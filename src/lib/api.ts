import axios from 'axios';

const TOKEN_KEY = 'cinepaw_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/bff`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On an expired/invalid token, drop it and bounce to the login screen.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStore.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Pull a human-readable message out of an axios error.
export const errMsg = (e: unknown, fallback = 'Bir hata oluştu.'): string => {
  if (axios.isAxiosError(e)) {
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
};

export default api;
