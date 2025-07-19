import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CheckCircle, Clock, DollarSign, MessageCircle, UserCheck, UserX } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { transactionService, userService } from '../../services/api';
import type { Transaccion } from '../../types/api';
import { TransactionChat } from '../../components/chat/TransactionChat';

export const CajeroDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [pendingTransactions, setPendingTransactions] = useState<Transaccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null);
  const [isAvailable, setIsAvailable] = useState(user?.disponibilidadCajero || false);

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getPendingTransactions();
      setPendingTransactions(data);
    } catch (error) {
      console.error('Error cargando transacciones pendientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      const newAvailability = !isAvailable;
      await userService.setAvailability(newAvailability);
      setIsAvailable(newAvailability);
    } catch (error) {
      console.error('Error actualizando disponibilidad:', error);
    }
  };

  const handleAcceptTransaction = async (transactionId: number) => {
    try {
      await transactionService.acceptTransaction(transactionId);
      await loadPendingTransactions(); // Recargar lista
    } catch (error) {
      console.error('Error aceptando transacción:', error);
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
              <p className="text-gray-600">Panel de Cajero P2P</p>
            </div>
            
            {/* Availability Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Disponibilidad:</span>
                <button
                  onClick={handleAvailabilityToggle}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isAvailable 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {isAvailable ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Disponible</span>
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4" />
                      <span>No Disponible</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Transacciones Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingTransactions.length}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Volumen Disponible</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(
                      pendingTransactions.reduce((sum, t) => sum + t.monto, 0),
                      'VES'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isAvailable ? (
                    <UserCheck className={`h-6 w-6 text-green-600`} />
                  ) : (
                    <UserX className={`h-6 w-6 text-red-600`} />
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className={`text-lg font-bold ${isAvailable ? 'text-green-900' : 'text-red-900'}`}>
                    {isAvailable ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Warning */}
          {!isAvailable && (
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center space-x-3">
                <UserX className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Disponibilidad Desactivada
                  </h3>
                  <p className="text-sm text-yellow-700">
                    No recibirás nuevas transacciones hasta que actives tu disponibilidad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Transactions */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Transacciones Pendientes
              </h2>
              <button 
                onClick={loadPendingTransactions}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Actualizar
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay transacciones pendientes
                </h3>
                <p className="text-gray-600">
                  Las nuevas transacciones aparecerán aquí cuando estés disponible
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTransactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {transaction.tipoOperacion.toUpperCase()} - #{transaction.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Vendedor: {transaction.vendedor.nombreCompleto}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(transaction.monto, transaction.moneda)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Neto: {formatCurrency(transaction.montoNetoVendedor, transaction.moneda)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Método de Pago:</p>
                            <p className="font-medium">
                              {transaction.metodoPagoVendedor.tipoCuenta} - {transaction.metodoPagoVendedor.numeroCuenta}
                            </p>
                            <p className="text-sm text-gray-500">
                              {transaction.metodoPagoVendedor.nombreTitular}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Fecha:</p>
                            <p className="font-medium">
                              {new Date(transaction.fechaSolicitud).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleAcceptTransaction(transaction.id)}
                        disabled={!isAvailable}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Aceptar Transacción</span>
                      </button>
                    </div>
                  </div>
                ))}
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