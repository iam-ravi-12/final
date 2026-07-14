import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';
import adminService, { AdminUser } from '../services/adminService';
import AdminHeader from '../components/AdminHeader';
import SearchBar from '../components/SearchBar';
import UserCard from '../components/UserCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import PaginationFooter from '../components/PaginationFooter';
import ConfirmDialog from '../components/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersScreen() {
  const { colors } = useAppTheme();
  const { user: currentAdmin } = useAuth();
  
  // Data State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState<'USER' | 'ADMIN' | undefined>(undefined);
  const [professionFilter, setProfessionFilter] = useState<string | undefined>(undefined);

  // Dialog & Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmBanVisible, setConfirmBanVisible] = useState(false);
  const [confirmUnbanVisible, setConfirmUnbanVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async (pageNum = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = {
        search: searchDebounced || undefined,
        role: roleFilter,
        profession: professionFilter || undefined,
        page: pageNum,
        size: 10,
      };
      const response = await adminService.getUsers(params);
      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchDebounced, roleFilter, professionFilter, page]);

  useEffect(() => {
    fetchUsers(page);
  }, [page, searchDebounced, roleFilter, professionFilter]);

  const onRefresh = () => {
    setPage(0);
    fetchUsers(0, true);
  };

  const handlePageChange = (newPageNum: number) => {
    setPage(newPageNum);
    fetchUsers(newPageNum);
  };

  // Actions
  const handleBanUser = async () => {
    if (!selectedUser) return;
    if (!banReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for banning');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.banUser(selectedUser.id, banReason);
      Alert.alert('Success', 'User banned successfully');
      setBanModalVisible(false);
      setBanReason('');
      fetchUsers(page);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await adminService.unbanUser(selectedUser.id);
      Alert.alert('Success', 'User unbanned successfully');
      setConfirmUnbanVisible(false);
      fetchUsers(page);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to unban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await adminService.deleteUser(selectedUser.id);
      Alert.alert('Success', 'User deleted successfully');
      setConfirmDeleteVisible(false);
      
      // If deleted last item on page, go to previous page
      const newUsersList = users.filter(u => u.id !== selectedUser.id);
      if (newUsersList.length === 0 && page > 0) {
        setPage(page - 1);
      } else {
        fetchUsers(page);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="User Management" subtitle="Manage network users and roles" />
      
      {/* Search and Filters */}
      <SearchBar 
        value={search} 
        onChangeText={setSearch} 
        placeholder="Search by name, username or email..." 
        onClear={() => setSearch('')}
      />
      
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Role Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: roleFilter === undefined ? colors.accentLight : colors.surface, borderColor: colors.surfaceBorder }
            ]}
            onPress={() => { setRoleFilter(undefined); setPage(0); }}
          >
            <Text style={[styles.filterChipText, { color: roleFilter === undefined ? colors.accent : colors.textSecondary }]}>
              All Roles
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: roleFilter === 'USER' ? colors.accentLight : colors.surface, borderColor: colors.surfaceBorder }
            ]}
            onPress={() => { setRoleFilter('USER'); setPage(0); }}
          >
            <Text style={[styles.filterChipText, { color: roleFilter === 'USER' ? colors.accent : colors.textSecondary }]}>
              USER
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: roleFilter === 'ADMIN' ? colors.accentLight : colors.surface, borderColor: colors.surfaceBorder }
            ]}
            onPress={() => { setRoleFilter('ADMIN'); setPage(0); }}
          >
            <Text style={[styles.filterChipText, { color: roleFilter === 'ADMIN' ? colors.accent : colors.textSecondary }]}>
              ADMIN
            </Text>
          </TouchableOpacity>

          {/* Profession Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: professionFilter === undefined ? colors.accentLight : colors.surface, borderColor: colors.surfaceBorder }
            ]}
            onPress={() => { setProfessionFilter(undefined); setPage(0); }}
          >
            <Text style={[styles.filterChipText, { color: professionFilter === undefined ? colors.accent : colors.textSecondary }]}>
              All Professions
            </Text>
          </TouchableOpacity>

          {['Engineer', 'Doctor', 'Student', 'Teacher', 'Designer'].map(prof => (
            <TouchableOpacity
              key={prof}
              style={[
                styles.filterChip,
                { backgroundColor: professionFilter === prof ? colors.accentLight : colors.surface, borderColor: colors.surfaceBorder }
              ]}
              onPress={() => { setProfessionFilter(prof); setPage(0); }}
            >
              <Text style={[styles.filterChipText, { color: professionFilter === prof ? colors.accent : colors.textSecondary }]}>
                {prof}
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
          title="Error Loading Users"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchUsers(page)}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Users Found"
          description="We couldn't find any users matching your criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setRoleFilter(undefined);
            setProfessionFilter(undefined);
            setPage(0);
          }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onViewDetails={() => {
                setSelectedUser(item);
                setDetailsModalVisible(true);
              }}
              onBanUnban={() => {
                setSelectedUser(item);
                if (item.status === 'BANNED') {
                  setConfirmUnbanVisible(true);
                } else {
                  setBanModalVisible(true);
                }
              }}
              onDelete={() => {
                setSelectedUser(item);
                setConfirmDeleteVisible(true);
              }}
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

      {/* Modals & Confirmation Popups */}
      
      {/* 1. Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>User Details</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.detailCard}>
                <View style={styles.detailAvatarContainer}>
                  {selectedUser.profilePicture ? (
                    <Image source={{ uri: selectedUser.profilePicture }} style={styles.largeAvatar} />
                  ) : (
                    <View style={[styles.largeAvatarPlaceholder, { backgroundColor: colors.surface }]}>
                      <Ionicons name="person" size={64} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={[styles.detailName, { color: colors.textPrimary }]}>{selectedUser.name}</Text>
                  <Text style={[styles.detailUsername, { color: colors.textSecondary }]}>@{selectedUser.name?.toLowerCase().replace(/\s/g, '') || 'user'}</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{selectedUser.email}</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Profession</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{selectedUser.profession || 'Not set'}</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary, fontWeight: 'bold' }]}>{selectedUser.role}</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
                  <Text style={[styles.infoValue, { color: selectedUser.status === 'BANNED' ? colors.danger : colors.success, fontWeight: 'bold' }]}>
                    {selectedUser.status}
                  </Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Joined At</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* 2. Ban Reason Modal */}
      <Modal
        transparent
        visible={banModalVisible}
        animationType="fade"
        onRequestClose={() => setBanModalVisible(false)}
      >
        <View style={[styles.dialogOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>Ban User</Text>
            <Text style={[styles.dialogSubtitle, { color: colors.textSecondary }]}>
              Please provide a reason for banning {selectedUser?.name || 'this user'}.
            </Text>
            
            <TextInput
              style={[
                styles.reasonInput, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: colors.surfaceBorder, 
                  color: colors.inputText 
                }
              ]}
              multiline
              numberOfLines={4}
              placeholder="Reason for ban..."
              placeholderTextColor={colors.inputPlaceholder}
              value={banReason}
              onChangeText={setBanReason}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogCancel, { borderColor: colors.surfaceBorder }]}
                onPress={() => { setBanModalVisible(false); setBanReason(''); }}
                disabled={actionLoading}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogConfirm, { backgroundColor: colors.danger }]}
                onPress={handleBanUser}
                disabled={actionLoading}
              >
                <Text style={{ color: colors.textInverse, fontWeight: '600' }}>Ban</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Unban Confirmation */}
      <ConfirmDialog
        visible={confirmUnbanVisible}
        title="Unban User"
        message={`Are you sure you want to unban ${selectedUser?.name}? They will be able to log in to the network again.`}
        confirmText="Unban"
        confirmColor={colors.success}
        onConfirm={handleUnbanUser}
        onCancel={() => setConfirmUnbanVisible(false)}
        loading={actionLoading}
      />

      {/* 4. Delete Confirmation */}
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete User"
        message={`WARNING: Are you sure you want to delete ${selectedUser?.name}? This action is permanent and will completely erase their posts, likes, comments, messages, and alerts.`}
        confirmText="Delete"
        confirmColor={colors.danger}
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDeleteVisible(false)}
        loading={actionLoading}
      />
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
    marginBottom: 8,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  detailCard: {
    borderRadius: 16,
    padding: 20,
  },
  detailAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  largeAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    textAlign: 'right',
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dialogSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancel: {
    borderWidth: 1,
  },
  dialogConfirm: {},
});
