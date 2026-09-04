/**
 * Realtime WebSocket Service for Yurae Platform
 * Supports bidirectional connection, event subscriptions, automatic reconnect with exponential backoff, and heartbeat.
 */

export type RealtimeEventCallback = (data: any, eventType: string) => void;

class RealtimeService {
  private socket: WebSocket | null = null;
  private channel: 'admin' | 'customer' | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<RealtimeEventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private isExplicitlyClosed = false;

  public connect(channel: 'admin' | 'customer', token: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.channel === channel) {
      return;
    }

    this.channel = channel;
    this.token = token;
    this.isExplicitlyClosed = false;
    this.initSocket();
  }

  private initSocket() {
    if (!this.token) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const endpoint = this.channel === 'admin' ? '/ws/admin' : '/ws/customer';
      const wsUrl = `${protocol}//${host}${endpoint}?token=${encodeURIComponent(this.token)}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('STATUS_CHANGE', { status: 'connected' });
      };

      this.socket.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const payload = JSON.parse(event.data);
          const eventType = payload.event || 'MESSAGE';
          const eventData = payload.data || payload;
          this.emit(eventType, eventData);
        } catch {
          // Non-JSON frame
        }
      };

      this.socket.onerror = () => {
        // Socket error handled by onclose
      };

      this.socket.onclose = (event) => {
        this.stopHeartbeat();
        this.emit('STATUS_CHANGE', { status: 'disconnected', code: event.code });

        if (!this.isExplicitlyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
          this.reconnectAttempts++;
          this.reconnectTimer = setTimeout(() => {
            this.initSocket();
          }, timeout);
        }
      };
    } catch {
      // Failed to initialize socket
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public subscribe(eventType: string, callback: RealtimeEventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscription function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public emit(eventType: string, data: any) {
    // Specific event listeners
    const specificCallbacks = this.listeners.get(eventType);
    if (specificCallbacks) {
      specificCallbacks.forEach((cb) => {
        try {
          cb(data, eventType);
        } catch (e) {
          console.error(`Error in realtime callback for ${eventType}:`, e);
        }
      });
    }

    // Catch-all '*' listeners
    const allCallbacks = this.listeners.get('*');
    if (allCallbacks) {
      allCallbacks.forEach((cb) => {
        try {
          cb(data, eventType);
        } catch (e) {
          console.error(`Error in realtime catch-all callback:`, e);
        }
      });
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const realtimeService = new RealtimeService();
