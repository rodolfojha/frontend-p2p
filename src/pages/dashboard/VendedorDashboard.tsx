import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus, DollarSign, Clock, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { transactionService } from '../../services/api';
import type { Transaccion } from '../../types/api';
import { TransactionChat } from '../../components/chat/TransactionChat';

export const VendedorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getMyTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error cargando transacciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aceptada': return 'bg-blue-100 text-blue-800';
      case 'en_proceso_pago': return 'bg-orange-100 text-orange-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'disputa': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'aceptada': return <CheckCircle className="h-4 w-4" />;
      case 'completada': return <CheckCircle className="h-4 w-4" />;
      case 'disputa': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'VES' ? 'VES' : 'USD',
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
                ¡Bienvenido, {user?.nombreCompleto}!
              </h1>
              <p className="text-gray-600">Gestiona tus transacciones P2P</p>
            </div>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nueva Transacción</span>
            </button>
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
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {transactions.filter(t => t.estado === 'pendiente').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {transactions.filter(t => t.estado === 'completada').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Volumen Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(
                      transactions.reduce((sum, t) => sum + t.monto, 0),
                      'VES'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Mis Transacciones
              </h2>
              <button 
                onClick={loadTransactions}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Actualizar
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes transacciones
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primera transacción para comenzar
                </p>
                <button className="btn-primary">
                  Nueva Transacción
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transacción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo/Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cajero
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{transaction.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.uuid.slice(0, 8)}...
                            </div>
                          </div>
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
                          <div className="text-sm text-gray-900">
                            {transaction.cajero?.nombreCompleto || 'Sin asignar'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.estado)}`}>
                            {getStatusIcon(transaction.estado)}
                            <span>{transaction.estado.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.fechaSolicitud).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {(transaction.estado === 'aceptada' || 
                              transaction.estado === 'en_proceso_pago' || 
                              transaction.estado === 'completada') && (
                              <button
                                onClick={() => setSelectedTransaction(transaction)}
                                className="text-primary hover:text-primary/80 flex items-center space-x-1"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>Chat</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Chat Modal */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-2xl h-96 flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold">
                    Chat - Transacción #{selectedTransaction.id}
                  </h3>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1">
                  <TransactionChat transactionId={selectedTransaction.id} />
                </div>
              </div>
            </div>
          )}
        </div>
      } />
    </Routes>
  );
};