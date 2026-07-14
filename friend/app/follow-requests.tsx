import React from 'react';
import { Stack } from 'expo-router';
import FollowRequestsScreen from '../screens/FollowRequestsScreen';

export default function FollowRequestsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FollowRequestsScreen />
    </>
  );
}
