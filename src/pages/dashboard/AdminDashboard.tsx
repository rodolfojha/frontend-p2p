import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Users, DollarSign, AlertTriangle, BarChart3, TrendingUp, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { transactionService, disputaService } from '../../services/api';
import type { Transaccion, Disputa } from '../../types/api';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [disputes, setDisputes] = useState<Disputa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    activeDisputes: 0,
    completedToday: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, disputesData] = await Promise.all([
        transactionService.getAllTransactions(),
        disputaService.getAllDisputes(),
      ]);
      
      setTransactions(transactionsData);
      setDisputes(disputesData);
      
      // Calcular estadísticas
      const today = new Date().toDateString();
      const completedToday = transactionsData.filter(
        t => t.estado === 'completada' && 
        new Date(t.fechaConfirmacionFinal || '').toDateString() === today
      ).length;
      
      setStats({
        totalTransactions: transactionsData.length,
        totalVolume: transactionsData.reduce((sum, t) => sum + t.monto, 0),
        activeDisputes: disputesData.filter(d => d.estado === 'abierta' || d.estado === 'en_revision').length,
        completedToday,
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aceptada': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'disputa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'VES') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'VES' ? 'VES' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600">Monitoreo y gestión de la plataforma P2P</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                Administrador: {user?.nombreCompleto}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Transacciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Volumen Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(stats.totalVolume)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Disputas Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeDisputes}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completadas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Transacciones Recientes
              </h2>
              <button 
                onClick={loadDashboardData}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Actualizar
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cajero
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo/Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.vendedor.nombreCompleto}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.vendedor.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.cajero?.nombreCompleto || 'Sin asignar'}
                          </div>
                          {transaction.cajero && (
                            <div className="text-sm text-gray-500">
                              {transaction.cajero.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.tipoOperacion.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(transaction.monto, transaction.moneda)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.estado)}`}>
                            {transaction.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.fechaSolicitud).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Disputes */}
          {disputes.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Disputas Activas ({stats.activeDisputes})
                </h2>
              </div>

              <div className="space-y-4">
                {disputes
                  .filter(d => d.estado === 'abierta' || d.estado === 'en_revision')
                  .slice(0, 5)
                  .map((dispute) => (
                    <div key={dispute.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Disputa #{dispute.id} - Transacción #{dispute.transaccion.id}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Reportado por: {dispute.usuarioReporta.nombreCompleto}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {dispute.motivoDisputa.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {dispute.estado}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(dispute.fechaInicio).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Gestionar Usuarios</h3>
                <p className="text-sm text-gray-600">Ver y administrar cuentas de usuarios</p>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Resolver Disputas</h3>
                <p className="text-sm text-gray-600">Mediar y resolver conflictos</p>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Reportes</h3>
                <p className="text-sm text-gray-600">Analíticas y reportes detallados</p>
              </div>
            </div>
          </div>
        </div>
      } />
    </Routes>
  );
};