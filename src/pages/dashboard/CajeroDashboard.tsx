import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { TransactionChat } from '../../components/chat/TransactionChat';
import type { Transaccion } from '../../types/api';
import { transactionService, userService } from '../../services/api';
import { CheckCircle, XCircle, Clock, MessageCircle, DollarSign, UserCheck, RefreshCw, Search, Filter } from 'lucide-react';

export const CajeroDashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(user?.disponibilidadCajero ?? false);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'assigned'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    // Reemplazar prompt con un modal personalizado
    const urlComprobante = window.prompt('Por favor, introduce la URL del comprobante de pago:'); // Usar prompt temporalmente
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

  const formatTransactionState = (state: string) => {
    return state.replace(/_/g, ' ').toUpperCase();
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filterType === 'all' || 
                          (filterType === 'pending' && transaction.estado === 'pendiente') ||
                          (filterType === 'assigned' && transaction.cajero?.id === user?.id && transaction.estado !== 'completada' && transaction.estado !== 'cancelada');
    
    const matchesSearch = searchTerm === '' ||
                          transaction.id.toString().includes(searchTerm) ||
                          transaction.vendedor.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.tipoOperacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.moneda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          formatTransactionState(transaction.estado).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const selectedTransaction = transactions.find(t => t.id === selectedTransactionId);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Cargando transacciones...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-6 lg:p-8">
      <div className="max-w-7x2 mx-auto bg-gray-800 rounded-lg shadow-xl p-0 sm:p-0 lg:p-8 border border-gray-700">
        {/* Header del Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-4 sm:mb-0">Dashboard del Cajero</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleAvailability}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 
                ${isAvailable ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                shadow-md hover:shadow-lg`}
            >
              {isAvailable ? <UserCheck className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <span>{isAvailable ? 'Disponible' : 'No Disponible'}</span>
            </button>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <p className="mb-6 text-gray-300">Bienvenido, <span className="font-semibold text-white">{user?.nombreCompleto}</span> (<span className="capitalize">{user?.rol}</span>).</p>

        {selectedTransactionId && selectedTransaction ? (
          <div className="bg-gray-700 rounded-lg border border-gray-600 p-4 mb-6 h-[70vh] flex flex-col shadow-inner">
            <button
              onClick={() => setSelectedTransactionId(null)}
              className="mb-4 self-start px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Clock className="h-4 w-4" />
              <span>Volver a Transacciones</span>
            </button>
            <TransactionChat transaction={selectedTransaction} onTransactionUpdate={fetchTransactions} />
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg shadow-inner p-4 sm:p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">Transacciones Asignadas y Pendientes</h3>
            
            {/* Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-2 bg-gray-600 rounded-md p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filterType === 'all' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-500'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterType('pending')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filterType === 'pending' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-500'}`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setFilterType('assigned')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filterType === 'assigned' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-500'}`}
                >
                  Asignadas
                </button>
              </div>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Buscar por ID, Vendedor, Tipo, Moneda..."
                  className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No tienes transacciones para mostrar con los filtros actuales.</p>
                <p className="text-sm mt-2">Asegúrate de estar "Disponible" para recibir solicitudes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-600">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-600">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                        ID
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Monto
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Vendedor
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Método Vendedor
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                          #{transaction.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                          {transaction.tipoOperacion}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-yellow-500 font-semibold">
                          ${transaction.monto} {transaction.moneda}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.estado === 'pendiente' ? 'bg-yellow-800 text-yellow-200' :
                            transaction.estado === 'aceptada' ? 'bg-blue-800 text-blue-200' :
                            transaction.estado === 'en_proceso_pago' ? 'bg-orange-800 text-orange-200' :
                            transaction.estado === 'en_proceso_confirmacion' ? 'bg-purple-800 text-purple-200' :
                            transaction.estado === 'completada' ? 'bg-green-800 text-green-200' :
                            transaction.estado === 'cancelada' ? 'bg-red-800 text-red-200' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {formatTransactionState(transaction.estado)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {transaction.vendedor.nombreCompleto}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {transaction.metodoPagoVendedor?.aliasMetodo || transaction.metodoPagoVendedor?.tipoCuenta || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {/* Botón para aceptar transacciones pendientes */}
                            {transaction.estado === 'pendiente' && (
                              <button
                                onClick={() => handleAcceptTransaction(transaction.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-gray-900 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Aceptar
                              </button>
                            )}
                            {/* Botón para marcar pago iniciado (el cajero lo hace después de que el vendedor le paga) */}
                            {transaction.estado === 'en_proceso_pago' && (
                              <button
                                onClick={() => handleMarkPaymentStarted(transaction.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-gray-900 bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                              >
                                <Clock className="h-4 w-4 mr-1" /> Marcar Pago
                              </button>
                            )}
                            {/* Botón para marcar completada (el cajero lo hace después de confirmar el pago) */}
                            {transaction.estado === 'en_proceso_confirmacion' && (
                              <button
                                onClick={() => handleMarkCompleted(transaction.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Completar
                              </button>
                            )}
                            {/* Botón de Chat para transacciones en estados de conversación */}
                            {(transaction.estado === 'aceptada' || 
                              transaction.estado === 'en_proceso_pago' || 
                              transaction.estado === 'en_proceso_confirmacion' ||
                              transaction.estado === 'disputa') && (
                              <button
                                onClick={() => handleOpenChat(transaction.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
                              >
                                <MessageCircle className="h-4 w-4 mr-1" /> Chat
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
        )}
      </div>
    </div>
  );
};
