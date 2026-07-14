import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconColor?: string;
  borderColor?: string;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Grid of 2 items

export default function StatCard({
  title,
  value,
  icon,
  iconColor,
  borderColor,
}: StatCardProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.cardBg, 
        borderColor: borderColor || colors.cardBorder 
      }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          <Ionicons name={icon as any} size={18} color={iconColor || colors.accent} />
        </View>
      </View>
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
