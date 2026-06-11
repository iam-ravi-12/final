/**
 * socketService.ts — Global STOMP WebSocket singleton
 *
 * Provides a SINGLE shared WebSocket connection for the entire app.
 * Connects with JWT token, auto-reconnects with exponential backoff.
 *
 * Usage:
 *   import socketService from '../services/socketService';
 *   socketService.connect(token);
 *   const sub = socketService.subscribe('/user/queue/messages', callback);
 *   sub.unsubscribe();
 *   socketService.disconnect();
 */
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import 'text-encoding'; // TextEncoder/TextDecoder polyfill for React Native

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://final-2-m46t.onrender.com';

/**
 * Build the WebSocket URL from the REST API base.
 * Handles both https → wss and http → ws.
 */
const getWsUrl = (): string => {
  const wsBase = API_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws');
  return `${wsBase}/ws`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Reconnect configuration
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_RECONNECT_DELAY = 2_000;    // 2 seconds
const MAX_RECONNECT_DELAY     = 30_000;   // 30 seconds
const RECONNECT_MULTIPLIER    = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

type ConnectionCallback = (connected: boolean) => void;

class SocketService {
  private client: Client | null = null;
  private token: string | null = null;
  private connected = false;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private connectionListeners: Set<ConnectionCallback> = new Set();

  // ── Connection management ───────────────────────────────────────────────

  /**
   * Connect to the STOMP broker with the given JWT token.
   * If already connected (with the same or different token), disconnects first.
   * This is the ONLY way to create a connection — there is no second instance.
   */
  connect(jwtToken: string): void {
    if (this.connected && this.token === jwtToken && this.client?.connected) {
      console.log('[Socket] Already connected with same token, skipping');
      return;
    }

    // If we have a different token or old connection, disconnect first
    if (this.client) {
      this.disconnect();
    }

    this.token = jwtToken;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;

    const wsUrl = getWsUrl();
    console.log('[Socket] Connecting to:', wsUrl);

    this.client = new Client({
      brokerURL: wsUrl,

      // Pass JWT in the STOMP CONNECT frame headers
      connectHeaders: {
        Authorization: `Bearer ${jwtToken}`,
      },

      // Debug logging (disable in production)
      debug: (msg) => {
        if (__DEV__) {
          // Only log important STOMP frames, not heartbeats
          if (!msg.includes('>>> PING') && !msg.includes('<<< PONG')) {
            console.log('[STOMP]', msg);
          }
        }
      },

      // ── Reconnect with exponential backoff ────────────────────────
      reconnectDelay: this.reconnectDelay,

      onConnect: () => {
        console.log('[Socket] ✅ Connected');
        this.connected = true;
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        this.notifyListeners(true);
      },

      onDisconnect: () => {
        console.log('[Socket] Disconnected');
        this.connected = false;
        this.notifyListeners(false);
      },

      onStompError: (frame) => {
        console.error('[Socket] STOMP error:', frame.headers?.message || frame.body);
        this.connected = false;
        this.notifyListeners(false);
      },

      onWebSocketClose: () => {
        console.log('[Socket] WebSocket closed');
        this.connected = false;
        this.notifyListeners(false);

        // Increase reconnect delay (exponential backoff)
        this.reconnectDelay = Math.min(
          this.reconnectDelay * RECONNECT_MULTIPLIER,
          MAX_RECONNECT_DELAY,
        );
      },

      onWebSocketError: (event) => {
        console.warn('[Socket] WebSocket error:', event);
      },
    });

    this.client.activate();
  }

  /**
   * Gracefully disconnect. Stops reconnection attempts.
   */
  disconnect(): void {
    if (this.client) {
      console.log('[Socket] Disconnecting...');
      this.client.deactivate();
      this.client = null;
    }
    this.connected = false;
    this.token = null;
    this.notifyListeners(false);
  }

  // ── Subscriptions ─────────────────────────────────────────────────────

  /**
   * Subscribe to a STOMP destination.
   *
   * @param destination  e.g. '/user/queue/messages'
   * @param callback     Called for each message received
   * @returns            StompSubscription (call `.unsubscribe()` to clean up)
   */
  subscribe(
    destination: string,
    callback: (message: IMessage) => void,
  ): StompSubscription | null {
    if (!this.client?.connected) {
      console.warn('[Socket] Cannot subscribe: not connected');
      return null;
    }
    return this.client.subscribe(destination, callback);
  }

  /**
   * Send a message to a STOMP destination.
   * (Currently unused — messages are sent via REST API — but available for future use.)
   */
  send(destination: string, body: Record<string, unknown>): void {
    if (!this.client?.connected) {
      console.warn('[Socket] Cannot send: not connected');
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  // ── Status ────────────────────────────────────────────────────────────

  get isConnected(): boolean {
    return this.connected && !!this.client?.connected;
  }

  // ── Connection change listeners ───────────────────────────────────────

  /**
   * Register a listener that fires when connection status changes.
   * Returns an unsubscribe function.
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyListeners(status: boolean): void {
    this.connectionListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.warn('[Socket] Listener error:', e);
      }
    });
  }
}

// Export a SINGLE instance — this is the global shared connection
const socketService = new SocketService();
export default socketService;
