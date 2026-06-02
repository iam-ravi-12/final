import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getWebSocketBaseUrl = () => {
  const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  return configuredApiUrl.replace(/\/api\/?$/, '');
};

export const websocketService = {
  subscribeToMessages: (onMessage, onError) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return () => {};
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getWebSocketBaseUrl()}/ws`),
      connectHeaders: {
        Authorization: 'Bearer ' + token
      },
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      client.subscribe('/user/queue/messages', (frame) => {
        try {
          const parsedMessage = JSON.parse(frame.body);
          onMessage(parsedMessage);
        } catch (error) {
          console.error('Failed to parse websocket message', error);
        }
      });
    };

    client.onStompError = (frame) => {
      const details = frame?.headers?.message || 'WebSocket STOMP error';
      onError?.(new Error(details));
    };

    client.onWebSocketError = (event) => {
      onError?.(new Error(event?.message || 'WebSocket connection error'));
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }
};
