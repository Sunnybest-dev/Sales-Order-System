import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Silent endpoints — errors on these are handled by the caller, no global toast
const SILENT_URLS = ['/auth/profile', '/auth/refresh', '/auth/logout', '/notifications'];

const isSilent = (config) =>
  config?.silent === true ||
  SILENT_URLS.some((url) => config?.url?.includes(url));

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Token expired — attempt refresh
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Don't show toast for 401s or silent requests
    if (error.response?.status !== 401 && !isSilent(original)) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }

    return Promise.reject(error);
  }
);

export default api;
