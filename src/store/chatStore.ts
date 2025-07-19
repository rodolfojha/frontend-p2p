import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import type { MensajeChat } from '../types/api';

// Crear SockJS mock para evitar problemas de importación
const createSockJS = (url: string) => {
  return new WebSocket(url);
};

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
    const { stompClient, isConnected } = get();
    if (stompClient && isConnected) return;

    set({ isConnecting: true, error: null });

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP:', str);
      },
      onConnect: () => {
        console.log('✅ WebSocket conectado');
        set({ 
          stompClient: client, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        });
      },
      onStompError: (frame) => {
        console.error('❌ Error STOMP:', frame);
        set({ 
          isConnected: false, 
          isConnecting: false, 
          error: 'Error de conexión WebSocket' 
        });
      },
      onWebSocketClose: () => {
        console.log('🔌 WebSocket desconectado');
        set({ 
          isConnected: false, 
          isConnecting: false 
        });
      },
      onWebSocketError: (error) => {
        console.error('❌ Error WebSocket:', error);
        set({ 
          isConnected: false, 
          isConnecting: false, 
          error: 'Error de conexión' 
        });
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
    
    if (stompClient) {
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
  },

  sendMessage: (transaccionId: number, contenido: string) => {
    const { stompClient, isConnected } = get();
    
    if (!stompClient || !isConnected) {
      console.error('❌ WebSocket no conectado');
      set({ error: 'WebSocket no conectado' });
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
      set({ error: 'Error enviando mensaje' });
    }
  },

  subscribeToChat: (transaccionId: number) => {
    const { stompClient, isConnected, subscriptions } = get();
    
    if (!stompClient || !isConnected) {
      console.error('❌ WebSocket no conectado para suscripción');
      return;
    }

    // Si ya está suscrito, no volver a suscribir
    if (subscriptions.has(transaccionId)) {
      console.log(`ℹ️ Ya suscrito al chat de transacción ${transaccionId}`);
      return;
    }

    const subscription = stompClient.subscribe(`/topic/chat/${transaccionId}`, (message) => {
      try {
        const chatMessage: MensajeChat = JSON.parse(message.body);
        
        // Agregar timestamp si no existe
        if (!chatMessage.timestamp) {
          chatMessage.timestamp = new Date().toLocaleTimeString();
        }
        
        set((state) => ({
          messages: {
            ...state.messages,
            [transaccionId]: [
              ...(state.messages[transaccionId] || []),
              chatMessage,
            ],
          },
        }));
        
        console.log(`📨 Nuevo mensaje en chat ${transaccionId}:`, chatMessage);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    // Guardar la suscripción
    const newSubscriptions = new Map(subscriptions);
    newSubscriptions.set(transaccionId, subscription);
    set({ subscriptions: newSubscriptions });

    console.log(`✅ Suscrito al chat de transacción ${transaccionId}`);
  },

  unsubscribeFromChat: (transaccionId: number) => {
    const { subscriptions } = get();
    const subscription = subscriptions.get(transaccionId);
    
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
      
      const newSubscriptions = new Map(subscriptions);
      newSubscriptions.delete(transaccionId);
      set({ subscriptions: newSubscriptions });
      
      console.log(`🔌 Desuscrito del chat de transacción ${transaccionId}`);
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