import { WS_URL } from './config';

type WSOptions = { 
  url?: string | undefined; 
  onMessage?: (data: any)=>void; 
  onOpen?: ()=>void; 
  onClose?: (e: CloseEvent)=>void; 
  onError?: (e: Event)=>void; 
  token: string; 
};

// Глобальный объект для отслеживания активного соединения
let activeConnection: { ws: WebSocket | null; close: () => void } | null = null;

export function connectNotificationsWS(opts: WSOptions) {
  // Проверяем, отключен ли WebSocket
  if (!WS_URL) {
    return { close: () => {} };
  }

  const url = opts.url || WS_URL;
  let ws: WebSocket | null = null;
  let tries = 0;
  let closedByApp = false;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let pingInterval: NodeJS.Timeout | null = null;
  const MAX_RETRIES = 10;
  const MAX_DELAY = 60000; // 1 minute max delay

  // Закрываем предыдущее соединение, если оно существует
  if (activeConnection) {
    activeConnection.close();
    activeConnection = null;
  }

  const cleanup = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    // Не закрываем соединение в cleanup, только очищаем таймауты
  };

  const open = () => {
    if (closedByApp || tries >= MAX_RETRIES) {
      return;
    }

    // Проверяем доступность бэкенда перед попыткой подключения
    if (tries > 0) {
    }

    // Clean up any existing connection
    if (ws) {
      try {
        ws.close(1000, 'Reconnecting');
      } catch (error) {
        console.warn('[WebSocket] Error closing existing connection:', error);
      }
      ws = null;
    }

    const wsUrl = `${url}?token=${encodeURIComponent(opts.token)}`;
    
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      tries = 0;
      
      // Clear any pending reconnects (but don't close the connection)
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      // Start ping/pong heartbeat
      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
          } catch  {}
        }
      }, 30000); // Ping every 30 seconds
      
      opts.onOpen?.();
    };

    ws.onmessage = (ev) => {
      let data: any;
      try { 
        data = JSON.parse(ev.data as string); 
      } catch { 
        console.warn('[WebSocket] Invalid JSON received:', ev.data);
        return; 
      }
      
      // Handle pong responses
      if (data.type === 'pong') {
        return;
      }
      
      opts.onMessage?.(data);
    };

    ws.onerror = (e) => {
      // WebSocket error event не содержит детальной информации об ошибке
      // Проверяем состояние соединения для более информативного сообщения
      const errorInfo: any = {
        type: e.type,
        readyState: ws?.readyState,
        url: wsUrl
      };
      
      if (ws) {
        errorInfo.readyStateText = ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                                   ws.readyState === WebSocket.OPEN ? 'OPEN' :
                                   ws.readyState === WebSocket.CLOSING ? 'CLOSING' :
                                   ws.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN';
      }
      
      console.error('[WebSocket] Connection error:', errorInfo);
      opts.onError?.(e);
    };

    ws.onclose = (e) => {
      cleanup();
      opts.onClose?.(e);
      
// Don't reconnect if closed by app or if it's a permanent error
const permanentPolicy =
  e.code === 1008 &&
  ['unauthorized', 'token_required'].includes(String(e.reason || '').toLowerCase());

if (closedByApp || permanentPolicy || e.code === 4003) {
  return;
}

      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (closedByApp || tries >= MAX_RETRIES) {
      return;
    }
    
    tries++;
    const delay = Math.min(MAX_DELAY, 1000 * Math.pow(2, Math.min(tries - 1, 6))); // Exponential backoff, max 6 steps
    
    reconnectTimeout = setTimeout(() => {
      open();
    }, delay);
  };

  open();

  const connection = {
    send: (obj: any) => { 
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { 
          ws.send(JSON.stringify(obj)); 
        } catch (error) {
          console.error('[WebSocket] Send failed:', error);
        }
      } else {
        console.warn('[WebSocket] Cannot send: connection not open');
      }
    },
    close: () => { 
      closedByApp = true;
      cleanup();
      if (ws) {
        try { 
          ws.close(1000, 'Closed by application'); 
        } catch {}
        ws = null;
      }
      // Убираем из активных соединений
      if (activeConnection === connection) {
        activeConnection = null;
      }
    }
  };

  // Регистрируем активное соединение
  activeConnection = connection;

  return connection;
}
