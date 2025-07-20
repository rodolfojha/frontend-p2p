import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { CajeroDashboard } from './pages/dashboard/CajeroDashboard';
import { VendedorDashboard } from './pages/dashboard/VendedorDashboard'; // Asegúrate de que esta importación sea correcta
import './App.css';
import './index.css';

function App() {
  const { isAuthenticated, token, getCurrentUser } = useAuthStore();
  const { connect, disconnect } = useChatStore();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log("App.tsx: Usuario autenticado, intentando conectar al chat...");
      connect(token);
    } else {
      console.log("App.tsx: Usuario no autenticado, desconectando del chat...");
      disconnect();
    }
    return () => {
      // La desconexión se maneja en el logout explícito o cuando isAuthenticated se vuelve false
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['CAJERO']} />}>
            <Route path="/cajero" element={<CajeroDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['VENDEDOR']} />}>
            <Route path="/vendedor" element={<VendedorDashboard />} />
          </Route>
          <Route path="/" element={isAuthenticated ? <p className="p-4 text-center">Bienvenido al Dashboard</p> : <Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
