import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { MensajeChat } from '../types/api';

// Determinar la URL base de la API (HTTP/HTTPS)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
// La URL base para el endpoint SockJS (debe ser HTTP/HTTPS)
const SOCKJS_ENDPOINT_BASE_URL = API_BASE_URL.replace(/\/api$/, ''); // Quitar /api para obtener la base http://localhost:8080

// La URL del broker para STOMP (debe ser ws:// o wss://)
const WS_BROKER_URL = SOCKJS_ENDPOINT_BASE_URL.replace(/^http/, 'ws');

interface ChatState {
  stompClient: Client | null;
  isConnected: boolean;
  messages: Record<number, MensajeChat[]>; // Mensajes por transaccionId
  isConnecting: boolean;
  error: string | null;
  subscriptions: Map<number, any>; // Almacenar suscripciones activas
  
  // Actions
  connect: (token: string) => void;
  disconnect: () => void;
  sendMessage: (transaccionId: number, contenido: string) => void;
  subscribeToChat: (transaccionId: number) => void;
  unsubscribeFromChat: (transaccionId: number) => void;
  clearMessages: (transaccionId: number) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  stompClient: null,
  isConnected: false,
  messages: {},
  isConnecting: false,
  error: null,
  subscriptions: new Map(),

  connect: (token: string) => {
    const { stompClient, isConnected, isConnecting } = get();
    // Evitar múltiples intentos de conexión si ya está conectado o conectándose
    if ((stompClient && stompClient.active) || isConnecting) { // Usar stompClient.active para verificar si está activo
      console.log('ℹ️ Ya conectado o conectándose, omitiendo nueva conexión.');
      return;
    }

    set({ isConnecting: true, error: null });

    const client = new Client({
      // brokerURL para @stomp/stompjs debe ser ws:// o wss://
      brokerURL: `${WS_BROKER_URL}/ws`,
      // webSocketFactory para SockJS debe ser http:// o https://
      webSocketFactory: () => new SockJS(`${SOCKJS_ENDPOINT_BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      onConnect: () => {
        console.log('✅ WebSocket conectado');
        set({ 
          stompClient: client, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        });
        // Re-suscribirse a chats activos si los hay (útil en reconexiones)
        get().subscriptions.forEach((_, transId) => {
          get().subscribeToChat(transId);
        });
      },
      onStompError: (frame) => {
        console.error('❌ Error STOMP:', frame);
        set({ 
          isConnected: false, 
          isConnecting: false, 
          error: `Error STOMP: ${frame.headers.message || 'Desconocido'}` 
        });
      },
      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket desconectado:', event);
        set({ 
          isConnected: false, 
          isConnecting: false,
          error: 'Conexión WebSocket cerrada. Reconectando...' 
        });
        // Intentar reconectar automáticamente después de un breve retraso
        setTimeout(() => get().connect(token), 3000); 
      },
      onWebSocketError: (error) => {
        console.error('❌ Error WebSocket:', error);
        set({ 
          isConnected: false, 
          isConnecting: false, 
          error: 'Error de conexión WebSocket. Reconectando...' 
        });
        // Intentar reconectar automáticamente después de un breve retraso
        setTimeout(() => get().connect(token), 3000);
      },
    });

    client.activate();
    set({ stompClient: client });
  },

  disconnect: () => {
    const { stompClient, subscriptions } = get();
    
    // Limpiar todas las suscripciones
    subscriptions.forEach((subscription, transaccionId) => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    
    if (stompClient && stompClient.active) { // Verificar si el cliente está activo antes de desactivar
      stompClient.deactivate();
    }
    
    set({ 
      stompClient: null, 
      isConnected: false, 
      isConnecting: false,
      messages: {},
      error: null,
      subscriptions: new Map()
    });
    console.log('🔌 WebSocket completamente desconectado.');
  },

  sendMessage: (transaccionId: number, contenido: string) => {
    const { stompClient, isConnected } = get();
    
    if (!stompClient || !isConnected || !stompClient.active) { // Añadir verificación de stompClient.active
      console.error('❌ WebSocket no conectado para enviar mensaje.');
      set({ error: 'WebSocket no conectado. No se pudo enviar el mensaje.' });
      return;
    }

    const messageData = { contenido };
    
    try {
      stompClient.publish({
        destination: `/app/chat/${transaccionId}`,
        body: JSON.stringify(messageData),
      });
      console.log(`📤 Mensaje enviado a transacción ${transaccionId}:`, contenido);
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      set({ error: 'Error enviando mensaje.' });
    }
  },

  subscribeToChat: (transaccionId: number) => {
    const { stompClient, isConnected, subscriptions } = get();
    
    if (!stompClient || !isConnected || !stompClient.active) { // Añadir verificación de stompClient.active
      console.error('❌ WebSocket no conectado para suscripción.');
      return;
    }

    // Si ya está suscrito, no volver a suscribir
    if (subscriptions.has(transaccionId)) {
      console.log(`ℹ️ Ya suscrito al chat de transacción ${transaccionId}.`);
      return;
    }

    const subscription = stompClient.subscribe(`/topic/chat/${transaccionId}`, (message) => {
      try {
        const chatMessage: MensajeChat = JSON.parse(message.body);
        
        // Agregar timestamp si no existe
        if (!chatMessage.timestamp) {
          chatMessage.timestamp = new Date().toISOString(); // Usar ISO string para consistencia
        }
        
        set((state) => ({
          messages: {
            ...state.messages,
            [transaccionId]: [
              ...(state.messages[transaccionId] || []),
              chatMessage,
            ].sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()), // Ordenar mensajes por timestamp
          },
        }));
        
        console.log(`📨 Nuevo mensaje en chat ${transaccionId}:`, chatMessage);
      } catch (error) {
        console.error('❌ Error al parsear mensaje del chat:', error);
        set({ error: 'Error al procesar mensaje recibido.' });
      }
    });

    // Guardar la suscripción
    const newSubscriptions = new Map(subscriptions);
    newSubscriptions.set(transaccionId, subscription);
    set({ subscriptions: newSubscriptions });

    console.log(`✅ Suscrito al chat de transacción ${transaccionId}.`);
  },

  unsubscribeFromChat: (transaccionId: number) => {
    const { subscriptions } = get();
    const subscription = subscriptions.get(transaccionId);
    
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
      
      const newSubscriptions = new Map(subscriptions);
      newSubscriptions.delete(transaccionId);
      set({ subscriptions: newSubscriptions });
      
      console.log(`🔌 Desuscrito del chat de transacción ${transaccionId}.`);
    }
  },

  clearMessages: (transaccionId: number) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [transaccionId]: [],
      },
    }));
  },
}));
