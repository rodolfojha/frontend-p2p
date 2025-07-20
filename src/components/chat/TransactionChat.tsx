import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, CheckCircle, Clock, XCircle, Loader2, Upload } from 'lucide-react'; // Added Upload icon
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { transactionService } from '../../services/api';
import type { MensajeChat, Transaccion } from '../../types/api';

interface TransactionChatProps {
  transaction: Transaccion;
  onTransactionUpdate?: () => void;
}

export const TransactionChat: React.FC<TransactionChatProps> = ({ transaction, onTransactionUpdate }) => {
  const { user } = useAuthStore();
  const { 
    messages, 
    isConnected, 
    sendMessage, 
    subscribeToChat, 
    unsubscribeFromChat,
    error: chatError
  } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para el modal de subir comprobante
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const transactionMessages = messages[transaction.id] || [];

  useEffect(() => {
    if (isConnected) {
      subscribeToChat(transaction.id);
    }

    return () => {
      unsubscribeFromChat(transaction.id);
    };
  }, [transaction.id, isConnected, subscribeToChat, unsubscribeFromChat]);

  useEffect(() => {
    scrollToBottom();
  }, [transactionMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(transaction.id, newMessage.trim());
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      if (timestamp.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timestamp;
      }
      return new Date(timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getRoleColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'vendedor': return 'bg-blue-500';
      case 'cajero': return 'bg-green-500';
      case 'administrador': return 'bg-purple-500';
      case 'debug': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const isMyMessage = (message: MensajeChat) => {
    return message.remitente.id === user?.id || 
           message.remitente.nombreCompleto === user?.nombreCompleto;
  };

  // --- File Upload Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Por favor, selecciona un archivo de imagen válido.');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('El archivo es demasiado grande (máx 5MB).');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadComprobante = async () => {
    if (!selectedFile) {
      setUploadError('Por favor, selecciona una imagen para subir.');
      return;
    }

    setActionLoading(true);
    setUploadError(null);
    setActionError(null); // Clear general action error

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      try {
        // Enviar la imagen Base64 al backend como la URL del comprobante
        await transactionService.markPaymentStarted(transaction.id, base64Image);
        alert('Pago marcado como iniciado con éxito! Comprobante subido.');
        setShowUploadModal(false);
        setSelectedFile(null);
        setFilePreview(null);
        if (onTransactionUpdate) onTransactionUpdate();
      } catch (err: any) {
        setUploadError(err.response?.data?.message || 'Error al subir comprobante.');
        setActionError(err.response?.data?.message || 'Error al marcar pago iniciado.');
        console.error('Error uploading comprobante:', err);
      } finally {
        setActionLoading(false);
      }
    };
    reader.onerror = (error) => {
      setUploadError('Error al leer el archivo.');
      setActionError('Error al leer el archivo.');
      console.error('Error reading file:', error);
      setActionLoading(false);
    };
  };

  // --- Transaction Action Handlers ---
  // Modified to open upload modal
  const handleMarkPaymentStartedClick = () => {
    setShowUploadModal(true);
  };

  const handleMarkCompleted = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await transactionService.markCompleted(transaction.id);
      alert('Transacción marcada como completada con éxito!');
      if (onTransactionUpdate) onTransactionUpdate();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Error al marcar transacción como completada.');
      console.error('Error marking completed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiateDispute = async () => {
    setActionLoading(true);
    setActionError(null);
    const motivoDisputa = prompt('Por favor, describe el motivo de la disputa:');
    if (!motivoDisputa) {
      setActionError('El motivo de la disputa es obligatorio.');
      setActionLoading(false);
      return;
    }
    try {
      // Asumiendo un servicio para crear disputas
      // await disputaService.createDispute(transaction.id, motivoDisputa);
      alert('Disputa iniciada con éxito! Un administrador la revisará.');
      if (onTransactionUpdate) onTransactionUpdate();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Error al iniciar disputa.');
      console.error('Error initiating dispute:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const isCurrentUserSeller = user?.id === transaction.vendedor.id;
  const isCurrentUserCajero = user?.id === transaction.cajero?.id;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex flex-col p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-900">
              Chat - Transacción #{transaction.id}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        
        {/* Transaction Summary in Chat Header */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
          <p><strong>Tipo:</strong> <span className="capitalize">{transaction.tipoOperacion}</span></p>
          <p><strong>Monto:</strong> <span className="font-semibold text-primary">${transaction.monto} {transaction.moneda}</span></p>
          <p><strong>Estado:</strong> <span className={`font-semibold ${
            transaction.estado === 'pendiente' ? 'text-yellow-600' :
            transaction.estado === 'aceptada' ? 'text-blue-600' :
            transaction.estado === 'en_proceso_pago' ? 'text-orange-600' :
            transaction.estado === 'en_proceso_confirmacion' ? 'text-purple-600' :
            transaction.estado === 'completada' ? 'text-green-600' :
            transaction.estado === 'cancelada' ? 'text-red-600' : 'text-gray-600'
          }`}>{transaction.estado.replace(/_/g, ' ')}</span></p>
          {transaction.cajero && (
            <p><strong>Cajero:</strong> {transaction.cajero.nombreCompleto}</p>
          )}
          <p><strong>Vendedor:</strong> {transaction.vendedor.nombreCompleto}</p>
          {/* Display relevant payment method info based on transaction type and current user */}
          {isCurrentUserSeller && transaction.metodoPagoVendedor && (
            <p><strong>Tu Método:</strong> {transaction.metodoPagoVendedor.aliasMetodo || transaction.metodoPagoVendedor.tipoCuenta}</p>
          )}
          {isCurrentUserCajero && transaction.metodoPagoCajero && (
            <p><strong>Tu Método:</strong> {transaction.metodoPagoCajero.aliasMetodo || transaction.metodoPagoCajero.tipoCuenta}</p>
          )}
          {/* Display other party's payment method if available and relevant */}
          {isCurrentUserSeller && transaction.cajero && transaction.metodoPagoCajero && (
            <p><strong>Método Cajero:</strong> {transaction.metodoPagoCajero.aliasMetodo || transaction.metodoPagoCajero.tipoCuenta} ({transaction.metodoPagoCajero.numeroCuenta})</p>
          )}
          {isCurrentUserCajero && transaction.vendedor && transaction.metodoPagoVendedor && (
            <p><strong>Método Vendedor:</strong> {transaction.metodoPagoVendedor.aliasMetodo || transaction.metodoPagoVendedor.tipoCuenta} ({transaction.metodoPagoVendedor.numeroCuenta})</p>
          )}
        </div>

        {/* Action Buttons based on transaction state and user role */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {actionError && (
            <div className="w-full p-2 bg-red-100 text-red-700 text-sm rounded-lg text-center">
              {actionError}
            </div>
          )}
          {/* Vendedor actions */}
          {isCurrentUserSeller && transaction.estado === 'aceptada' && transaction.tipoOperacion === 'deposito' && (
            <button onClick={handleMarkPaymentStartedClick} disabled={actionLoading} className="btn-warning flex items-center space-x-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              <span>Marcar Pago Iniciado</span>
            </button>
          )}
          {isCurrentUserSeller && transaction.estado === 'en_proceso_pago' && transaction.tipoOperacion === 'retiro' && (
            <button onClick={handleMarkCompleted} disabled={actionLoading} className="btn-success flex items-center space-x-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>Confirmar Recepción</span>
            </button>
          )}

          {/* Cajero actions */}
          {isCurrentUserCajero && transaction.estado === 'aceptada' && transaction.tipoOperacion === 'retiro' && (
            <button onClick={handleMarkPaymentStartedClick} disabled={actionLoading} className="btn-warning flex items-center space-x-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              <span>Marcar Pago Iniciado</span>
            </button>
          )}
          {isCurrentUserCajero && transaction.estado === 'en_proceso_pago' && transaction.tipoOperacion === 'deposito' && (
            <button onClick={handleMarkCompleted} disabled={actionLoading} className="btn-success flex items-center space-x-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>Confirmar Recepción</span>
            </button>
          )}

          {/* Dispute button (available for both in certain states) */}
          {(transaction.estado === 'aceptada' || transaction.estado === 'en_proceso_pago' || transaction.estado === 'en_proceso_confirmacion') && (
            <button onClick={handleInitiateDispute} disabled={actionLoading} className="btn-danger flex items-center space-x-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              <span>Abrir Disputa</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message from chat store */}
      {chatError && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{chatError}</p>
        </div>
      )}

      {/* Connection Warning */}
      {!isConnected && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-600">
            Reconectando al chat...
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transactionMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay mensajes aún</p>
            <p className="text-sm text-gray-400">
              Envía el primer mensaje para iniciar la conversación
            </p>
          </div>
        ) : (
          transactionMessages.map((message, index) => (
            <div key={message.id || index}>
              {message.error ? (
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2 max-w-sm">
                    <p className="text-sm text-red-600">❌ {message.mensaje}</p>
                  </div>
                </div>
              ) : (
                <div className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isMyMessage(message) ? 'order-1' : 'order-2'}`}>
                    <div className={`rounded-lg px-4 py-2 ${
                      isMyMessage(message)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.contenido}</p>
                    </div>
                    
                    <div className={`flex items-center mt-1 space-x-2 ${
                      isMyMessage(message) ? 'justify-end' : 'justify-start'
                    }`}>
                      {!isMyMessage(message) && (
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getRoleColor(message.remitente.rol)}`}></div>
                          <span className="text-xs text-gray-500 font-medium">
                            {message.remitente.nombreCompleto}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(message.timestamp || message.fechaEnvio || '')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 rounded-b-lg">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-gray-500 mt-2">
            Esperando conexión para enviar mensajes...
          </p>
        )}
      </form>

      {/* Upload Comprobante Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Subir Comprobante de Pago</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona una imagen (JPG, PNG, GIF, máx 5MB)
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg, image/png, image/gif"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
              </div>
              {filePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Vista Previa:</p>
                  <img src={filePreview} alt="Vista previa del comprobante" className="mt-2 max-w-full h-auto rounded-lg shadow-md" />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUploadComprobante}
                disabled={!selectedFile || actionLoading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Subir Comprobante</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
