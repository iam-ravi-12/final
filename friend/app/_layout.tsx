import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'profile-setup';
    const inAppGroup = segments[0] === '(tabs)' || segments[0] === 'create-post' || segments[0] === 'chat' || segments[0] === 'post' || segments[0] === 'edit-profile' || segments[0] === 'follows';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && !user.profileCompleted && segments[0] !== 'profile-setup') {
      // Redirect to profile setup if profile not completed
      router.replace('/profile-setup');
    } else if (user && user.profileCompleted && !inAppGroup) {
      // Redirect to main app if authenticated and profile completed
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, navigationState?.key]);

  if (loading || !navigationState?.key) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="chat/[userId]" options={{ title: 'Chat' }} />
        <Stack.Screen name="follows/[userId]" options={{ title: 'Connections' }} />
        <Stack.Screen name="post/[postId]" options={{ title: 'Post' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
