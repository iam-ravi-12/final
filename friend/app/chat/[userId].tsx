import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import messageService, { MessageResponse } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { parseUTCDate } from '../../utils/helpers';
import websocketService from '../../services/websocketService';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const loadMessages = React.useCallback(async (showError = true) => {
    try {
      const data = await messageService.getMessagesWithUser(Number(userId));
      setMessages(data);

      await messageService.markAsDelivered(Number(userId));
      await messageService.markAsRead(Number(userId));
    } catch (error) {
      if (showError) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadMessages();
    }, [loadMessages])
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const connect = async () => {
      unsubscribe = await websocketService.subscribeToMessages(
        async (incomingMessage) => {
          const otherUserId = Number(userId);
          const isForCurrentConversation =
            incomingMessage.senderId === otherUserId || incomingMessage.receiverId === otherUserId;

          if (!mounted || !isForCurrentConversation) {
            return;
          }

          if (
            incomingMessage.receiverId === user?.id &&
            incomingMessage.senderId === otherUserId &&
            !incomingMessage.isRead
          ) {
            await messageService.markAsDelivered(otherUserId);
            await messageService.markAsRead(otherUserId);
          }

          await loadMessages(false);
        },
        () => {}
      );
    };

    void connect();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [loadMessages, user?.id, userId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await messageService.sendMessage({
        receiverId: Number(userId),
        content: messageContent,
      });
      await loadMessages();
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageContent); // Restore message on failure
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = parseUTCDate(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: MessageResponse }) => {
    const isOwnMessage = item.senderId === user?.id;
    const statusIcon = item.isRead ? '✓✓' : item.isDelivered ? '✓✓' : '✓';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
            {isOwnMessage && (
              <Text
                style={[
                  styles.messageStatus,
                  item.isRead ? styles.readStatus : styles.sentStatus,
                ]}
              >
                {` ${statusIcon}`}
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: messages[0]?.senderUsername || messages[0]?.receiverUsername || 'Chat',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  messageStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  sentStatus: {
    color: '#d1d5db',
  },
  readStatus: {
    color: '#60a5fa',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
