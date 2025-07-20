import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore(); // Asegurarse de obtener 'user' del store
  const navigate = useNavigate();

  // Redirigir si ya está autenticado o después de un login exitoso
  useEffect(() => {
    if (isAuthenticated && user) { // Verificar también que el objeto user esté disponible
      let redirectPath = '/'; // Ruta por defecto

      switch (user.rol) {
        case 'administrador':
          redirectPath = '/admin';
          break;
        case 'cajero':
          redirectPath = '/cajero';
          break;
        case 'vendedor':
          redirectPath = '/vendedor';
          break;
        default:
          // Si el rol no coincide con ninguno, puedes redirigir a una página genérica o al login
          console.warn('Rol de usuario desconocido, redirigiendo a la raíz.');
          break;
      }
      navigate(redirectPath, { replace: true }); // Usar replace para evitar historial de navegación
    }
  }, [isAuthenticated, user, navigate]); // Dependencias: isAuthenticated, user, navigate

  // Limpiar errores al cambiar campos
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      // Puedes mostrar un error si los campos están vacíos
      return;
    }

    try {
      await login(formData);
      // La redirección se manejará en el useEffect después de que isAuthenticated y user se actualicen
    } catch (loginError) {
      // El error ya está manejado en el store y se mostrará en la UI
      console.error('Error en login:', loginError);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta P2P
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="card">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field mt-1"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="btn-primary w-full flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="card bg-gray-50 border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Credenciales de prueba:</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Vendedor:</strong> maria.vendedora@example.com</p>
            <p><strong>Cajero:</strong> juan.cajero@example.com</p>
            <p><strong>Admin:</strong> admin@example.com</p>
            <p><strong>Contraseña:</strong> password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};
