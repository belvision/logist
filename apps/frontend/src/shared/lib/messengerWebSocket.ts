import { getAccessToken } from '@/lib/auth/token';

export interface MessengerWebSocketMessage {
  type: 'message' | 'typing' | 'read_status' | 'conversation_update';
  conversation_id: string;
  message_id?: string;
  sender_id?: string;
  content?: string;
  message_type?: 'text' | 'file' | 'image' | 'system';
  metadata?: any;
  timestamp: string;
  is_typing?: boolean;
  read_by?: string[];
}

export interface WebSocketEventHandlers {
  onMessage?: (message: MessengerWebSocketMessage) => void;
  onTyping?: (conversationId: string, senderId: string, isTyping: boolean) => void;
  onReadStatus?: (conversationId: string, messageIds: string[], readBy: string) => void;
  onConversationUpdate?: (conversationId: string, updateType: string, data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Event) => void;
}

class MessengerWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private handlers: WebSocketEventHandlers = {};
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private baseUrl: string) {}

  /**
   * Подключается к WebSocket серверу
   */
  async connect(handlers: WebSocketEventHandlers = {}): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.handlers = handlers;
    this.isConnecting = true;

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const wsUrl = `${this.baseUrl}/notifications?token=${token}`;
      console.log('[MessengerWebSocket] Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[MessengerWebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.handlers.onConnectionChange?.(true);
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[MessengerWebSocket] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[MessengerWebSocket] Disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.handlers.onConnectionChange?.(false);
        this.stopPing();
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[MessengerWebSocket] WebSocket error occurred');
        console.error('[MessengerWebSocket] Error details:', {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget,
          readyState: this.ws?.readyState,
          url: wsUrl
        });
        this.isConnecting = false;
        this.handlers.onError?.(error);
      };

    } catch (error) {
      console.error('[MessengerWebSocket] Connection error:', error);
      this.isConnecting = false;
      this.handlers.onError?.(error as Event);
    }
  }

  /**
   * Отключается от WebSocket сервера
   */
  disconnect(): void {
    this.stopPing();
    this.clearReconnectTimeout();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.handlers.onConnectionChange?.(false);
  }

  /**
   * Проверяет, подключен ли клиент
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Отправляет ping для поддержания соединения
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws?.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping каждые 30 секунд
  }

  /**
   * Останавливает ping
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Планирует переподключение
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[MessengerWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(this.handlers);
    }, delay);
  }

  /**
   * Очищает таймаут переподключения
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Обрабатывает входящие сообщения
   */
  private handleMessage(data: any): void {
    if (data.type === 'pong') {
      return; // Игнорируем pong сообщения
    }

    if (data.type === 'messenger' && data.data) {
      const message: MessengerWebSocketMessage = data.data;
      
      switch (message.type) {
        case 'message':
          this.handlers.onMessage?.(message);
          break;
        case 'typing':
          this.handlers.onTyping?.(
            message.conversation_id,
            message.sender_id!,
            message.is_typing!
          );
          break;
        case 'read_status':
          if (message.read_by && message.read_by.length > 0 && message.read_by[0]) {
            this.handlers.onReadStatus?.(
              message.conversation_id,
              [], // messageIds не передаются в этом типе сообщения
              message.read_by[0]
            );
          }
          break;
        case 'conversation_update':
          this.handlers.onConversationUpdate?.(
            message.conversation_id,
            message.metadata?.update_type,
            message.metadata
          );
          break;
      }
    }
  }

  /**
   * Обновляет обработчики событий
   */
  updateHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }
}

// Создаем singleton экземпляр
const getWebSocketUrl = () => {
  // Используем конфигурацию из переменных окружения
  if (typeof window === 'undefined') {
    return '';
  }
  
  // В режиме разработки используем localhost:5555
  if (process.env.NODE_ENV === 'development') {
    return 'ws://localhost:5555';
  }
  
  // В продакшене используем текущий хост с wss протоколом
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
};

export const messengerWebSocket = new MessengerWebSocketClient(getWebSocketUrl());
