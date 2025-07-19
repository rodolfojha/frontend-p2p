import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Import real dashboards (not temporary ones)
import { VendedorDashboard } from './pages/dashboard/VendedorDashboard';
import { CajeroDashboard } from './pages/dashboard/CajeroDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';

function App() {
  const { getCurrentUser, token, isAuthenticated } = useAuthStore();

  // Verificar autenticación al cargar la app
  useEffect(() => {
    if (token && !isAuthenticated) {
      getCurrentUser();
    }
  }, [token, isAuthenticated, getCurrentUser]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard principal - redirige según el rol */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />

          {/* Dashboards específicos por rol */}
          <Route 
            path="/vendedor/*" 
            element={
              <ProtectedRoute requiredRole="vendedor">
                <Layout>
                  <VendedorDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cajero/*" 
            element={
              <ProtectedRoute requiredRole="cajero">
                <Layout>
                  <CajeroDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requiredRole="administrador">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Componente para redirigir al dashboard correcto según el rol
const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.rol) {
    case 'vendedor':
      return <Navigate to="/vendedor" replace />;
    case 'cajero':
      return <Navigate to="/cajero" replace />;
    case 'administrador':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;