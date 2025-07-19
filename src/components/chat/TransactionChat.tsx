import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { MensajeChat } from '../../types/api';

interface TransactionChatProps {
  transactionId: number;
}

export const TransactionChat: React.FC<TransactionChatProps> = ({ transactionId }) => {
  const { user } = useAuthStore();
  const { 
    messages, 
    isConnected, 
    sendMessage, 
    subscribeToChat, 
    unsubscribeFromChat,
    error 
  } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const transactionMessages = messages[transactionId] || [];

  useEffect(() => {
    if (isConnected) {
      subscribeToChat(transactionId);
    }

    return () => {
      unsubscribeFromChat(transactionId);
    };
  }, [transactionId, isConnected, subscribeToChat, unsubscribeFromChat]);

  useEffect(() => {
    scrollToBottom();
  }, [transactionMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(transactionId, newMessage.trim());
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Simular typing indicator
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      // Si es solo tiempo (HH:mm:ss), usar directamente
      if (timestamp.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timestamp;
      }
      // Si es fecha completa, extraer solo la hora
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-gray-900">
            Chat - Transacción #{transactionId}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
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
                // Error message
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2 max-w-sm">
                    <p className="text-sm text-red-600">❌ {message.mensaje}</p>
                  </div>
                </div>
              ) : (
                // Normal message
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
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
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
    </div>
  );
};