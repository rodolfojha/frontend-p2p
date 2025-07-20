// src/services/api.ts
import axios from 'axios';
import type { 
  LoginRequest, 
  LoginResponse, 
  Usuario, 
  Transaccion, 
  CreateTransactionRequest, 
  MetodoPagoUsuario,
  CreatePaymentMethodRequest,
  RegisterRequest,
  Disputa
} from '../types/api';

const API_BASE_URL = 'http://localhost:8080/api';

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`Axios Interceptor: Token presente para la solicitud a ${config.url}`);
  } else {
    console.warn(`Axios Interceptor: No hay token en localStorage para la solicitud a ${config.url}`);
  }
  return config;
}, (error) => {
  console.error('Axios Interceptor: Error en la solicitud:', error);
  return Promise.reject(error);
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Axios Interceptor: Recibido 401 Unauthorized. Limpiando token y redirigiendo a login.');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
      window.location.href = '/login'; // Redirigir al login
    }
    return Promise.reject(error);
  }
);

// ==================== SERVICIOS DE AUTENTICACIÓN ====================
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<Usuario> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
  },

  getCurrentUser: async (): Promise<Usuario> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

// ==================== SERVICIOS DE TRANSACCIONES ====================
export const transactionService = {
  create: async (transaction: CreateTransactionRequest): Promise<Transaccion> => {
    const response = await api.post('/transacciones/solicitar', transaction);
    return response.data;
  },

  getMyTransactions: async (): Promise<Transaccion[]> => {
    const response = await api.get('/transacciones/mis-solicitudes');
    return response.data;
  },

  getPendingTransactions: async (): Promise<Transaccion[]> => {
    const response = await api.get('/transacciones/pendientes-cajero');
    return response.data;
  },

  getAssignedTransactionsForCajero: async (): Promise<Transaccion[]> => {
    try {
      const response = await api.get('/transacciones/cajero/mis-asignadas'); 
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener transacciones asignadas para cajero:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn('Endpoint /transacciones/cajero/mis-asignadas no encontrado. Asegúrate de implementarlo en el backend.');
        return []; 
      }
      throw error;
    }
  },

  acceptTransaction: async (transactionId: number): Promise<Transaccion> => {
    const response = await api.post(`/transacciones/aceptar/${transactionId}`);
    return response.data;
  },

  markPaymentStarted: async (transactionId: number, urlComprobante: string): Promise<Transaccion> => {
    const response = await api.post(`/transacciones/marcar-pago-iniciado/${transactionId}`, {
      urlComprobante,
    });
    return response.data;
  },

  markCompleted: async (transactionId: number): Promise<Transaccion> => {
    const response = await api.post(`/transacciones/marcar-completada/${transactionId}`);
    return response.data;
  },

  cancelTransaction: async (transactionId: number): Promise<Transaccion> => {
    const response = await api.post(`/transacciones/cancelar/${transactionId}`);
    return response.data;
  },

  getAllTransactions: async (): Promise<Transaccion[]> => {
    const response = await api.get('/transacciones/todas');
    return response.data;
  },
};

// ==================== SERVICIOS DE MÉTODOS DE PAGO ====================
export const paymentMethodService = {
  getMyMethods: async (): Promise<MetodoPagoUsuario[]> => {
    const response = await api.get('/metodos-pago');
    return response.data;
  },

  create: async (method: CreatePaymentMethodRequest): Promise<MetodoPagoUsuario> => {
    const response = await api.post('/metodos-pago', method);
    return response.data;
  },
};

// ==================== SERVICIOS DE USUARIO ====================
export const userService = {
  setAvailability: async (disponible: boolean): Promise<Usuario> => {
    const response = await api.post('/users/set-availability', null, {
      params: { disponible },
    });
    return response.data;
  },
};

// ==================== SERVICIOS DE DISPUTAS ====================
export const disputaService = {
  getMyDisputes: async (): Promise<Disputa[]> => {
    const response = await api.get('/disputas/mis-disputas');
    return response.data;
  },

  getAllDisputes: async (): Promise<Disputa[]> => {
    const response = await api.get('/disputas/todas');
    return response.data;
  },

  createDispute: async (transaccionId: number, motivoDisputa: string, urlEvidencia?: string): Promise<Disputa> => {
    const response = await api.post('/disputas/iniciar', {
      transaccionId,
      motivoDisputa,
      urlEvidenciaAdicional: urlEvidencia,
    });
    return response.data;
  },

  resolveDispute: async (disputaId: number, estado: string, decision: string): Promise<Disputa> => {
    const response = await api.put(`/disputas/resolver/${disputaId}`, {
      estado,
      decisionAdministrador: decision,
    });
    return response.data;
  },
};

export default api;
