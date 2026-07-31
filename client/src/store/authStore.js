import { create } from 'zustand';
import { authAPI } from '../api/services';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
    return data.data.user;
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.getProfile();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
