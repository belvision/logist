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
    console.log('[WebSocket] WebSocket disabled by configuration');
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
    console.log('[WebSocket] Closing previous connection before creating new one');
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
      console.log('[WebSocket] Max retries reached or connection closed by app');
      return;
    }

    // Проверяем доступность бэкенда перед попыткой подключения
    if (tries > 0) {
      console.log(`[WebSocket] Retry attempt ${tries}/${MAX_RETRIES}`);
    }

    // Clean up any existing connection
    if (ws) {
      console.log('[WebSocket] Closing existing connection before creating new one');
      try {
        ws.close(1000, 'Reconnecting');
      } catch (error) {
        console.warn('[WebSocket] Error closing existing connection:', error);
      }
      ws = null;
    }

    const wsUrl = `${url}?token=${encodeURIComponent(opts.token)}`;
    console.log(`[WebSocket] Attempting connection (attempt ${tries + 1}/${MAX_RETRIES})`);
    
    try {
      ws = new WebSocket(wsUrl);
    } catch (error) {
      console.log('[WebSocket] Failed to create WebSocket, will retry:', error);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      console.log('[WebSocket] Connected successfully');
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
          } catch (error) {
            console.log('[WebSocket] Ping failed, connection may be lost:', error);
          }
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
        console.log('[WebSocket] Pong received');
        return;
      }
      
      opts.onMessage?.(data);
    };

    ws.onerror = (e) => {
      console.error('[WebSocket] Connection error:', e);
      console.error('[WebSocket] URL attempted:', wsUrl);
      console.error('[WebSocket] Error details:', {
        type: e.type,
        target: e.target?.readyState,
        url: wsUrl
      });
      opts.onError?.(e);
    };

    ws.onclose = (e) => {
      console.log(`[WebSocket] Connection closed (code: ${e.code}, reason: ${e.reason})`);
      cleanup();
      opts.onClose?.(e);
      
// Don't reconnect if closed by app or if it's a permanent error
const permanentPolicy =
  e.code === 1008 &&
  ['unauthorized', 'token_required'].includes(String(e.reason || '').toLowerCase());

if (closedByApp || permanentPolicy || e.code === 4003) {
  console.log('[WebSocket] Permanent closure, not reconnecting');
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
    
    console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${tries}/${MAX_RETRIES})`);
    
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
        } catch (error) {
          console.log('[WebSocket] Error closing connection:', error);
        }
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
