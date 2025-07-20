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
          
          // Guardar token en localStorage y en el estado de Zustand
          localStorage.setItem('jwt_token', token);
          localStorage.setItem('user_role', response.role);
          console.log('AuthStore: Token guardado en localStorage:', token ? 'presente' : 'ausente');
          
          // Obtener datos del usuario
          const user = await authService.getCurrentUser();
          console.log('AuthStore: Usuario obtenido después del login:', user?.email);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          console.log('AuthStore: Estado actualizado después del login. isAuthenticated:', true);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
          console.error('AuthStore: Error en login:', errorMessage, error.response);
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
        authService.logout(); // Limpia localStorage
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        console.log('AuthStore: Sesión cerrada. isAuthenticated:', false);
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
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken) {
          console.log('AuthStore: No hay token en localStorage. No se puede obtener el usuario actual.');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }
        console.log('AuthStore: Token encontrado en localStorage, intentando obtener usuario actual...');

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            token: storedToken, // Usar el token del localStorage
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          console.log('AuthStore: Usuario actual obtenido. isAuthenticated:', true, 'Email:', user?.email);
        } catch (error: any) {
          console.error('AuthStore: Error al obtener usuario actual (token inválido/expirado):', error.response?.status, error.message);
          // Token inválido o expirado, limpiar sesión
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
