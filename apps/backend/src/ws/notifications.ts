import type { IncomingMessage } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../db/config';

type JwtPayload = { sub: string; email?: string; id_user?: string; [k: string]: any };

interface AuthenticatedWebSocket extends WebSocket {
  user?: { id: string; email?: string };
  isAlive?: boolean;
  lastPing?: number;
  close(code?: number, reason?: string): void;
  send(data: string): void;
  on(event: string, listener: (...args: any[]) => void): this;
}

// Connection management
const connections = new Map<string, AuthenticatedWebSocket[]>();
const MAX_CONNECTIONS_PER_USER = 2; // Уменьшаем до 2 соединений на пользователя
const MAX_TOTAL_CONNECTIONS = 100; // Максимум 100 соединений всего
const PING_INTERVAL = 30000; // 30 seconds
const PONG_TIMEOUT = 30000; // 30 seconds

export function attachNotificationsWSS(server: import('http').Server) {
  const wss = new WebSocketServer({ 
    noServer: true,
    maxPayload: 1024 * 1024, // 1MB max payload
    perMessageDeflate: false // Disable compression to reduce CPU usage
  });

  // Ping/pong heartbeat to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch {}
    });
  }, PING_INTERVAL);

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(pingInterval);
    connections.clear();
  });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    if (url.pathname !== '/notifications') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws: AuthenticatedWebSocket) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    try {
      console.log('[WebSocket] New connection attempt');
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      console.log('[WebSocket] URL:', req.url);
      console.log('[WebSocket] Headers:', req.headers);
      const token = url.searchParams.get('token');
      console.log('[WebSocket] Token:'REDACTED_SECRET'present' : 'missing');
      if (!token) {
        console.log('[WebSocket] No token provided, closing connection');
        ws.close(4001, 'token_required');
        return;
      }

      let payload: JwtPayload;
      try {
        console.log('[WebSocket] Verifying JWT token...');
        payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
        console.log('[WebSocket] JWT token verified successfully, user:', payload.sub || payload.id_user);
      } catch (error) {
        console.log('[WebSocket] JWT token verification failed:', error);
        ws.close(4003, 'invalid_token');
        return;
      }

      const userId = payload.sub || payload.id_user;
      if (!userId) {
        ws.close(4003, 'invalid_token');
        return;
      }

      // Check total connection limits
      const totalConnections = Array.from(connections.values()).reduce((sum, conns) => sum + conns.length, 0);
      if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
        console.log(`[WebSocket] Server exceeded max total connections (${totalConnections}/${MAX_TOTAL_CONNECTIONS}), rejecting new connection`);
        ws.close(1008, 'server_overloaded');
        return;
      }

      // Check connection limits per user
      const userConnections = connections.get(userId) || [];
      if (userConnections.length >= MAX_CONNECTIONS_PER_USER) {
        console.log(`[WebSocket] User ${userId} exceeded max connections (${userConnections.length}/${MAX_CONNECTIONS_PER_USER}), closing oldest connection`);
        
        // Закрываем самое старое соединение
        const oldestConnection = userConnections[0];
        if (oldestConnection) {
          try {
            oldestConnection.close(1008, 'too_many_connections');
          } catch (error) {
            console.warn(`[WebSocket] Error closing oldest connection for user ${userId}:`, error);
          }
          // Удаляем из списка
          userConnections.splice(0, 1);
        }
      }

      ws.user = { id: userId, email: payload.email };
      ws.isAlive = true;
      userConnections.push(ws);
      connections.set(userId, userConnections);

      console.log(`[WebSocket] User ${userId} connected (${userConnections.length}/${MAX_CONNECTIONS_PER_USER} connections)`);

      // Send welcome message
      ws.send(JSON.stringify({ 
        type: 'hello', 
        ts: Date.now(), 
        user: ws.user,
        maxConnections: MAX_CONNECTIONS_PER_USER
      }));

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages
      ws.on('message', (raw: WebSocket.Data) => {
        let data: any;
        try { 
          data = JSON.parse(String(raw)); 
        } catch { 
          console.warn('[WebSocket] Invalid JSON message received');
          return; 
        }
        
        if (data?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
      });

      // Handle connection close
      ws.on('close', (code, reason) => {
        console.log(`[WebSocket] User ${userId} disconnected (code: ${code}, reason: ${reason})`);
        removeConnection(userId, ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] User ${userId} error:`, error);
        removeConnection(userId, ws);
      });
    } catch (error) {
      console.error('[WebSocket] Connection setup error:', error);
      try { 
        ws.close(1011, 'internal_error'); 
      } catch {}
    }
  });

  return wss;
}

function removeConnection(userId: string, ws: AuthenticatedWebSocket) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const index = userConnections.indexOf(ws);
    if (index > -1) {
      userConnections.splice(index, 1);
      if (userConnections.length === 0) {
        connections.delete(userId);
      } else {
        connections.set(userId, userConnections);
      }
    }
  }
}

// Функция для принудительного закрытия всех соединений пользователя
export function closeUserConnections(userId: string) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    console.log(`[WebSocket] Force closing ${userConnections.length} connections for user ${userId}`);
    userConnections.forEach(ws => {
      try {
        ws.close(1000, 'Force close by server');
      } catch (error) {
        console.warn(`[WebSocket] Error force closing connection for user ${userId}:`, error);
      }
    });
    connections.delete(userId);
    return userConnections.length;
  }
  return 0;
}

// Функция для получения статистики соединений
export function getWebSocketStats() {
  const totalConnections = Array.from(connections.values()).reduce((sum, conns) => sum + conns.length, 0);
  const uniqueUsers = connections.size;
  
  return {
    totalConnections,
    uniqueUsers,
    maxConnectionsPerUser: MAX_CONNECTIONS_PER_USER,
    maxTotalConnections: MAX_TOTAL_CONNECTIONS,
    connectionsByUser: Array.from(connections.entries()).map(([userId, conns]) => ({
      userId,
      connectionCount: conns.length
    }))
  };
}

// Интерфейс для уведомлений
interface NotificationData {
  type: string;
  title: string;
  message: string;
  metadata?: {
    ticket_id?: string;
    support_message?: string;
    author?: string;
    [key: string]: any;
  };
}

// Функция для отправки уведомления конкретному пользователю
export async function sendNotificationToUser(userId: string, notification: NotificationData): Promise<boolean> {
  try {
    console.log(`[WebSocket] Sending notification to user ${userId}:`, notification);
    
    const userConnections = connections.get(userId);
    if (!userConnections || userConnections.length === 0) {
      console.log(`[WebSocket] No active connections for user ${userId}`);
      return false;
    }
    
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
    
    let sentCount = 0;
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          sentCount++;
          console.log(`[WebSocket] Notification sent to user ${userId} via connection`);
        } catch (error) {
          console.error(`[WebSocket] Failed to send notification to user ${userId}:`, error);
        }
      }
    });
    
    console.log(`[WebSocket] Notification sent to ${sentCount}/${userConnections.length} connections for user ${userId}`);
    return sentCount > 0;
  } catch (error) {
    console.error(`[WebSocket] Error sending notification to user ${userId}:`, error);
    return false;
  }
}

// Функция для отправки уведомления всем подключенным пользователям
export async function broadcastNotification(notification: NotificationData): Promise<number> {
  try {
    console.log(`[WebSocket] Broadcasting notification:`, notification);
    
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
    
    let sentCount = 0;
    connections.forEach((userConnections, userId) => {
      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
            sentCount++;
          } catch (error) {
            console.error(`[WebSocket] Failed to broadcast to user ${userId}:`, error);
          }
        }
      });
    });
    
    console.log(`[WebSocket] Notification broadcasted to ${sentCount} connections`);
    return sentCount;
  } catch (error) {
    console.error(`[WebSocket] Error broadcasting notification:`, error);
    return 0;
  }
}

// ==================== МЕССЕНДЖЕР WEBSOCKET ФУНКЦИИ ====================

// Интерфейс для сообщений мессенджера
interface MessengerMessage {
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

// Функция для отправки сообщения через WebSocket
export async function sendMessengerMessage(
  recipientId: string, 
  message: MessengerMessage
): Promise<boolean> {
  try {
    console.log(`[WebSocket] Sending messenger message to user ${recipientId}:`, message);
    
    const wsMessage = JSON.stringify({
      type: 'messenger',
      data: message,
      timestamp: new Date().toISOString()
    });
    
    const userConnections = connections.get(recipientId);
    if (!userConnections || userConnections.length === 0) {
      console.log(`[WebSocket] No active connections for user ${recipientId}`);
      return false;
    }
    
    let sentCount = 0;
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(wsMessage);
          sentCount++;
          console.log(`[WebSocket] Messenger message sent to user ${recipientId} via connection`);
        } catch (error) {
          console.error(`[WebSocket] Failed to send messenger message to user ${recipientId}:`, error);
        }
      }
    });
    
    console.log(`[WebSocket] Messenger message sent to ${sentCount}/${userConnections.length} connections for user ${recipientId}`);
    return sentCount > 0;
  } catch (error) {
    console.error(`[WebSocket] Error sending messenger message to user ${recipientId}:`, error);
    return false;
  }
}

// Функция для отправки статуса "печатает"
export async function sendTypingStatus(
  recipientId: string,
  conversationId: string,
  senderId: string,
  isTyping: boolean
): Promise<boolean> {
  const message: MessengerMessage = {
    type: 'typing',
    conversation_id: conversationId,
    sender_id: senderId,
    is_typing: isTyping,
    timestamp: new Date().toISOString()
  };

  return sendMessengerMessage(recipientId, message);
}

// Функция для отправки статуса прочтения сообщений
export async function sendReadStatus(
  recipientId: string,
  conversationId: string,
  messageIds: string[],
  readBy: string
): Promise<boolean> {
  const message: MessengerMessage = {
    type: 'read_status',
    conversation_id: conversationId,
    read_by: [readBy],
    timestamp: new Date().toISOString()
  };

  return sendMessengerMessage(recipientId, message);
}

// Функция для отправки обновления беседы
export async function sendConversationUpdate(
  recipientId: string,
  conversationId: string,
  updateType: 'status_changed' | 'notifications_toggled' | 'archived' | 'restored' | 'blocked',
  data?: any
): Promise<boolean> {
  const message: MessengerMessage = {
    type: 'conversation_update',
    conversation_id: conversationId,
    metadata: {
      update_type: updateType,
      ...data
    },
    timestamp: new Date().toISOString()
  };

  return sendMessengerMessage(recipientId, message);
}
