import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, AlertCircle, Chrome, Apple, Send } from 'lucide-react'; // Importar iconos corregidos

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado o después de un login exitoso
  useEffect(() => {
    if (isAuthenticated && user) {
      let redirectPath = '/';

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
          console.warn('Rol de usuario desconocido, redirigiendo a la raíz.');
          break;
      }
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Limpiar errores al cambiar campos
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  // Efecto para asegurar que el body y html ocupen toda la pantalla y no tengan márgenes
  useEffect(() => {
    // Añadir clases para asegurar que html y body ocupen el 100% de la altura y no tengan scrollbars
    document.documentElement.classList.add('h-full', 'overflow-hidden');
    document.body.classList.add('h-full', 'overflow-hidden');
    document.body.style.margin = '0'; // Eliminar margen predeterminado del body
    document.body.style.padding = '0'; // Eliminar padding predeterminado del body

    // Función de limpieza para remover las clases y estilos cuando el componente se desmonte
    return () => {
      document.documentElement.classList.remove('h-full', 'overflow-hidden');
      document.body.classList.remove('h-full', 'overflow-hidden');
      document.body.style.margin = ''; // Restaurar margen del body
      document.body.style.padding = ''; // Restaurar padding del body
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar y desmontar

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
        {/* Header */}
        <div className="text-center">
          {/* Placeholder para un logo o un título prominente */}
          <div className="mx-auto mb-4">
            {/* Puedes reemplazar esto con una imagen de logo real */}
            <span className="text-4xl font-bold text-yellow-500">P2P</span>
            <span className="text-4xl font-bold text-white">System</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Accede a tu cuenta de intercambio P2P
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-700"
                placeholder="Email / Número de teléfono"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-700 pr-10"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Botón de Enviar */}
          <div className="pt-2"> {/* Se agregó padding superior para espaciado */}
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </div>

          {/* Separador "O" */}
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-800 px-2 text-gray-500">o</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-gray-700 -translate-y-1/2"></div>
          </div>

          {/* Opciones de Inicio de Sesión Social */}
          <div className="space-y-3">
            <button
              type="button"
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <Chrome className="h-5 w-5 mr-2" /> {/* Icono de Chrome para Google */}
              <span>Continuar con Google</span>
            </button>
            <button
              type="button"
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <Apple className="h-5 w-5 mr-2" />
              <span>Continuar con Apple</span>
            </button>
            <button
              type="button"
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <Send className="h-5 w-5 mr-2" /> {/* Icono de Send para Telegram */}
              <span>Continuar con Telegram</span>
            </button>
          </div>

          {/* Enlace de Registro */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-yellow-500 hover:text-yellow-600 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>

        {/* Enlaces de Pie de Página (estilo Binance) */}
        <div className="mt-8 text-center text-xs text-gray-500 space-x-4">
          <Link to="#" className="hover:text-white transition-colors">
            Cookies
          </Link>
          <Link to="#" className="hover:text-white transition-colors">
            Términos
          </Link>
          <Link to="#" className="hover:text-white transition-colors">
            Privacidad
          </Link>
        </div>
      </div>
    </div>
  );
};
