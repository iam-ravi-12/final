import { Stack } from 'expo-router';
import CommunityPostsScreen from '../../screens/CommunityPostsScreen';

export default function CommunityPostsPage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CommunityPostsScreen />
    </>
  );
}
