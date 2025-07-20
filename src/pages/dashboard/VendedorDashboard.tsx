import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { TransactionChat } from '../../components/chat/TransactionChat';
import type { Transaccion, MetodoPagoUsuario, CreateTransactionRequest, CreatePaymentMethodRequest } from '../../types/api'; // Import CreatePaymentMethodRequest
import { transactionService, paymentMethodService } from '../../services/api';
import { PlusCircle, XCircle, DollarSign, MessageCircle, Info, CheckCircle, Clock, Loader2, CreditCard } from 'lucide-react'; // Added CreditCard icon

export const VendedorDashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTransactionModal, setShowCreateTransactionModal] = useState(false);
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false); // New state for payment method modal
  const [paymentMethods, setPaymentMethods] = useState<MetodoPagoUsuario[]>([]);
  const [newTransactionData, setNewTransactionData] = useState<CreateTransactionRequest>({
    tipoOperacion: 'deposito',
    monto: 0,
    moneda: 'USD',
    metodoPagoVendedorId: 0,
    opcionComision: 'restar',
  });
  const [newPaymentMethodData, setNewPaymentMethodData] = useState<CreatePaymentMethodRequest>({ // New state for payment method form
    tipoCuenta: '',
    numeroCuenta: '',
    nombreTitular: '',
    identificacionTitular: '',
    aliasMetodo: '',
  });
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const [createTransactionError, setCreateTransactionError] = useState<string | null>(null);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false); // New state for adding payment method loading
  const [addPaymentMethodError, setAddPaymentMethodError] = useState<string | null>(null); // New state for adding payment method error

  const [activeTransaction, setActiveTransaction] = useState<Transaccion | null>(null);
  const fullScreenFlowStates = ['pendiente', 'aceptada', 'en_proceso_pago', 'en_proceso_confirmacion', 'disputa'];

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
    if (window.confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) {
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

  if (loading) return <div className="text-center p-4 text-gray-600">Cargando transacciones...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  // --- Renderizado del flujo de transacción activa a pantalla completa ---
  if (activeTransaction && fullScreenFlowStates.includes(activeTransaction.estado)) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex flex-col items-center justify-center p-4 z-50">
        {activeTransaction.estado === 'pendiente' ? (
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center space-y-6 animate-fade-in-up">
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin-slow" />
            <h3 className="text-2xl font-bold text-gray-800">Esperando a que un cajero acepte tu solicitud...</h3>
            <p className="text-gray-600">
              ID de Transacción: <span className="font-semibold">#{activeTransaction.id}</span>
            </p>
            <p className="text-gray-600">
              Tipo: <span className="capitalize font-semibold">{activeTransaction.tipoOperacion}</span> | Monto: <span className="font-semibold">${activeTransaction.monto} {activeTransaction.moneda}</span>
            </p>
            <p className="text-sm text-gray-500">
              Por favor, no cierres esta ventana. Serás redirigido al chat una vez que un cajero acepte tu solicitud.
            </p>
            <button
              onClick={() => handleCancelTransaction(activeTransaction.id)}
              className="btn-danger flex items-center justify-center space-x-2 mx-auto mt-6"
            >
              <XCircle className="h-5 w-5" />
              <span>Cancelar Solicitud</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-3xl h-[90vh] flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Transacción Activa: #{activeTransaction.id}</h3>
              <button
                onClick={() => {
                  alert('No puedes salir de la transacción hasta que se complete o se resuelva.');
                }}
                className="text-gray-400 hover:text-gray-600"
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
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg min-h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard del Vendedor</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateTransactionModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            disabled={!!activeTransaction}
            title={activeTransaction ? "Ya tienes una transacción activa. Completa o cancela la actual para crear una nueva." : "Crear una nueva solicitud de transacción"}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Crear Solicitud</span>
          </button>
          <button
            onClick={() => setShowAddPaymentMethodModal(true)}
            className="btn-secondary flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            title="Añadir un nuevo método de pago"
          >
            <CreditCard className="h-5 w-5" />
            <span>Añadir Método</span>
          </button>
        </div>
      </div>

      <p className="mb-6 text-gray-700">Bienvenido, <span className="font-semibold">{user?.nombreCompleto}</span> ({user?.rol}).</p>

      <div className="bg-gray-50 rounded-lg shadow-inner p-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Mis Solicitudes de Transacción</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No tienes solicitudes de transacción aún.</p>
            <p className="text-sm mt-2">Haz clic en "Crear Nueva Solicitud" para empezar.</p>
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
                  }`}>{formatTransactionState(transaction.estado)}</span></p>
                  {transaction.cajero && (
                    <p className="text-sm text-gray-700">Cajero Asignado: {transaction.cajero.nombreCompleto}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {/* Botón para cancelar (si está pendiente) */}
                  {transaction.estado === 'pendiente' && (
                    <button
                      onClick={() => handleCancelTransaction(transaction.id)}
                      className="btn-danger flex items-center space-x-1"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Cancelar</span> 
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
                      className="btn-info flex items-center space-x-1 opacity-50 cursor-not-allowed"
                      title="El chat se abre automáticamente en el flujo de la transacción activa."
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat</span>
                    </button>
                  )}
                   {/* Botón para marcar pago iniciado (si aplica para el vendedor) */}
                  {transaction.estado === 'aceptada' && transaction.tipoOperacion === 'deposito' && (
                    <button
                      onClick={() => alert('Esta acción se realiza en el chat de la transacción activa.')} // Placeholder
                      disabled={true}
                      className="btn-warning flex items-center space-x-1 opacity-50 cursor-not-allowed"
                      title="Esta acción se realiza en el chat de la transacción activa."
                    >
                      <span>Marcar Pago Iniciado</span>
                    </button>
                  )}
                  {/* Botón para confirmar recepción (si aplica para el vendedor) */}
                  {transaction.estado === 'en_proceso_pago' && transaction.tipoOperacion === 'retiro' && (
                    <button
                      onClick={() => alert('Esta acción se realiza en el chat de la transacción activa.')} // Placeholder
                      disabled={true}
                      className="btn-success flex items-center space-x-1 opacity-50 cursor-not-allowed"
                      title="Esta acción se realiza en el chat de la transacción activa."
                    >
                      <span>Confirmar Recepción</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal para Crear Nueva Solicitud */}
      {showCreateTransactionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Crear Nueva Solicitud</h3>
              <button onClick={() => setShowCreateTransactionModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTransactionSubmit} className="space-y-4">
              <div>
                <label htmlFor="tipoOperacion" className="block text-sm font-medium text-gray-700">Tipo de Operación</label>
                <select
                  id="tipoOperacion"
                  name="tipoOperacion"
                  value={newTransactionData.tipoOperacion}
                  onChange={handleCreateTransactionChange}
                  className="input-field mt-1"
                  required
                >
                  <option value="deposito">Depósito</option>
                  <option value="retiro">Retiro</option>
                </select>
              </div>
              <div>
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700">Monto</label>
                <input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  value={newTransactionData.monto === 0 ? '' : newTransactionData.monto}
                  onChange={handleCreateTransactionChange}
                  className="input-field mt-1"
                  placeholder="Ej: 100.00"
                  required
                />
              </div>
              <div>
                <label htmlFor="moneda" className="block text-sm font-medium text-gray-700">Moneda</label>
                <select
                  id="moneda"
                  name="moneda"
                  value={newTransactionData.moneda}
                  onChange={handleCreateTransactionChange}
                  className="input-field mt-1"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="VES">VES</option>
                </select>
              </div>
              <div>
                <label htmlFor="metodoPagoVendedorId" className="block text-sm font-medium text-gray-700">Método de Pago</label>
                {paymentMethods.length > 0 ? (
                  <select
                    id="metodoPagoVendedorId"
                    name="metodoPagoVendedorId"
                    value={newTransactionData.metodoPagoVendedorId}
                    onChange={handleCreateTransactionChange}
                    className="input-field mt-1"
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.aliasMetodo} ({method.tipoCuenta} - {method.numeroCuenta.slice(-4)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500 mt-1">No tienes métodos de pago registrados. Por favor, añade uno primero.</p>
                )}
              </div>
              <div>
                <label htmlFor="opcionComision" className="block text-sm font-medium text-gray-700">Opción de Comisión</label>
                <select
                  id="opcionComision"
                  name="opcionComision"
                  value={newTransactionData.opcionComision}
                  onChange={handleCreateTransactionChange}
                  className="input-field mt-1"
                  required
                >
                  <option value="restar">Restar de mi monto</option>
                  <option value="agregar">Agregar a mi monto</option>
                </select>
              </div>

              {createTransactionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createTransactionError}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTransactionModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingTransaction || paymentMethods.length === 0}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingTransaction ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Añadir Nuevo Método de Pago</h3>
              <button onClick={() => setShowAddPaymentMethodModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddPaymentMethodSubmit} className="space-y-4">
              <div>
                <label htmlFor="tipoCuenta" className="block text-sm font-medium text-gray-700">Tipo de Cuenta</label>
                <select
                  id="tipoCuenta"
                  name="tipoCuenta"
                  value={newPaymentMethodData.tipoCuenta}
                  onChange={handleNewPaymentMethodChange}
                  className="input-field mt-1"
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
                <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700">Número de Cuenta / Dirección</label>
                <input
                  id="numeroCuenta"
                  name="numeroCuenta"
                  type="text"
                  value={newPaymentMethodData.numeroCuenta}
                  onChange={handleNewPaymentMethodChange}
                  className="input-field mt-1"
                  placeholder="Número de cuenta o dirección de cripto"
                  required
                />
              </div>
              <div>
                <label htmlFor="nombreTitular" className="block text-sm font-medium text-gray-700">Nombre del Titular</label>
                <input
                  id="nombreTitular"
                  name="nombreTitular"
                  type="text"
                  value={newPaymentMethodData.nombreTitular}
                  onChange={handleNewPaymentMethodChange}
                  className="input-field mt-1"
                  placeholder="Nombre completo del titular"
                  required
                />
              </div>
              <div>
                <label htmlFor="identificacionTitular" className="block text-sm font-medium text-gray-700">Identificación del Titular (Opcional)</label>
                <input
                  id="identificacionTitular"
                  name="identificacionTitular"
                  type="text"
                  value={newPaymentMethodData.identificacionTitular}
                  onChange={handleNewPaymentMethodChange}
                  className="input-field mt-1"
                  placeholder="Cédula, Pasaporte, etc."
                />
              </div>
              <div>
                <label htmlFor="aliasMetodo" className="block text-sm font-medium text-gray-700">Alias del Método (Ej: Mi Banco Principal)</label>
                <input
                  id="aliasMetodo"
                  name="aliasMetodo"
                  type="text"
                  value={newPaymentMethodData.aliasMetodo}
                  onChange={handleNewPaymentMethodChange}
                  className="input-field mt-1"
                  placeholder="Un nombre para identificar este método"
                />
              </div>

              {addPaymentMethodError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {addPaymentMethodError}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentMethodModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingPaymentMethod}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};
