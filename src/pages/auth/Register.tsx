import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    passwordHash: '',
    confirmPassword: '',
    rol: 'vendedor' as 'vendedor' | 'cajero' | 'administrador',
    telefono: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al cambiar campos
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  // Verificar coincidencia de contraseñas
  useEffect(() => {
    setPasswordMatch(
      formData.passwordHash === formData.confirmPassword || 
      formData.confirmPassword === ''
    );
  }, [formData.passwordHash, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombreCompleto || !formData.email || !formData.passwordHash || !passwordMatch) {
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      setIsSuccess(true);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Registro Exitoso!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu cuenta ha sido creada correctamente. Serás redirigido al login en unos segundos.
            </p>
            <Link to="/login" className="btn-primary">
              Ir al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete a la plataforma P2P
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
              {/* Nombre Completo */}
              <div>
                <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-700">
                  Nombre Completo
                </label>
                <input
                  id="nombreCompleto"
                  name="nombreCompleto"
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Tu nombre completo"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                />
              </div>

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

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Teléfono (Opcional)
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  className="input-field mt-1"
                  placeholder="+58 414 1234567"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  className="input-field mt-1"
                  value={formData.rol}
                  onChange={handleChange}
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="cajero">Cajero</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="passwordHash" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="passwordHash"
                    name="passwordHash"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={formData.passwordHash}
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className={`input-field pr-10 ${!passwordMatch ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {!passwordMatch && formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !formData.nombreCompleto || !formData.email || !formData.passwordHash || !passwordMatch}
                className="btn-primary w-full flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Crear Cuenta</span>
                  </>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};