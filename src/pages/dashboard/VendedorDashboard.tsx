import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { TransactionChat } from '../../components/chat/TransactionChat';
import type { Transaccion, MetodoPagoUsuario, CreateTransactionRequest, CreatePaymentMethodRequest } from '../../types/api';
import { transactionService, paymentMethodService } from '../../services/api';
import { PlusCircle, XCircle, DollarSign, MessageCircle, Info, CheckCircle, Clock, Loader2, CreditCard, RefreshCw, Search } from 'lucide-react';

export const VendedorDashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTransactionModal, setShowCreateTransactionModal] = useState(false);
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<MetodoPagoUsuario[]>([]);
  const [newTransactionData, setNewTransactionData] = useState<CreateTransactionRequest>({
    tipoOperacion: 'deposito',
    monto: 0,
    moneda: 'USD',
    metodoPagoVendedorId: 0,
    opcionComision: 'restar',
  });
  const [newPaymentMethodData, setNewPaymentMethodData] = useState<CreatePaymentMethodRequest>({
    tipoCuenta: '',
    numeroCuenta: '',
    nombreTitular: '',
    identificacionTitular: '',
    aliasMetodo: '',
  });
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const [createTransactionError, setCreateTransactionError] = useState<string | null>(null);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
  const [addPaymentMethodError, setAddPaymentMethodError] = useState<string | null>(null);

  const [activeTransaction, setActiveTransaction] = useState<Transaccion | null>(null);
  const fullScreenFlowStates = ['pendiente', 'aceptada', 'en_proceso_pago', 'en_proceso_confirmacion', 'disputa'];

  const [filterType, setFilterType] = useState<'all' | 'deposito' | 'retiro'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchTransactions();
      fetchPaymentMethods();
    }
  }, [user, token]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionService.getMyTransactions();
      setTransactions(response);

      const foundActiveTransaction = response.find(t => fullScreenFlowStates.includes(t.estado));
      setActiveTransaction(foundActiveTransaction || null);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar transacciones.');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const methods = await paymentMethodService.getMyMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setNewTransactionData(prev => ({ ...prev, metodoPagoVendedorId: methods[0].id }));
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      // Podrías mostrar un error al usuario aquí si es crítico
    }
  };

  const handleCreateTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransactionData(prev => ({
      ...prev,
      [name]: name === 'monto' || name === 'metodoPagoVendedorId' ? parseFloat(value) : value,
    }));
    setCreateTransactionError(null);
  };

  const handleCreateTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTransaction(true);
    setCreateTransactionError(null);

    if (newTransactionData.monto <= 0 || !newTransactionData.metodoPagoVendedorId) {
      setCreateTransactionError('Por favor, ingresa un monto válido y selecciona un método de pago.');
      setCreatingTransaction(false);
      return;
    }

    try {
      await transactionService.create(newTransactionData);
      alert('Solicitud de transacción creada con éxito!');
      setShowCreateTransactionModal(false);
      setNewTransactionData({
        tipoOperacion: 'deposito',
        monto: 0,
        moneda: 'USD',
        metodoPagoVendedorId: paymentMethods.length > 0 ? paymentMethods[0].id : 0,
        opcionComision: 'restar',
      });
      fetchTransactions();
    } catch (err: any) {
      setCreateTransactionError(err.response?.data?.message || 'Error al crear la solicitud de transacción.');
      console.error('Error creating transaction:', err);
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleCancelTransaction = async (transactionId: number) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) { // Reemplazar con modal personalizado
      try {
        await transactionService.cancelTransaction(transactionId);
        alert('Solicitud cancelada con éxito.');
        fetchTransactions();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al cancelar la solicitud.');
        console.error('Error cancelling transaction:', err);
      }
    }
  };

  // --- New Payment Method Handlers ---
  const handleNewPaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPaymentMethodData(prev => ({
      ...prev,
      [name]: value,
    }));
    setAddPaymentMethodError(null);
  };

  const handleAddPaymentMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPaymentMethod(true);
    setAddPaymentMethodError(null);

    // Basic validation for payment method
    if (!newPaymentMethodData.tipoCuenta || !newPaymentMethodData.numeroCuenta || !newPaymentMethodData.nombreTitular) {
      setAddPaymentMethodError('Todos los campos obligatorios deben ser llenados.');
      setAddingPaymentMethod(false);
      return;
    }

    try {
      await paymentMethodService.create(newPaymentMethodData);
      alert('Método de pago añadido con éxito!');
      setShowAddPaymentMethodModal(false);
      setNewPaymentMethodData({ // Reset form
        tipoCuenta: '',
        numeroCuenta: '',
        nombreTitular: '',
        identificacionTitular: '',
        aliasMetodo: '',
      });
      fetchPaymentMethods(); // Refresh payment methods list
    } catch (err: any) {
      setAddPaymentMethodError(err.response?.data?.message || 'Error al añadir método de pago.');
      console.error('Error adding payment method:', err);
    } finally {
      setAddingPaymentMethod(false);
    }
  };

  const formatTransactionState = (state: string) => {
    return state.replace(/_/g, ' ').toUpperCase();
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filterType === 'all' || transaction.tipoOperacion === filterType;
    
    const matchesSearch = searchTerm === '' ||
                          transaction.id.toString().includes(searchTerm) ||
                          transaction.cajero?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.tipoOperacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.moneda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          formatTransactionState(transaction.estado).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Cargando transacciones...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">Error: {error}</div>;

  // --- Renderizado del flujo de transacción activa a pantalla completa ---
  if (activeTransaction && fullScreenFlowStates.includes(activeTransaction.estado)) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-4 z-50">
        {activeTransaction.estado === 'pendiente' ? (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center space-y-6 animate-fade-in-up border border-gray-700">
            <Loader2 className="h-16 w-16 text-yellow-500 mx-auto animate-spin-slow" />
            <h3 className="text-2xl font-bold text-white">Esperando a que un cajero acepte tu solicitud...</h3>
            <p className="text-gray-300">
              ID de Transacción: <span className="font-semibold text-white">#{activeTransaction.id}</span>
            </p>
            <p className="text-gray-300">
              Tipo: <span className="capitalize font-semibold text-white">{activeTransaction.tipoOperacion}</span> | Monto: <span className="font-semibold text-yellow-500">${activeTransaction.monto} {activeTransaction.moneda}</span>
            </p>
            <p className="text-sm text-gray-400">
              Por favor, no cierres esta ventana. Serás redirigido al chat una vez que un cajero acepte tu solicitud.
            </p>
            <button
              onClick={() => handleCancelTransaction(activeTransaction.id)}
              className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 mx-auto mt-6 bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
            >
              <XCircle className="h-5 w-5" />
              <span>Cancelar Solicitud</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-3xl h-[90vh] flex flex-col animate-fade-in-up border border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Transacción Activa: #{activeTransaction.id}</h3>
              <button
                onClick={() => {
                  alert('No puedes salir de la transacción hasta que se complete o se resuelva.');
                }}
                className="text-gray-400 hover:text-gray-200"
                title="No puedes salir de la transacción hasta que se complete o se resuelva."
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <TransactionChat transaction={activeTransaction} onTransactionUpdate={fetchTransactions} /> 
          </div>
        )}
      </div>
    );
  }

  // --- Renderizado del dashboard normal (si no hay transacción activa en flujo completo) ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6  border border-gray-700">
        {/* Header del Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-4 sm:mb-0">Dashboard del Vendedor</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateTransactionModal(true)}
              className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-md hover:shadow-lg"
              disabled={!!activeTransaction}
              title={activeTransaction ? "Ya tienes una transacción activa. Completa o cancela la actual para crear una nueva." : "Crear una nueva solicitud de transacción"}
            >
              <PlusCircle className="h-5 w-5" />
              <span>Crear Solicitud</span>
            </button>
            <button
              onClick={() => setShowAddPaymentMethodModal(true)}
              className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
              title="Añadir un nuevo método de pago"
            >
              <CreditCard className="h-5 w-5" />
              <span>Añadir Método</span>
            </button>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white shadow-md hover:shadow-lg"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <p className="mb-6 text-gray-300">Bienvenido, <span className="font-semibold text-white">{user?.nombreCompleto}</span> (<span className="capitalize">{user?.rol}</span>).</p>

        <div className="bg-gray-700 rounded-lg shadow-inner p-4 sm:p-6">
          <h3 className="text-2xl font-semibold text-white mb-4">Mis Solicitudes de Transacción</h3>
          
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
                onClick={() => setFilterType('deposito')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${filterType === 'deposito' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-500'}`}
              >
                Depósitos
              </button>
              <button
                onClick={() => setFilterType('retiro')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${filterType === 'retiro' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-500'}`}
              >
                Retiros
              </button>
            </div>
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar por ID, Cajero, Tipo, Moneda..."
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
              <p className="text-lg">No tienes solicitudes de transacción aún.</p>
              <p className="text-sm mt-2">Haz clic en "Crear Solicitud" para empezar.</p>
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
                      Cajero Asignado
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
                        {transaction.cajero?.nombreCompleto || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {/* Botón para cancelar (si está pendiente) */}
                          {transaction.estado === 'pendiente' && (
                            <button
                              onClick={() => handleCancelTransaction(transaction.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Cancelar
                            </button>
                          )}
                          {/* Botón de Chat para transacciones en estados de conversación */}
                          {(transaction.estado === 'aceptada' || 
                            transaction.estado === 'en_proceso_pago' || 
                            transaction.estado === 'en_proceso_confirmacion' ||
                            transaction.estado === 'disputa') && (
                            <button
                              onClick={() => { /* No usar handleOpenChat aquí, el chat se abre automáticamente en el flujo completo */ }}
                              disabled={true} // Deshabilitar si ya está en flujo completo
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors opacity-50 cursor-not-allowed"
                              title="El chat se abre automáticamente en el flujo de la transacción activa."
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

        {/* Modal para Crear Nueva Solicitud */}
        {showCreateTransactionModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up border border-gray-700 text-gray-100">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                <h3 className="text-xl font-semibold text-white">Crear Nueva Solicitud</h3>
                <button onClick={() => setShowCreateTransactionModal(false)} className="text-gray-400 hover:text-gray-200">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleCreateTransactionSubmit} className="space-y-4">
                <div>
                  <label htmlFor="tipoOperacion" className="block text-sm font-medium text-gray-300">Tipo de Operación</label>
                  <select
                    id="tipoOperacion"
                    name="tipoOperacion"
                    value={newTransactionData.tipoOperacion}
                    onChange={handleCreateTransactionChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    required
                  >
                    <option value="deposito">Depósito</option>
                    <option value="retiro">Retiro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="monto" className="block text-sm font-medium text-gray-300">Monto</label>
                  <input
                    id="monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    value={newTransactionData.monto === 0 ? '' : newTransactionData.monto}
                    onChange={handleCreateTransactionChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="Ej: 100.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="moneda" className="block text-sm font-medium text-gray-300">Moneda</label>
                  <select
                    id="moneda"
                    name="moneda"
                    value={newTransactionData.moneda}
                    onChange={handleCreateTransactionChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="VES">VES</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="metodoPagoVendedorId" className="block text-sm font-medium text-gray-300">Método de Pago</label>
                  {paymentMethods.length > 0 ? (
                    <select
                      id="metodoPagoVendedorId"
                      name="metodoPagoVendedorId"
                      value={newTransactionData.metodoPagoVendedorId}
                      onChange={handleCreateTransactionChange}
                      className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      required
                    >
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.aliasMetodo} ({method.tipoCuenta} - {method.numeroCuenta.slice(-4)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-red-400 mt-1">No tienes métodos de pago registrados. Por favor, añade uno primero.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="opcionComision" className="block text-sm font-medium text-gray-300">Opción de Comisión</label>
                  <select
                    id="opcionComision"
                    name="opcionComision"
                    value={newTransactionData.opcionComision}
                    onChange={handleCreateTransactionChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    required
                  >
                    <option value="restar">Restar de mi monto</option>
                    <option value="agregar">Agregar a mi monto</option>
                  </select>
                </div>

                {createTransactionError && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded-lg text-red-300 text-sm">
                    {createTransactionError}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateTransactionModal(false)}
                    className="px-4 py-2 rounded-md font-medium transition-all duration-200 bg-gray-600 hover:bg-gray-500 text-white shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTransaction || paymentMethods.length === 0}
                    className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingTransaction ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span>Creando...</span>
                      </>
                    ) : (
                      <span>Enviar Solicitud</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para Añadir Método de Pago */}
        {showAddPaymentMethodModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up border border-gray-700 text-gray-100">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                <h3 className="text-xl font-semibold text-white">Añadir Nuevo Método de Pago</h3>
                <button onClick={() => setShowAddPaymentMethodModal(false)} className="text-gray-400 hover:text-gray-200">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddPaymentMethodSubmit} className="space-y-4">
                <div>
                  <label htmlFor="tipoCuenta" className="block text-sm font-medium text-gray-300">Tipo de Cuenta</label>
                  <select
                    id="tipoCuenta"
                    name="tipoCuenta"
                    value={newPaymentMethodData.tipoCuenta}
                    onChange={handleNewPaymentMethodChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    required
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="Banco">Banco</option>
                    <option value="PagoMovil">Pago Móvil</option>
                    <option value="Cripto">Cripto</option>
                    {/* Añadir más tipos si es necesario */}
                  </select>
                </div>
                <div>
                  <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-300">Número de Cuenta / Dirección</label>
                  <input
                    id="numeroCuenta"
                    name="numeroCuenta"
                    type="text"
                    value={newPaymentMethodData.numeroCuenta}
                    onChange={handleNewPaymentMethodChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="Número de cuenta o dirección de cripto"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="nombreTitular" className="block text-sm font-medium text-gray-300">Nombre del Titular</label>
                  <input
                    id="nombreTitular"
                    name="nombreTitular"
                    type="text"
                    value={newPaymentMethodData.nombreTitular}
                    onChange={handleNewPaymentMethodChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="Nombre completo del titular"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="identificacionTitular" className="block text-sm font-medium text-gray-300">Identificación del Titular (Opcional)</label>
                  <input
                    id="identificacionTitular"
                    name="identificacionTitular"
                    type="text"
                    value={newPaymentMethodData.identificacionTitular}
                    onChange={handleNewPaymentMethodChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="Cédula, Pasaporte, etc."
                  />
                </div>
                <div>
                  <label htmlFor="aliasMetodo" className="block text-sm font-medium text-gray-300">Alias del Método (Ej: Mi Banco Principal)</label>
                  <input
                    id="aliasMetodo"
                    name="aliasMetodo"
                    type="text"
                    value={newPaymentMethodData.aliasMetodo}
                    onChange={handleNewPaymentMethodChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="Un nombre para identificar este método"
                  />
                </div>

                {addPaymentMethodError && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded-lg text-red-300 text-sm">
                    {addPaymentMethodError}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentMethodModal(false)}
                    className="px-4 py-2 rounded-md font-medium transition-all duration-200 bg-gray-600 hover:bg-gray-500 text-white shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingPaymentMethod}
                    className="px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingPaymentMethod ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Añadiendo...</span>
                      </>
                    ) : (
                      <span>Guardar Método</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
