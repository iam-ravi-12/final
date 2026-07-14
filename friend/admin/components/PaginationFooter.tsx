import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';

interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function PaginationFooter({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: PaginationFooterProps) {
  const { colors } = useAppTheme();

  if (totalPages <= 1) return null;

  return (
    <View style={[styles.container, { borderTopColor: colors.surfaceBorder }]}>
      <TouchableOpacity
        style={[
          styles.button, 
          { 
            backgroundColor: colors.background,
            borderColor: colors.surfaceBorder 
          },
          currentPage === 0 && styles.disabledButton
        ]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || loading}
      >
        <Text style={[
          styles.buttonText, 
          { color: currentPage === 0 ? colors.textTertiary : colors.textPrimary }
        ]}>
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.pageIndicator}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[styles.pageText, { color: colors.textSecondary }]}>
            Page {currentPage + 1} of {totalPages}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button, 
          { 
            backgroundColor: colors.background,
            borderColor: colors.surfaceBorder 
          },
          currentPage === totalPages - 1 && styles.disabledButton
        ]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || loading}
      >
        <Text style={[
          styles.buttonText, 
          { color: currentPage === totalPages - 1 ? colors.textTertiary : colors.textPrimary }
        ]}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1.5,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
