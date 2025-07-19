import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario, LoginRequest } from '../types/api';
import { authService } from '../services/api';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<Usuario>) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          const token = response.token;
          
          // Guardar token en localStorage
          localStorage.setItem('jwt_token', token);
          localStorage.setItem('user_role', response.role);
          
          // Obtener datos del usuario
          const user = await authService.getCurrentUser();
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      register: async (userData: Partial<Usuario>) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(userData as any);
          set({ isLoading: false, error: null });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Error al registrarse';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Token inválido o expirado
          get().logout();
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);