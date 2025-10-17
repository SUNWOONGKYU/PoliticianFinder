import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  fetchCurrentUser: () => Promise<void>;
}

interface SignupData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      fetchCurrentUser: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          throw new Error('No access token available');
        }

        try {
          const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          set({
            user: response.data,
            isAuthenticated: true,
          });
        } catch (error: any) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          });

          const { access_token, refresh_token } = response.data;

          // Set default axios header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            isLoading: false,
            error: null,
          });

          // Fetch current user data
          await get().fetchCurrentUser();
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null });
        try {
          // Signup endpoint returns user data but no tokens
          await axios.post(`${API_URL}/auth/signup`, data);

          // After successful signup, automatically log in
          await get().login(data.email, data.password);
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Signup failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize axios headers on app start if token exists
if (typeof window !== 'undefined') {
  const storedData = localStorage.getItem('auth-storage');
  if (storedData) {
    try {
      const { state } = JSON.parse(storedData);
      if (state?.accessToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error);
    }
  }
}