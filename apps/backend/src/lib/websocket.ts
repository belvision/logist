import jwt from 'jsonwebtoken';
import { config } from '../db/config';

// Импортируем WebSocket типы с fallback
let WebSocketServerClass: any;
let WebSocketClass: any;
let wsModuleAvailable = false;

try {
  const ws = require('ws');
  WebSocketServerClass = ws.WebSocketServer;
  WebSocketClass = ws.WebSocket;
  wsModuleAvailable = true;
} catch (error) {
  console.warn('[WebSocket] ws module not available, WebSocket functionality disabled');
  WebSocketServerClass = class {};
  WebSocketClass = class {};
  wsModuleAvailable = false;
}

interface AuthenticatedWebSocket {
  userId?: string;
  isAlive?: boolean;
  close(code?: number, reason?: string): void;
  send(data: string): void;
  on(event: string, listener: (...args: any[]) => void): any;
  ping(): void;
  terminate(): void;
  readyState: number;
}

class WebSocketManager {
  private wss: any = null;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor() {
    // Проверяем доступность WebSocket модуля
    if (!wsModuleAvailable) {
      console.warn('[WebSocket] WebSocket module not available, skipping initialization');
      return;
    }
    
    // DISABLED: This creates a duplicate WebSocket server that conflicts with the main one
    // The main WebSocket server is now handled in apps/backend/src/ws/notifications.ts
    console.log('[WebSocket] Duplicate WebSocket server disabled - using main server in notifications.ts');
    // this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    // В режиме разработки полностью отключаем WebSocket сервер
    const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.DISABLE_WEBSOCKET === 'true';
    
    if (isDevelopment) {
      console.log('[WebSocket] Development mode - WebSocket server disabled');
      console.log('[WebSocket] Notifications will work via polling only');
      return;
    }

    try {
      // Создаем WebSocket сервер на порту 5556 (только в продакшене)
      this.wss = new WebSocketServerClass({ 
        port: 5556,
        host: '0.0.0.0',
        path: '/ws/notifications'
      });

      console.log('[WebSocket] Server started successfully on port 5556');

      this.wss.on('connection', (ws: AuthenticatedWebSocket, req: any) => {
        console.log('New WebSocket connection attempt');
        
        // Устанавливаем флаг для ping/pong
        ws.isAlive = true;

        // Получаем токен из query параметров
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
          console.log('WebSocket connection rejected: no token');
          ws.close(1008, 'Authentication token required');
          return;
        }

        try {
          // Проверяем токен
          const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
          ws.userId = decoded.userId || decoded.id_user;
          
          if (!ws.userId) {
            throw new Error('Invalid token: no user ID');
          }

          // Добавляем клиента в список
          if (!this.clients.has(ws.userId)) {
            this.clients.set(ws.userId, []);
          }
          this.clients.get(ws.userId)!.push(ws);

          console.log(`User ${ws.userId} connected to WebSocket notifications`);

          // Отправляем подтверждение подключения
          ws.send(JSON.stringify({
            type: 'connection_established',
            message: 'Connected to notifications',
            timestamp: new Date().toISOString()
          }));

          // Обработчики событий
          ws.on('pong', () => {
            ws.isAlive = true;
          });

          ws.on('close', () => {
            console.log(`User ${ws.userId} disconnected from WebSocket notifications`);
            this.removeClient(ws.userId!, ws);
          });

          ws.on('error', (error: any) => {
            console.error(`WebSocket error for user ${ws.userId}:`, error);
            this.removeClient(ws.userId!, ws);
          });

        } catch (error) {
          console.error('WebSocket authentication error:', error);
          ws.close(1008, 'Invalid authentication token');
        }
      });

      // Настройка ping/pong для поддержания соединения
      const interval = setInterval(() => {
        this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
          if (ws.isAlive === false) {
            console.log('Terminating inactive WebSocket connection');
            return ws.terminate();
          }
          
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000); // Ping каждые 30 секунд

      this.wss.on('close', () => {
        clearInterval(interval);
      });

    } catch (error) {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (isDevelopment) {
        console.warn('[WebSocket] Failed to start WebSocket server in development mode:', error);
        console.warn('[WebSocket] This is normal if port 5556 is already in use or blocked');
        console.warn('[WebSocket] Application will continue without WebSocket notifications');
        console.warn('[WebSocket] Frontend will automatically fallback to polling');
      } else {
        console.error('[WebSocket] Failed to start WebSocket server in production:', error);
        console.error('[WebSocket] This may affect real-time notifications');
      }
      
      // В режиме разработки не прерываем запуск приложения
      if (!isDevelopment) {
        throw error;
      }
    }
  }

  private removeClient(userId: string, ws: AuthenticatedWebSocket) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const index = userClients.indexOf(ws);
      if (index > -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Отправляет уведомление конкретному пользователю
   */
  public sendNotificationToUser(userId: string, notification: any) {
    // Проверяем, что WebSocket сервер запущен
    if (!this.wss) {
      console.log(`[WebSocket] Server not running, skipping notification for user ${userId}`);
      return false;
    }

    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) {
      console.log(`[WebSocket] No clients found for user ${userId}`);
      return false;
    }

    const message = JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocketClass.OPEN) {
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
          this.removeClient(userId, ws);
        }
      } else {
        this.removeClient(userId, ws);
      }
    });

    console.log(`[WebSocket] Sent notification to ${sentCount} clients for user ${userId}`);
    return sentCount > 0;
  }

  /**
   * Отправляет уведомление о новом сообщении от поддержки
   */
  public notifyNewSupportMessage(userId: string, ticketId: string, message?: string) {
    return this.sendNotificationToUser(userId, {
      type: 'support_message',
      ticketId: ticketId,
      message: message || 'Новое сообщение от поддержки',
      action: 'new_support_message'
    });
  }

  /**
   * Отправляет общее уведомление
   */
  public notifyGeneral(userId: string, title: string, message: string, type: string = 'info') {
    return this.sendNotificationToUser(userId, {
      type: 'general',
      title: title,
      message: message,
      notificationType: type,
      action: 'general_notification'
    });
  }

  /**
   * Получает количество активных соединений для пользователя
   */
  public getUserConnectionCount(userId: string): number {
    if (!this.wss) return 0;
    const userClients = this.clients.get(userId);
    return userClients ? userClients.length : 0;
  }

  /**
   * Получает общее количество активных соединений
   */
  public getTotalConnectionCount(): number {
    if (!this.wss) return 0;
    let total = 0;
    this.clients.forEach((clients) => {
      total += clients.length;
    });
    return total;
  }

  /**
   * Проверяет, запущен ли WebSocket сервер
   */
  public isRunning(): boolean {
    return this.wss !== null;
  }

  /**
   * Останавливает WebSocket сервер
   */
  public stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
      console.log('WebSocket server stopped');
    }
  }
}

// Создаем singleton экземпляр
export const websocketManager = new WebSocketManager();

// Экспортируем функции для использования в других модулях
export const sendNotificationToUser = (userId: string, notification: any) => 
  websocketManager.sendNotificationToUser(userId, notification);

export const notifyNewSupportMessage = (userId: string, ticketId: string, message?: string) => 
  websocketManager.notifyNewSupportMessage(userId, ticketId, message);

export const notifyGeneral = (userId: string, title: string, message: string, type?: string) => 
  websocketManager.notifyGeneral(userId, title, message, type);
