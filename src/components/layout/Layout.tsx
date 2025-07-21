import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, LogOut, Settings, Users, DollarSign, MessageCircle, BarChart, User } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determinar los enlaces del sidebar basados en el rol del usuario
  const sidebarLinks = [
    { name: 'Inicio', path: '/', icon: Home, roles: ['administrador', 'cajero', 'vendedor'] },
    { name: 'Admin', path: '/admin', icon: Users, roles: ['administrador'] },
    { name: 'Cajero', path: '/cajero', icon: DollarSign, roles: ['cajero'] },
    { name: 'Vendedor', path: '/vendedor', icon: MessageCircle, roles: ['vendedor'] },
    // { name: 'Configuración', path: '/settings', icon: Settings, roles: ['administrador', 'cajero', 'vendedor'] },
    // { name: 'Reportes', path: '/reports', icon: BarChart, roles: ['administrador'] },
  ];

  const userRole = user?.rol;

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-500">P2P<span className="text-white">System</span></h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {sidebarLinks.map((link) => (
              (userRole && link.roles.includes(userRole)) && (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="flex items-center space-x-3 px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700">
          {user && (
            <div className="flex items-center space-x-3 mb-4 px-4 py-2 bg-gray-700 rounded-md">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">{user.nombreCompleto}</p>
                <p className="text-xs text-gray-400 capitalize">{user.rol}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Eliminado max-w-7xl mx-auto y p-0 para permitir que el contenido ocupe todo el ancho */}
        <div className="w-full h-full"> {/* Asegura que este div ocupe todo el espacio disponible */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
