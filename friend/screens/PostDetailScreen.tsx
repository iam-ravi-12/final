import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import postService, { PostResponse, CommentResponse } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import { parseUTCDate } from '../utils/helpers';
import PostMediaAttachment from '../components/PostMediaAttachment';
import { inferMediaType } from '../utils/media';
import { useAppTheme } from '../constants/AppTheme';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        postService.getPostById(Number(postId)),
        postService.getComments(Number(postId)),
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (error: any) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      // Optimistically update UI
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
      });
      
      await postService.toggleLike(post.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to like post');
      // Revert on error
      loadPostData();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !post) return;
    
    try {
      setSubmitting(true);
      const comment = await postService.createComment(post.id, {
        content: newComment.trim(),
      });
      
      setComments([...comments, comment]);
      setPost({
        ...post,
        commentCount: post.commentCount + 1,
      });
      setNewComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.deletePost(post.id);
              setMenuVisible(false);
              Alert.alert('Success', 'Post deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleEditPost = () => {
    if (!post) return;
    setMenuVisible(false);
    router.push(`/edit-post/${post.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = parseUTCDate(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView}>
        {/* Post Card */}
        <View style={[styles.postCard, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <TouchableOpacity
                onPress={() => router.push(`/user/${post.userId}`)}
                activeOpacity={0.7}
              >
                {post.userProfilePicture ? (
                  <Image
                    source={{ uri: post.userProfilePicture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                      {post.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View>
                <Text style={[styles.username, { color: colors.textPrimary }]}>{post.username}</Text>
                <Text style={[styles.profession, { color: colors.textSecondary }]}>{post.userProfession}</Text>
              </View>
            </View>
            
            <View style={styles.postHeaderRight}>
              <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatDate(post.createdAt)}</Text>

                {post.isHelpSection && (
                    <View style={styles.helpBadge}>
                        <Text style={styles.helpBadgeText}>Help</Text>
                        {/*<Text style={styles.helpBadgeText}>*/}
                        {/*    {item.isSolved ? 'Solved' : 'Help'}*/}
                        {/*</Text>*/}
                    </View>
                )}
            </View>

              {user?.id === post.userId && (
                  <TouchableOpacity
                      onPress={() => setMenuVisible(!menuVisible)}
                      style={[styles.menuButton, { backgroundColor: colors.inputBg }]}
                      activeOpacity={0.6}
                  >
                      <View style={styles.dotsContainer}>
                          <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                          <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                          <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                      </View>
                  </TouchableOpacity>
              )}
          </View>

          {/* Menu Modal */}
          {menuVisible && (
            <Modal
              transparent
              visible={menuVisible}
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <Pressable
                style={[styles.menuOverlay, { backgroundColor: colors.overlay }]}
                onPress={() => setMenuVisible(false)}
              >
                <View style={[styles.menuContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleEditPost}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.accent} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit Post</Text>
                  </TouchableOpacity>
                  <View style={[styles.menuDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleDeletePost}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    <Text style={[styles.menuItemText, { color: colors.danger }]}>
                      Delete Post
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          )}

          <Text style={[styles.postContent, { color: colors.textPrimary }]}>{post.content}</Text>
           
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <PostMediaAttachment
              uri={post.mediaUrls[0]}
              mediaStyle={
                inferMediaType(post.mediaUrls[0]) === 'audio'
                  ? styles.postAudio
                  : styles.postImage
              }
            />
          )}

          <View style={[styles.postActions, { borderTopColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={post.isLiked ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.likeCount}</Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.commentCount}</Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={[styles.commentsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
            Comments ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>No comments yet</Text>
              <Text style={[styles.emptyCommentsSubtext, { color: colors.textTertiary }]}>
                Be the first to comment!
              </Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={[styles.commentCard, { borderBottomColor: colors.surfaceBorder }]}>
                <View style={styles.commentHeader}>
                  <TouchableOpacity
                    onPress={() => router.push(`/user/${comment.userId}`)}
                    activeOpacity={0.7}
                  >
                    {comment.userProfilePicture ? (
                      <Image
                        source={{ uri: comment.userProfilePicture }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View style={[styles.commentAvatar, styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.commentAvatarText, { color: colors.textInverse }]}>
                          {comment.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.commentInfo}>
                    <Text style={[styles.commentUsername, { color: colors.textPrimary }]}>{comment.username}</Text>
                    <Text style={[styles.commentTime, { color: colors.textTertiary }]}>
                      {formatDate(comment.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.commentContent, { color: colors.textPrimary }]}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.inputBg, color: colors.inputText }]}
          placeholder="Write a comment..."
          placeholderTextColor={colors.inputPlaceholder}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newComment.trim() || submitting) && styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <View style={[styles.sendIconContainer, { backgroundColor: colors.accent }]}>
              <Ionicons name="send" size={18} color={colors.textInverse} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  profession: {
    fontSize: 14,
    marginTop: 2,
  },
  helpBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  helpBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 16,
  },
  postAudio: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  commentCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentInfo: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 46,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  menuButton: {
    marginLeft: 4,
    padding: 8,
    borderRadius: 16,
    minWidth: 10,
    minHeight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'column',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: 12,
    width: 200,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
  },
});
