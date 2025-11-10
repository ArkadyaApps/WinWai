import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform, KeyboardAvoidingView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { User } from '../../src/types';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', tickets: 0, role: 'user', password: '' });

  useEffect(() => { fetchUsers(true); }, []);
  useEffect(() => { const t = setTimeout(() => fetchUsers(true), 400); return () => clearTimeout(t); }, [query, roleFilter]);

  const fetchUsers = async (reset = false) => {
    try {
      if (reset) { setLoading(true); setPage(1); }
      const currentPage = reset ? 1 : page;
      const response = await api.get('/api/admin/users', { params: { page: currentPage, limit: 20, q: query || undefined, role: roleFilter === 'all' ? undefined : roleFilter } });
      const data: User[] = response.data;
      if (reset) setUsers(data); else setUsers((prev) => [...prev, ...data]);
      setHasMore(data.length === 20); setPage(currentPage + 1);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch users');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchUsers(true); };
  const onEndReached = () => { if (!loading && hasMore) fetchUsers(); };

  const handleOpenModal = (user?: User) => { 
    if (user) {
      // Edit mode
      setEditingUser(user); 
      setFormData({ name: user.name, email: user.email, phone: user.phone || '', tickets: user.tickets, role: user.role, password: '' }); 
    } else {
      // Create mode
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', tickets: 0, role: 'user', password: '' });
    }
    setModalVisible(true); 
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) { 
      Alert.alert('Error', 'Please fill in all required fields'); 
      return; 
    }
    
    // Validate password for new users
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/api/admin/users/${editingUser.id}`, formData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        // Create new user
        await api.post('/api/admin/users', formData);
        Alert.alert('Success', 'User created successfully');
      }
      setModalVisible(false);
      fetchUsers(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save user');
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert('Delete User', `Are you sure you want to delete "${user.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/api/admin/users/${user.id}`); Alert.alert('Success', 'User deleted successfully'); fetchUsers(true); } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to delete user'); } } },
    ]);
  };

  if (loading && users.length === 0) {
    return (<View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.colors.primaryGold} /></View>);
  }

  return (
    <View style={styles.container}>
      <AppHeader variant="emerald" logoUri="https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png" onBack={() => router.back()} showDivider />

      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={theme.colors.slate} />
          <TextInput style={styles.searchInput} placeholder="Search name or email" placeholderTextColor="#9AA0A6" value={query} onChangeText={setQuery} autoCapitalize="none" returnKeyType="search" />
          {query.length > 0 && (<TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}><Ionicons name="close-circle" size={18} color="#999" /></TouchableOpacity>)}
        </View>
        <View style={styles.pillsRow}>
          {(['all', 'user', 'admin'] as const).map((r) => (
            <TouchableOpacity key={r} style={[styles.pill, roleFilter === r && styles.pillActive]} onPress={() => setRoleFilter(r)}>
              <Text style={[styles.pillText, roleFilter === r && styles.pillTextActive]}>{r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.createButton} onPress={() => handleOpenModal()}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} onScroll={({ nativeEvent }) => { const { layoutMeasurement, contentOffset, contentSize } = nativeEvent; const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y); if (distanceFromBottom < 200) onEndReached(); }} scrollEventThrottle={200}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}><Text style={styles.userName}>{user.name}</Text><Text style={styles.userEmail}>{user.email}</Text>{user.phone && <Text style={styles.userPhone}>📞 {user.phone}</Text>}</View>
              {user.role === 'admin' && (<View style={styles.adminBadge}><Ionicons name="shield-checkmark" size={14} color={theme.colors.primaryGold} /><Text style={styles.adminText}>ADMIN</Text></View>)}
            </View>
            <View style={styles.userStats}>
              <View style={styles.statBox}><Text style={styles.statValue}>{user.tickets}</Text><Text style={styles.statLabel}>Tickets</Text></View>
              <View style={styles.statBox}><Text style={styles.statValue}>{user.dailyStreak}</Text><Text style={styles.statLabel}>Streak</Text></View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={() => handleOpenModal(user)}><Ionicons name="create-outline" size={20} color="#4ECDC4" /><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(user)}><Ionicons name="trash-outline" size={20} color={theme.colors.danger} /><Text style={styles.deleteButtonText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        {loading && users.length > 0 && (<View style={{ padding: 16 }}><ActivityIndicator color={theme.colors.primaryGold} /></View>)}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Create New User'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="User name" placeholderTextColor="#999" />
              
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} placeholder="Email address" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" editable={!editingUser} />
              
              {!editingUser && (
                <>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.password} 
                    onChangeText={(text) => setFormData({ ...formData, password: text })} 
                    placeholder="Minimum 6 characters" 
                    placeholderTextColor="#999" 
                    secureTextEntry 
                    autoCapitalize="none" 
                  />
                </>
              )}
              
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} placeholder="Phone number" placeholderTextColor="#999" keyboardType="phone-pad" />
              
              <Text style={styles.label}>Tickets</Text>
              <TextInput style={styles.input} value={String(formData.tickets)} onChangeText={(text) => setFormData({ ...formData, tickets: parseInt(text) || 0 })} placeholder="Number of tickets" placeholderTextColor="#999" keyboardType="numeric" />
              
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity style={[styles.roleButton, formData.role === 'user' && styles.roleButtonActive]} onPress={() => setFormData({ ...formData, role: 'user' })}>
                  <Text style={[styles.roleButtonText, formData.role === 'user' && styles.roleButtonTextActive]}>User</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleButton, formData.role === 'admin' && styles.roleButtonActive]} onPress={() => setFormData({ ...formData, role: 'admin' })}>
                  <Text style={[styles.roleButtonText, formData.role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingUser ? 'Update User' : 'Create User'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.cloud },
  filterBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: theme.colors.cloud },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: theme.colors.onyx },
  clearBtn: { padding: 4 },
  pillsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ECEFF1' },
  pillActive: { backgroundColor: theme.colors.emeraldA },
  pillText: { color: theme.colors.onyx, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  content: { padding: 16 },
  userCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: theme.colors.onyx, marginBottom: 4 },
  userEmail: { fontSize: 14, color: theme.colors.slate, marginBottom: 4 },
  userPhone: { fontSize: 13, color: theme.colors.slate },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, height: 24, gap: 4 },
  adminText: { fontSize: 10, fontWeight: '700', color: theme.colors.primaryGold },
  userStats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: theme.colors.cloud, padding: 12, borderRadius: 8, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: theme.colors.onyx },
  statLabel: { fontSize: 12, color: theme.colors.slate, marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E8F8F7', padding: 12, borderRadius: 8 },
  editButtonText: { fontSize: 14, fontWeight: '600', color: '#4ECDC4' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFEAEA', padding: 12, borderRadius: 8 },
  deleteButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onyx },
  formContainer: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.onyx, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, color: theme.colors.onyx },
  roleButtons: { flexDirection: 'row', gap: 12 },
  roleButton: { flex: 1, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, alignItems: 'center' },
  roleButtonActive: { backgroundColor: theme.colors.emeraldA },
  roleButtonText: { fontSize: 16, color: theme.colors.slate },
  roleButtonTextActive: { color: '#fff', fontWeight: '600' },
  saveButton: { backgroundColor: '#4ECDC4', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
