// src/types/api.ts

export interface Usuario {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: 'vendedor' | 'cajero' | 'administrador';
  telefono?: string;
  estado: 'activo' | 'inactivo' | 'bloqueado';
  disponibilidadCajero?: boolean;
  fechaRegistro: string;
  ultimoLogin?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
  role: string;
}

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  passwordHash: string;
  rol: 'vendedor' | 'cajero' | 'administrador';
  telefono?: string;
}

export interface Transaccion {
  id: number;
  uuid: string;
  vendedor: Usuario;
  cajero?: Usuario;
  tipoOperacion: 'deposito' | 'retiro';
  monto: number;
  moneda: string;
  comisionBruta: number;
  montoNetoVendedor: number;
  estado: 'pendiente' | 'aceptada' | 'en_proceso_pago' | 'en_proceso_confirmacion' | 'completada' | 'cancelada' | 'disputa';
  metodoPagoVendedor: MetodoPagoUsuario;
  metodoPagoCajero?: MetodoPagoUsuario;
  fechaSolicitud: string;
  fechaAceptacion?: string;
  fechaPagoIniciado?: string;
  fechaConfirmacionFinal?: string;
  urlComprobantePago?: string;
  notasTransaccion?: string;
}

export interface MetodoPagoUsuario {
  id: number;
  tipoCuenta: string;
  numeroCuenta: string;
  nombreTitular: string;
  identificacionTitular?: string;
  aliasMetodo?: string;
  estado: 'activo' | 'inactivo' | 'verificado' | 'pendiente_verificacion';
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface MensajeChat {
  id: number;
  contenido: string;
  transaccionId: number;
  remitente: {
    id: number;
    nombreCompleto: string;
    rol: string;
  };
  timestamp: string;
  fechaEnvio?: string;
  error?: boolean;
  mensaje?: string;
}

export interface CreateTransactionRequest {
  tipoOperacion: 'deposito' | 'retiro';
  monto: number;
  metodoPagoVendedorId: number;
  moneda: string;
  opcionComision: 'restar' | 'agregar';
}

export interface CreatePaymentMethodRequest {
  tipoCuenta: string;
  numeroCuenta: string;
  nombreTitular: string;
  identificacionTitular?: string;
  aliasMetodo?: string;
}

export interface Disputa {
  id: number;
  transaccion: Transaccion;
  usuarioReporta: Usuario;
  motivoDisputa: string;
  fechaInicio: string;
  estado: 'abierta' | 'en_revision' | 'resuelta_vendedor' | 'resuelta_cajero' | 'cancelada';
  administradorAsignado?: Usuario;
  fechaResolucion?: string;
  decisionAdministrador?: string;
  urlEvidenciaAdicional?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}