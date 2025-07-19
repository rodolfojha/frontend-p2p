import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, Bell, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'vendedor': return 'bg-blue-100 text-blue-800';
      case 'cajero': return 'bg-green-100 text-green-800';
      case 'administrador': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">
                P2P Platform
              </h1>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.nombreCompleto || 'Usuario'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.rol || '')}`}>
                    {user?.rol}
                  </span>
                </div>

                {/* Settings */}
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Settings className="h-5 w-5" />
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};