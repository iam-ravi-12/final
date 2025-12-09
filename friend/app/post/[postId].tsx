import { Stack } from 'expo-router';
import PostDetailScreen from '../../screens/PostDetailScreen';

export default function PostDetail() {
  return (
    <>
      <Stack.Screen options={{ title: 'Post', headerShown: true }} />
      <PostDetailScreen />
    </>
  );
}
