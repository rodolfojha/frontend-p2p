import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { TransactionChat } from '../../components/chat/TransactionChat';
import type { Transaccion } from '../../types/api';
import { transactionService, userService } from '../../services/api';
import { CheckCircle, XCircle, Clock, MessageCircle, DollarSign, UserCheck } from 'lucide-react';

export const CajeroDashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(user?.disponibilidadCajero ?? false);

  useEffect(() => {
    if (user && token) {
      fetchTransactions();
      setIsAvailable(user.disponibilidadCajero ?? false);
    }
  }, [user, token]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const pendingTransactions = await transactionService.getPendingTransactions();
      const assignedTransactions = await transactionService.getAssignedTransactionsForCajero();

      const combinedTransactionsMap = new Map<number, Transaccion>();
      assignedTransactions.forEach(t => combinedTransactionsMap.set(t.id, t));
      pendingTransactions.forEach(t => {
        if (!combinedTransactionsMap.has(t.id)) {
          combinedTransactionsMap.set(t.id, t);
        }
      });

      const finalTransactions = Array.from(combinedTransactionsMap.values());
      setTransactions(finalTransactions.sort((a, b) => 
        new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      ));

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar transacciones.');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransaction = async (transactionId: number) => {
    try {
      await transactionService.acceptTransaction(transactionId);
      alert('Transacción aceptada con éxito!');
      fetchTransactions();
      setSelectedTransactionId(transactionId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aceptar la transacción.');
      console.error('Error accepting transaction:', err);
    }
  };

  const handleMarkPaymentStarted = async (transactionId: number) => {
    const urlComprobante = prompt('Por favor, introduce la URL del comprobante de pago:');
    if (!urlComprobante) {
      alert('La URL del comprobante es obligatoria.');
      return;
    }
    try {
      await transactionService.markPaymentStarted(transactionId, urlComprobante);
      alert('Pago marcado como iniciado con éxito!');
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al marcar pago iniciado.');
      console.error('Error marking payment started:', err);
    }
  };

  const handleMarkCompleted = async (transactionId: number) => {
    try {
      await transactionService.markCompleted(transactionId);
      alert('Transacción marcada como completada con éxito!');
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al marcar transacción como completada.');
      console.error('Error marking completed:', err);
    }
  };

  const handleOpenChat = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
  };

  const handleToggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      await userService.setAvailability(newAvailability);
      setIsAvailable(newAvailability);
      alert(`Tu disponibilidad ha sido ${newAvailability ? 'activada' : 'desactivada'}.`);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar disponibilidad.');
      console.error('Error toggling availability:', err);
    }
  };

  // Find the selected transaction object to pass to TransactionChat
  const selectedTransaction = transactions.find(t => t.id === selectedTransactionId);

  if (loading) return <div className="text-center p-4 text-gray-600">Cargando transacciones...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg min-h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard del Cajero</h2>
        <button
          onClick={handleToggleAvailability}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
            isAvailable ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {isAvailable ? <UserCheck className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <span>{isAvailable ? 'Disponible' : 'No Disponible'}</span>
        </button>
      </div>

      <p className="mb-6 text-gray-700">Bienvenido, <span className="font-semibold">{user?.nombreCompleto}</span> ({user?.rol}).</p>

      {selectedTransactionId && selectedTransaction ? ( // Ensure selectedTransaction is not null
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6 h-[70vh] flex flex-col shadow-inner">
          <button
            onClick={() => setSelectedTransactionId(null)}
            className="mb-4 self-start px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Volver a Transacciones</span>
          </button>
          {/* Pasar el objeto transaction completo y el callback de actualización */}
          <TransactionChat transaction={selectedTransaction} onTransactionUpdate={fetchTransactions} />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg shadow-inner p-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Transacciones Asignadas y Pendientes</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No tienes transacciones asignadas o pendientes para aceptar.</p>
              <p className="text-sm mt-2">Asegúrate de estar "Disponible" para recibir solicitudes.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 hover:shadow-md">
                  <div className="flex-1 mb-2 sm:mb-0">
                    <p className="font-medium text-lg text-gray-900">Transacción #{transaction.id}</p>
                    <p className="text-sm text-gray-700">Tipo: <span className="capitalize">{transaction.tipoOperacion}</span></p>
                    <p className="text-sm text-gray-700">Monto: <span className="font-semibold text-primary">${transaction.monto} {transaction.moneda}</span></p>
                    <p className="text-sm text-gray-700">Estado: <span className={`font-semibold ${
                      transaction.estado === 'pendiente' ? 'text-yellow-600' :
                      transaction.estado === 'aceptada' ? 'text-blue-600' :
                      transaction.estado === 'en_proceso_pago' ? 'text-orange-600' :
                      transaction.estado === 'en_proceso_confirmacion' ? 'text-purple-600' :
                      transaction.estado === 'completada' ? 'text-green-600' :
                      transaction.estado === 'cancelada' ? 'text-red-600' : 'text-gray-600'
                    }`}>{transaction.estado.replace(/_/g, ' ')}</span></p>
                    <p className="text-sm text-gray-700">Vendedor: {transaction.vendedor.nombreCompleto}</p>
                    {transaction.metodoPagoVendedor && (
                      <p className="text-sm text-gray-700">Método Vendedor: {transaction.metodoPagoVendedor.aliasMetodo || transaction.metodoPagoVendedor.tipoCuenta}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {/* Botón para aceptar transacciones pendientes */}
                    {transaction.estado === 'pendiente' && (
                      <button
                        onClick={() => handleAcceptTransaction(transaction.id)}
                        className="btn-success flex items-center space-x-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Aceptar</span>
                      </button>
                    )}
                    {/* Botón para marcar pago iniciado (el cajero lo hace después de que el vendedor le paga) */}
                    {transaction.estado === 'en_proceso_pago' && (
                      <button
                        onClick={() => handleMarkPaymentStarted(transaction.id)}
                        className="btn-warning flex items-center space-x-1"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Marcar Pago Iniciado</span>
                      </button>
                    )}
                    {/* Botón para marcar completada (el cajero lo hace después de confirmar el pago) */}
                    {transaction.estado === 'en_proceso_confirmacion' && (
                      <button
                        onClick={() => handleMarkCompleted(transaction.id)}
                        className="btn-success flex items-center space-x-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Marcar Completada</span>
                      </button>
                    )}
                    {/* Botón de Chat para transacciones en estados de conversación */}
                    {(transaction.estado === 'aceptada' || 
                      transaction.estado === 'en_proceso_pago' || 
                      transaction.estado === 'en_proceso_confirmacion' ||
                      transaction.estado === 'disputa') && (
                      <button
                        onClick={() => handleOpenChat(transaction.id)}
                        className="btn-info flex items-center space-x-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
