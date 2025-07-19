import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'vendedor' | 'cajero' | 'administrador';
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, token, getCurrentUser, isLoading } = useAuthStore();
  const { connect, isConnected } = useChatStore();

  useEffect(() => {
    // Si hay token pero no hay usuario, intentar obtener el usuario
    if (token && !user && !isLoading) {
      getCurrentUser();
    }
  }, [token, user, getCurrentUser, isLoading]);

  useEffect(() => {
    // Conectar WebSocket si está autenticado y no conectado
    if (isAuthenticated && token && !isConnected) {
      connect(token);
    }
  }, [isAuthenticated, token, isConnected, connect]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Verificar autenticación
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol específico
  if (requiredRole && user.rol !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Rol requerido: <span className="font-medium">{requiredRole}</span>
          </p>
          <p className="text-sm text-gray-500">
            Tu rol: <span className="font-medium">{user.rol}</span>
          </p>
        </div>
      </div>
    );
  }

  // Verificar roles permitidos
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Roles permitidos: <span className="font-medium">{allowedRoles.join(', ')}</span>
          </p>
          <p className="text-sm text-gray-500">
            Tu rol: <span className="font-medium">{user.rol}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};