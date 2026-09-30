# Messenger WebSocket Error Fixes

## Date: October 9, 2025

## Issues Fixed

### 1. WebSocket Connection Error
**Error:** `[MessengerWebSocket] Error: {}`

**Root Cause:** The WebSocket client was trying to connect using `window.location.host` (frontend URL like `localhost:3000`) instead of the backend WebSocket server URL (`localhost:5555`).

**Solution:**
- Updated `messengerWebSocket.ts` to use the correct backend URL in development mode
- Added proper environment detection to use `ws://localhost:5555` in development
- In production, it correctly uses the current host with `wss://` protocol

**Changes Made:**
```typescript
// Before
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
};

// After
const getWebSocketUrl = () => {
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
```

### 2. Enhanced Error Logging
**Problem:** WebSocket errors were not providing enough information for debugging.

**Solution:**
- Added detailed error logging with connection state information
- Now logs: error type, target, readyState, and attempted URL

**Changes Made:**
```typescript
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
```

### 3. TypeScript Type Safety Fix
**Error:** `Argument of type 'string | undefined' is not assignable to parameter of type 'string'`

**Root Cause:** The `message.read_by[0]` could potentially be undefined.

**Solution:**
- Added proper null/undefined checks before accessing array elements
- Ensures type safety without using non-null assertions

**Changes Made:**
```typescript
// Before
case 'read_status':
  this.handlers.onReadStatus?.(
    message.conversation_id,
    [],
    message.read_by![0]
  );
  break;

// After
case 'read_status':
  if (message.read_by && message.read_by.length > 0 && message.read_by[0]) {
    this.handlers.onReadStatus?.(
      message.conversation_id,
      [],
      message.read_by[0]
    );
  }
  break;
```

### 4. ConversationList Undefined Error
**Error:** `Cannot read properties of undefined (reading 'filter')`

**Root Cause:** The `conversations` state could become undefined if the API call failed or returned an unexpected structure.

**Solution:**
- Added fallback to empty array in the `loadConversations` function
- Added defensive programming in the filter operation
- Ensured state is always an array, even on error

**Changes Made:**
```typescript
// In loadConversations
const response = await messengerApi.getConversations();
setConversations(response.conversations || []);
setUnreadTotal(response.unread_total || 0);

// In catch block
catch (error) {
  console.error('Failed to load conversations:', error);
  setConversations([]);
  setUnreadTotal(0);
}

// In filter operation
const filteredConversations = (conversations || []).filter(conv => {
  // ... filter logic
});
```

## Files Modified

1. `/apps/frontend/src/shared/lib/messengerWebSocket.ts`
   - Fixed WebSocket URL configuration
   - Enhanced error logging
   - Fixed TypeScript type safety issues

2. `/apps/frontend/src/components/messenger/ConversationList.tsx`
   - Added defensive programming for undefined conversations
   - Ensured state is always an array

## Testing Recommendations

1. **Development Environment:**
   - Verify WebSocket connects to `ws://localhost:5555/notifications`
   - Check browser console for successful connection messages
   - Test sending and receiving messages

2. **Production Environment:**
   - Verify WebSocket connects to `wss://logistgo.pro/ws/notifications`
   - Test through nginx proxy
   - Verify SSL/TLS certificate handling

3. **Error Scenarios:**
   - Test with backend server offline
   - Test with invalid authentication token
   - Test network disconnection/reconnection
   - Test with empty conversation list

## Configuration Files

The following configuration is used:

**Development (`env.local`):**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5555
NEXT_PUBLIC_WS_URL=ws://localhost:5555/notifications
```

**Backend WebSocket Endpoint:**
- Path: `/notifications`
- Authentication: JWT token via query parameter
- Protocol: WebSocket (ws:// in dev, wss:// in prod)

## Next Steps

1. Monitor WebSocket connections in production
2. Implement reconnection strategy testing
3. Add metrics for connection success/failure rates
4. Consider implementing WebSocket heartbeat monitoring
5. Add user-facing connection status indicator

## Notes

- All changes maintain backward compatibility
- No breaking changes to the API
- Enhanced error handling improves debugging
- Type safety improvements prevent runtime errors

