import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
import messageService, { MessageResponse } from '../../services/messageService';
import { uploadMedia } from '../../services/mediaUploadService';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { parseUTCDate } from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_MAX_WIDTH = SCREEN_WIDTH * 0.65;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PendingAttachment {
  uri: string;
  mimeType: string;
  mediaType: 'image' | 'video' | 'audio';
  fileName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const otherUserId = Number(userId);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user } = useAuth();
  const { onNewMessage, markConversationRead } = useChat();
  const flatListRef = useRef<FlatList>(null);

  // ── Load messages on mount ──────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const data = await messageService.getMessagesWithUser(otherUserId);
      setMessages(data);
    } catch (error) {
      if (loading) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [otherUserId, loading]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      markConversationRead(otherUserId);
      return () => {};
    }, [otherUserId, loadMessages, markConversationRead]),
  );

  // ── Subscribe to real-time messages via WebSocket ───────────────────
  useEffect(() => {
    const unsubscribe = onNewMessage((msg: MessageResponse) => {
      const isFromOtherUser = msg.senderId === otherUserId;
      const isToOtherUser = msg.receiverId === otherUserId;

      if (isFromOtherUser || isToOtherUser) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (isFromOtherUser) {
          markConversationRead(otherUserId);
        }

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return unsubscribe;
  }, [otherUserId, onNewMessage, markConversationRead]);

  // ── Attachment pickers ──────────────────────────────────────────────

  const pickImage = async () => {
    setShowAttachMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachment({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        mediaType: 'image',
        fileName: asset.fileName || 'photo.jpg',
      });
    }
  };

  const pickVideo = async () => {
    setShowAttachMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachment({
        uri: asset.uri,
        mimeType: asset.mimeType || 'video/mp4',
        mediaType: 'video',
        fileName: asset.fileName || 'video.mp4',
      });
    }
  };

  const pickAudio = async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          mimeType: asset.mimeType || 'audio/mpeg',
          mediaType: 'audio',
          fileName: asset.name || 'audio.mp3',
        });
      }
    } catch (e) {
      console.warn('Audio picker error:', e);
    }
  };

  const takePhoto = async () => {
    setShowAttachMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachment({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        mediaType: 'image',
        fileName: asset.fileName || 'camera_photo.jpg',
      });
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  // ── Send message ────────────────────────────────────────────────────
  const handleSend = async () => {
    const hasText = newMessage.trim().length > 0;
    const hasAttachment = !!attachment;
    if (!hasText && !hasAttachment) return;

    const messageContent = newMessage.trim();
    const currentAttachment = attachment;
    setNewMessage('');
    setAttachment(null);
    setSending(true);

    try {
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;

      // Upload attachment to Cloudinary if present
      if (currentAttachment) {
        setUploadStatus('Uploading...');
        mediaUrl = await uploadMedia(
          currentAttachment.uri,
          currentAttachment.mimeType,
          'chat',
          (status) => setUploadStatus(status),
        );
        mediaType = currentAttachment.mediaType;
        setUploadStatus('');
      }

      const sentMessage = await messageService.sendMessage({
        receiverId: otherUserId,
        content: messageContent || (mediaType ? `📎 ${mediaType}` : ''),
        mediaUrl,
        mediaType,
      });

      // Optimistic update
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageContent);
      if (currentAttachment) setAttachment(currentAttachment);
    } finally {
      setSending(false);
      setUploadStatus('');
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  const formatTime = (timestamp: string) => {
    const date = parseUTCDate(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatTitle = () => {
    if (messages.length === 0) return 'Chat';
    const first = messages[0];
    return first.senderId === user?.id
      ? first.receiverUsername
      : first.senderUsername;
  };

  // ── Render media inside a message bubble ────────────────────────────
  const renderMediaContent = (item: MessageResponse) => {
    if (!item.mediaUrl) return null;

    if (item.mediaType === 'image') {
      return (
        <TouchableOpacity
          onPress={() => setPreviewImage(item.mediaUrl!)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (item.mediaType === 'video') {
      return (
        <Video
          source={{ uri: item.mediaUrl }}
          style={styles.mediaVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />
      );
    }

    if (item.mediaType === 'audio') {
      return <AudioPlayer uri={item.mediaUrl} />;
    }

    // Fallback: generic file link
    return (
      <View style={styles.genericFile}>
        <Ionicons name="document" size={24} color="#007AFF" />
        <Text style={styles.genericFileText}>Attachment</Text>
      </View>
    );
  };

  // ── Render message bubble ───────────────────────────────────────────
  const renderMessage = ({ item }: { item: MessageResponse }) => {
    const isOwnMessage = item.senderId === user?.id;
    const hasMedia = !!item.mediaUrl;
    const hasText = item.content && item.content.length > 0 && !item.content.startsWith('📎');

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
            hasMedia && styles.mediaBubble,
          ]}
        >
          {renderMediaContent(item)}
          {hasText && (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                hasMedia && styles.mediaCaption,
              ]}
            >
              {item.content}
            </Text>
          )}
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ title: getChatTitle() }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>Start the conversation!</Text>
                </View>
              }
            />
          )}

          {/* Upload progress indicator */}
          {uploadStatus ? (
            <View style={styles.uploadBar}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.uploadText}>{uploadStatus}</Text>
            </View>
          ) : null}

          {/* Attachment preview */}
          {attachment && (
            <View style={styles.attachmentPreview}>
              {attachment.mediaType === 'image' ? (
                <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
              ) : attachment.mediaType === 'video' ? (
                <View style={styles.attachmentIconBox}>
                  <Ionicons name="videocam" size={24} color="#007AFF" />
                  <Text style={styles.attachmentLabel}>Video</Text>
                </View>
              ) : (
                <View style={styles.attachmentIconBox}>
                  <Ionicons name="musical-notes" size={24} color="#007AFF" />
                  <Text style={styles.attachmentLabel}>Audio</Text>
                </View>
              )}
              <TouchableOpacity style={styles.attachmentRemove} onPress={removeAttachment}>
                <Ionicons name="close-circle" size={22} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input bar */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowAttachMenu(true)}
              disabled={sending}
            >
              <Ionicons name="add-circle" size={28} color={sending ? '#ccc' : '#007AFF'} />
            </TouchableOpacity>

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
                (!newMessage.trim() && !attachment || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !attachment) || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Attachment picker menu ────────────────────────────────────── */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={styles.attachMenuContainer}>
            <Text style={styles.attachMenuTitle}>Send Attachment</Text>
            <View style={styles.attachMenuGrid}>
              <TouchableOpacity style={styles.attachMenuOption} onPress={pickImage}>
                <View style={[styles.attachMenuIcon, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="image" size={28} color="#4CAF50" />
                </View>
                <Text style={styles.attachMenuLabel}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachMenuOption} onPress={takePhoto}>
                <View style={[styles.attachMenuIcon, { backgroundColor: '#e3f2fd' }]}>
                  <Ionicons name="camera" size={28} color="#2196F3" />
                </View>
                <Text style={styles.attachMenuLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachMenuOption} onPress={pickVideo}>
                <View style={[styles.attachMenuIcon, { backgroundColor: '#fce4ec' }]}>
                  <Ionicons name="videocam" size={28} color="#E91E63" />
                </View>
                <Text style={styles.attachMenuLabel}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachMenuOption} onPress={pickAudio}>
                <View style={[styles.attachMenuIcon, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="musical-notes" size={28} color="#FF9800" />
                </View>
                <Text style={styles.attachMenuLabel}>Audio</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.attachMenuCancel}
              onPress={() => setShowAttachMenu(false)}
            >
              <Text style={styles.attachMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Full-screen image preview ────────────────────────────────── */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.imagePreviewFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio Player mini-component
// ─────────────────────────────────────────────────────────────────────────────

function AudioPlayer({ uri }: { uri: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const togglePlay = async () => {
    try {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis || 0);
              setDuration(status.durationMillis || 0);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
                soundRef.current?.setPositionAsync(0);
              }
            }
          },
        );
        soundRef.current = sound;
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.audioPlayer}>
      <TouchableOpacity onPress={togglePlay} style={styles.audioPlayBtn}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#007AFF" />
      </TouchableOpacity>
      <View style={styles.audioProgress}>
        <View style={styles.audioTrack}>
          <View style={[styles.audioFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.audioDuration}>
          {formatDuration(position)} / {formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
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
  mediaBubble: {
    padding: 4,
    paddingBottom: 8,
    overflow: 'hidden',
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
  mediaCaption: {
    marginTop: 6,
    paddingHorizontal: 8,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
  },

  // ── Media in bubbles ──────────────────────────────────────────────
  mediaImage: {
    width: MEDIA_MAX_WIDTH,
    height: MEDIA_MAX_WIDTH * 0.75,
    borderRadius: 12,
  },
  mediaVideo: {
    width: MEDIA_MAX_WIDTH,
    height: MEDIA_MAX_WIDTH * 0.6,
    borderRadius: 12,
  },
  genericFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  genericFileText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Audio player ──────────────────────────────────────────────────
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 200,
  },
  audioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,122,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  audioProgress: {
    flex: 1,
  },
  audioTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },

  // ── Upload progress ───────────────────────────────────────────────
  uploadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  uploadText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },

  // ── Attachment preview strip ──────────────────────────────────────
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachmentThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  attachmentIconBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  attachmentRemove: {
    marginLeft: 10,
  },

  // ── Input bar ─────────────────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  attachButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4,
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
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // ── Attachment picker menu ────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachMenuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingHorizontal: 20,
  },
  attachMenuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  attachMenuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  attachMenuOption: {
    alignItems: 'center',
    gap: 8,
  },
  attachMenuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachMenuLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  attachMenuCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  attachMenuCancelText: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '500',
  },

  // ── Image preview modal ───────────────────────────────────────────
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imagePreviewFull: {
    width: '100%',
    height: '80%',
  },

  // ── Empty state ───────────────────────────────────────────────────
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
