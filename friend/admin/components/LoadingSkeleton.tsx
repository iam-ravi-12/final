import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';

interface LoadingSkeletonProps {
  type?: 'card' | 'stat' | 'list';
  count?: number;
}

export default function LoadingSkeleton({
  type = 'card',
  count = 3,
}: LoadingSkeletonProps) {
  const { colors } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const renderSkeletonItem = (index: number) => {
    if (type === 'stat') {
      return (
        <View key={index} style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.row}>
            <Animated.View style={[styles.skeletonTextShort, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonCircleSmall, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
          </View>
          <Animated.View style={[styles.skeletonValue, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
        </View>
      );
    }

    if (type === 'list') {
      return (
        <View key={index} style={[styles.listCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.row}>
            <Animated.View style={[styles.avatarSkeleton, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
            <View style={styles.textColumn}>
              <Animated.View style={[styles.skeletonTextLong, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonTextMedium, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
            </View>
          </View>
        </View>
      );
    }

    // Default 'card' skeleton (UserCard or PostCard)
    return (
      <View key={index} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.avatarSkeleton, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
          <View style={styles.textColumn}>
            <Animated.View style={[styles.skeletonTextLong, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonTextMedium, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
          </View>
        </View>
        <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
          <Animated.View style={[styles.skeletonTextShort, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonButton, { backgroundColor: colors.skeleton, opacity: pulseAnim }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={type === 'stat' ? styles.statsGrid : styles.container}>
      {Array.from({ length: count }).map((_, i) => renderSkeletonItem(i))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textColumn: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  skeletonTextLong: {
    height: 16,
    width: '70%',
    borderRadius: 4,
  },
  skeletonTextMedium: {
    height: 12,
    width: '50%',
    borderRadius: 4,
  },
  skeletonTextShort: {
    height: 12,
    width: '30%',
    borderRadius: 4,
  },
  skeletonValue: {
    height: 24,
    width: '40%',
    borderRadius: 4,
    marginTop: 8,
  },
  skeletonCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  skeletonButton: {
    height: 32,
    width: 80,
    borderRadius: 8,
  },
});
