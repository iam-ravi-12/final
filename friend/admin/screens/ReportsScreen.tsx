import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';
import adminService, { AdminReport } from '../services/adminService';
import AdminHeader from '../components/AdminHeader';
import ReportCard from '../components/ReportCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import PaginationFooter from '../components/PaginationFooter';

export default function ReportsScreen() {
  const { colors } = useAppTheme();

  // Data State
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' | undefined>(undefined);

  const fetchReports = useCallback(async (pageNum = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = {
        status: statusFilter,
        page: pageNum,
        size: 10,
      };
      const response = await adminService.getReports(params);
      setReports(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReports(page);
  }, [page, statusFilter]);

  const onRefresh = () => {
    setPage(0);
    fetchReports(0, true);
  };

  const handlePageChange = (newPageNum: number) => {
    setPage(newPageNum);
    fetchReports(newPageNum);
  };

  const handleResolve = async (id: number, adminNotes?: string) => {
    await adminService.resolveReport(id, adminNotes);
    Alert.alert('Success', 'Report has been resolved');
    fetchReports(page);
  };

  const handleDismiss = async (id: number, adminNotes?: string) => {
    await adminService.dismissReport(id, adminNotes);
    Alert.alert('Success', 'Report has been dismissed');
    fetchReports(page);
  };

  const filterOptions: { label: string; value: typeof statusFilter }[] = [
    { label: 'All Reports', value: undefined },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'REVIEWED', value: 'REVIEWED' },
    { label: 'RESOLVED', value: 'RESOLVED' },
    { label: 'DISMISSED', value: 'DISMISSED' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="Reports Management" subtitle="Review reported posts, communities, and users" />
      
      {/* Filter Row */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              style={[
                styles.filterChip,
                { backgroundColor: statusFilter === filter.value ? colors.accentLight : colors.surface, borderColor: colors.surfaceBorder }
              ]}
              onPress={() => { setStatusFilter(filter.value); setPage(0); }}
            >
              <Text style={[styles.filterChipText, { color: statusFilter === filter.value ? colors.accent : colors.textSecondary }]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.listContainer}>
          <LoadingSkeleton type="card" count={3} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Reports"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchReports(page)}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="No Reports Found"
          description="Everything is quiet. No reports meet your filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setStatusFilter(undefined);
            setPage(0);
          }}
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            <PaginationFooter
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  filterRow: {
    marginVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
