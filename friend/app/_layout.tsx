import { Text, TextInput, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AppSplashScreen from '../components/AppSplashScreen';
import FloatingSosButton from '../components/FloatingSosButton';

// Global typography setup for SF Pro Display cross-platform
const defaultFontStyle = {
  fontFamily: Platform.select({
    ios: 'SF Pro Display',
    android: 'SF Pro Display',
    web: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    default: 'SF Pro Display',
  }),
};

if ((Text as any).defaultProps) {
  (Text as any).defaultProps.style = [defaultFontStyle, (Text as any).defaultProps.style];
} else {
  (Text as any).defaultProps = { style: defaultFontStyle };
}

if ((TextInput as any).defaultProps) {
  (TextInput as any).defaultProps.style = [defaultFontStyle, (TextInput as any).defaultProps.style];
} else {
  (TextInput as any).defaultProps = { style: defaultFontStyle };
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Controls whether the in-app splash is visible
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    const inAdminGroup = segments[0] === 'admin';
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'verify-otp' || segments[0] === 'profile-setup';
    const inAppGroup = segments[0] === '(tabs)' || segments[0] === 'create-post' || segments[0] === 'chat' || segments[0] === 'post' || segments[0] === 'edit-profile' || segments[0] === 'follows' || segments[0] === 'follow-requests' || segments[0] === 'community' || segments[0] === 'user';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && user.role === 'ADMIN') {
      if (!inAdminGroup) {
        router.replace('/admin' as any);
      }
    } else if (user && !user.emailVerified && segments[0] !== 'verify-otp') {
      router.replace('/verify-otp');
    } else if (user && user.emailVerified && !user.profileCompleted && segments[0] !== 'profile-setup') {
      router.replace('/profile-setup');
    } else if (user && user.profileCompleted && user.emailVerified && !inAppGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, navigationState?.key]);

  return (
    <>
      {/* In-app splash: shown until auth is resolved AND 2 s have elapsed */}
      {splashVisible && (
        <AppSplashScreen
          ready={!loading && !!navigationState?.key}
          onFinish={() => setSplashVisible(false)}
        />
      )}

      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
          <Stack.Screen name="verify-otp" options={{ title: 'Verify Email' }} />
          <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="chat/[userId]" options={{ title: 'Chat' }} />
          <Stack.Screen name="user/[userId]" options={{ title: 'Profile', headerShown: false }} />
          <Stack.Screen name="follows/[userId]" options={{ title: 'Connections' }} />
          <Stack.Screen name="follow-requests" options={{ headerShown: false }} />
          <Stack.Screen name="community/[communityId]" options={{ headerShown: false }} />
          <Stack.Screen name="post/[postId]" options={{ title: 'Post' }} />
          <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {/* Global floating draggable SOS button – visible for authenticated regular users */}
        {user && user.role !== 'ADMIN' && user.profileCompleted && user.emailVerified && (
          <FloatingSosButton />
        )}
        <StatusBar style="light" />
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ChatProvider>
        <RootNavigator />
      </ChatProvider>
    </AuthProvider>
  );
}


