import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, IMessage } from '@stomp/stompjs';
import { MessageResponse } from './messageService';

const getWebSocketUrl = () => {
  const configuredApiUrl =
    process.env.EXPO_PUBLIC_API_URL || 'https://final-production-3b39.up.railway.app';
  const baseUrl = configuredApiUrl.replace(/\/api\/?$/, '');
  return baseUrl.replace(/^http/i, 'ws') + '/ws-native';
};

const websocketService = {
  subscribeToMessages: async (
    onMessage: (message: MessageResponse) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return () => {};
    }

    const client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders: {
        Authorization: 'Bearer ' + token,
      },
      reconnectDelay: 5000,
      debug: () => {},
    });

    client.onConnect = () => {
      client.subscribe('/user/queue/messages', (frame: IMessage) => {
        try {
          onMessage(JSON.parse(frame.body));
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('Failed to parse websocket message'));
        }
      });
    };

    client.onStompError = (frame) => {
      const message = frame?.headers?.message || 'WebSocket STOMP error';
      onError?.(new Error(message));
    };

    client.onWebSocketError = (event) => {
      const errorMessage =
        (event as { message?: string } | undefined)?.message || 'WebSocket connection error';
      onError?.(new Error(errorMessage));
    };

    client.activate();

    return () => {
      void client.deactivate();
    };
  },
};

export default websocketService;
