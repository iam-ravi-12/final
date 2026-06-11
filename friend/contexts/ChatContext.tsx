/**
 * ChatContext.tsx — Global chat state + WebSocket subscriptions
 *
 * Wraps the entire app. Manages:
 *  1. STOMP connection lifecycle (connect on login, disconnect on logout)
 *  2. Conversations list (live-updating)
 *  3. Total unread count (for tab badge)
 *  4. Per-chat message subscriptions (for ChatScreen)
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { StompSubscription } from '@stomp/stompjs';
import socketService from '../services/socketService';
import messageService, {
  ConversationResponse,
  MessageResponse,
} from '../services/messageService';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type NewMessageCallback = (message: MessageResponse) => void;

interface ChatContextType {
  /** Live-updating conversation list (sorted by most recent) */
  conversations: ConversationResponse[];
  /** Sum of all unread counts across conversations */
  totalUnreadCount: number;
  /** Whether the STOMP socket is currently connected */
  isSocketConnected: boolean;
  /** Whether conversations are being loaded from the API */
  isLoadingConversations: boolean;
  /** Reload conversations from the REST API */
  loadConversations: () => Promise<void>;
  /**
   * Register a callback for new messages in a specific chat.
   * Returns an unsubscribe function. Call it on screen unmount.
   */
  onNewMessage: (callback: NewMessageCallback) => () => void;
  /**
   * Mark a conversation as read (locally + API).
   * Updates unread count and conversation state.
   */
  markConversationRead: (userId: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────
  const messageListeners = useRef<Set<NewMessageCallback>>(new Set());
  const messageSub = useRef<StompSubscription | null>(null);
  const conversationSub = useRef<StompSubscription | null>(null);
  const connectionUnsub = useRef<(() => void) | null>(null);

  // ── Compute total unread count whenever conversations change ─────────
  useEffect(() => {
    const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    setTotalUnreadCount(total);
  }, [conversations]);

  // ── Load conversations from REST API ─────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.warn('[ChatContext] Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // ── Handle incoming message via WebSocket ────────────────────────────

  const handleNewMessage = useCallback((msg: MessageResponse) => {
    // 1. Notify all registered per-chat listeners (ChatScreen uses this)
    messageListeners.current.forEach((cb) => {
      try {
        cb(msg);
      } catch (e) {
        console.warn('[ChatContext] Message listener error:', e);
      }
    });
  }, []);

  // ── Handle conversation update via WebSocket ─────────────────────────

  const handleConversationUpdate = useCallback((update: ConversationResponse) => {
    setConversations((prev) => {
      // Find existing conversation for this user
      const idx = prev.findIndex((c) => c.userId === update.userId);
      let updated: ConversationResponse[];

      if (idx >= 0) {
        // Update existing conversation
        updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: update.lastMessage,
          lastMessageTime: update.lastMessageTime,
          unreadCount: update.unreadCount,
        };
      } else {
        // New conversation — add it
        updated = [update, ...prev];
      }

      // Sort by last message time (most recent first)
      updated.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });

      return updated;
    });
  }, []);

  // ── Subscribe to STOMP destinations ──────────────────────────────────

  const setupSubscriptions = useCallback(() => {
    // Clean up any existing subscriptions
    messageSub.current?.unsubscribe();
    conversationSub.current?.unsubscribe();

    // Subscribe to personal message queue
    messageSub.current = socketService.subscribe(
      '/user/queue/messages',
      (stompMsg) => {
        try {
          const message: MessageResponse = JSON.parse(stompMsg.body);
          handleNewMessage(message);
        } catch (e) {
          console.warn('[ChatContext] Failed to parse message:', e);
        }
      },
    );

    // Subscribe to conversation updates
    conversationSub.current = socketService.subscribe(
      '/user/queue/conversations',
      (stompMsg) => {
        try {
          const update: ConversationResponse = JSON.parse(stompMsg.body);
          handleConversationUpdate(update);
        } catch (e) {
          console.warn('[ChatContext] Failed to parse conversation update:', e);
        }
      },
    );

    console.log('[ChatContext] ✅ STOMP subscriptions active');
  }, [handleNewMessage, handleConversationUpdate]);

  // ── Connect / disconnect based on auth state ─────────────────────────

  useEffect(() => {
    if (!user) {
      // Not logged in — disconnect
      socketService.disconnect();
      setConversations([]);
      setTotalUnreadCount(0);
      setIsSocketConnected(false);
      return;
    }

    // User is logged in — connect and load conversations
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Listen for connection state changes
      connectionUnsub.current = socketService.onConnectionChange((connected) => {
        setIsSocketConnected(connected);
        if (connected) {
          // When (re)connected, subscribe and refresh conversations
          setupSubscriptions();
          loadConversations();
        }
      });

      socketService.connect(token);
    };

    connectSocket();
    loadConversations(); // Also load via REST immediately

    return () => {
      // Cleanup on logout or unmount
      messageSub.current?.unsubscribe();
      conversationSub.current?.unsubscribe();
      connectionUnsub.current?.();
      messageSub.current = null;
      conversationSub.current = null;
      connectionUnsub.current = null;
    };
  }, [user?.id]); // Re-run when user changes (login/logout)

  // ── Refresh on app foreground ────────────────────────────────────────

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && user) {
        loadConversations();

        // Reconnect if socket is disconnected
        if (!socketService.isConnected) {
          AsyncStorage.getItem('token').then((token) => {
            if (token) socketService.connect(token);
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [user, loadConversations]);

  // ── Public API ───────────────────────────────────────────────────────

  const onNewMessage = useCallback((callback: NewMessageCallback): (() => void) => {
    messageListeners.current.add(callback);
    return () => {
      messageListeners.current.delete(callback);
    };
  }, []);

  const markConversationRead = useCallback(async (userId: number) => {
    // Optimistically update local state
    setConversations((prev) =>
      prev.map((c) =>
        c.userId === userId ? { ...c, unreadCount: 0 } : c,
      ),
    );

    // Call the API
    try {
      await messageService.markAsRead(userId);
    } catch (error) {
      console.warn('[ChatContext] Failed to mark as read:', error);
      // Reload to get correct state
      loadConversations();
    }
  }, [loadConversations]);

  // ─────────────────────────────────────────────────────────────────────

  return (
    <ChatContext.Provider
      value={{
        conversations,
        totalUnreadCount,
        isSocketConnected,
        isLoadingConversations,
        loadConversations,
        onNewMessage,
        markConversationRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
