import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, TextInput, KeyboardAvoidingView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { Raffle, Partner } from '../../src/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

export default function AdminRafflesScreen() {
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', image: '', category: 'food', partnerId: '', prizesAvailable: 1, ticketCost: 10, prizeValue: 0, gamePrice: 0, drawDate: new Date(), validityMonths: 3, active: true,
  });
  const [partnerSearch, setPartnerSearch] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const minDate = useMemo(() => new Date(Date.now() + 60 * 60 * 1000), []); // +1 hour

  const filteredPartners = useMemo(() => {
    if (!partnerSearch) return partners;
    return partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()));
  }, [partners, partnerSearch]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rafflesRes, partnersRes] = await Promise.all([ api.get('/api/admin/raffles'), api.get('/api/admin/partners', { params: { page: 1, limit: 100 } }) ]);
      setRaffles(rafflesRes.data); setPartners(partnersRes.data);
    } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch raffles'); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); try { await fetchAll(); } finally { setRefreshing(false); } };

  const openCreateModal = () => { setEditingRaffle(null); setFormData({ title: '', description: '', image: '', category: 'food', partnerId: partners[0]?.id || '', prizesAvailable: 1, ticketCost: 10, prizeValue: 0, gamePrice: 0, drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), validityMonths: 3, active: true, }); setPartnerSearch(''); setModalVisible(true); };

  const openEditModal = (raffle: Raffle) => { setEditingRaffle(raffle); setFormData({ title: raffle.title, description: raffle.description, image: raffle.image || '', category: raffle.category, partnerId: raffle.partnerId, prizesAvailable: raffle.prizesAvailable, ticketCost: raffle.ticketCost, prizeValue: raffle.prizeValue || 0, gamePrice: raffle.gamePrice || 0, drawDate: new Date(raffle.drawDate), validityMonths: raffle.validityMonths || 3, active: raffle.active, }); setPartnerSearch(''); setModalVisible(true); };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.partnerId || !formData.drawDate) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    const now = new Date(); if (formData.drawDate instanceof Date && formData.drawDate <= now) { Alert.alert('Invalid Date', 'Draw date/time must be in the future.'); return; }
    try {
      setSaving(true);
      const drawDateISO = formData.drawDate instanceof Date ? formData.drawDate.toISOString() : String(formData.drawDate);
      if (editingRaffle) {
        const payload: Raffle = { id: editingRaffle.id, title: formData.title, description: formData.description, image: formData.image || undefined, category: formData.category, partnerId: formData.partnerId, partnerName: partners.find(p => p.id === formData.partnerId)?.name, prizesAvailable: formData.prizesAvailable, prizesRemaining: editingRaffle.prizesRemaining, ticketCost: formData.ticketCost, prizeValue: formData.prizeValue, gamePrice: formData.gamePrice, drawDate: drawDateISO, validityMonths: formData.validityMonths, active: formData.active, totalEntries: editingRaffle.totalEntries, createdAt: editingRaffle.createdAt };
        await api.put(`/api/admin/raffles/${editingRaffle.id}`, payload); Alert.alert('Success', 'Raffle updated');
      } else {
        const payload: Partial<Raffle> = { title: formData.title, description: formData.description, image: formData.image || undefined, category: formData.category, partnerId: formData.partnerId, partnerName: partners.find(p => p.id === formData.partnerId)?.name, prizesAvailable: formData.prizesAvailable, ticketCost: formData.ticketCost, prizeValue: formData.prizeValue, gamePrice: formData.gamePrice, drawDate: drawDateISO, validityMonths: formData.validityMonths, active: formData.active } as any;
        await api.post('/api/admin/raffles', payload); Alert.alert('Success', 'Raffle created');
      }
      setModalVisible(false); fetchAll();
    } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to save raffle'); }
    finally { setSaving(false); }
  };

  const handleDelete = (raffle: Raffle) => {
    Alert.alert('Delete Raffle', `Are you sure you want to delete "${raffle.title}"?`, [ { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/api/admin/raffles/${raffle.id}`); Alert.alert('Success', 'Raffle deleted successfully'); fetchAll(); } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to delete raffle'); } } } ]);
  };

  const handleDrawWinner = (raffle: Raffle) => {
    Alert.alert('Draw Winner', `Draw a winner for "${raffle.title}"?`, [ { text: 'Cancel', style: 'cancel' }, { text: 'Draw Winner', onPress: async () => { try { const response = await api.post('/api/admin/draw-winner', { raffleId: raffle.id }); Alert.alert('Success', response.data.message); fetchAll(); } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to draw winner'); } } } ]);
  };

  const getCategoryIcon = (category: string) => category === 'food' ? '🍽️' : category === 'hotel' ? '🏨' : category === 'spa' ? '💆' : '🎁';
  const formatDate = (date: Date) => date.toLocaleString();

  if (loading) { return (<View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.colors.primaryGold} /></View>); }

  return (
    <View style={styles.container}>
      <AppHeader variant="mint" logoUri="https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png" onBack={() => router.back()} right={<TouchableOpacity onPress={openCreateModal}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>} showDivider />

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {raffles.length === 0 ? (
          <View style={styles.emptyContainer}><Ionicons name="gift-outline" size={64} color="#999" /><Text style={styles.emptyText}>No raffles yet</Text></View>
        ) : (
          raffles.map((raffle) => (
            <TouchableOpacity key={raffle.id} style={styles.raffleCard} onPress={() => openEditModal(raffle)}>
              <View style={styles.raffleHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(raffle.category)}</Text>
                <View style={styles.raffleInfo}>
                  <Text style={styles.raffleTitle}>{raffle.title}</Text>
                  <Text style={styles.rafflePartner}>{raffle.partnerName}</Text>
                  {raffle.location ? (<Text style={styles.raffleLocation}>📍 {raffle.location}</Text>) : null}
                </View>
                {raffle.active ? (<View style={styles.activeBadge}><Text style={styles.activeText}>ACTIVE</Text></View>) : (<View style={styles.inactiveBadge}><Text style={styles.inactiveText}>CLOSED</Text></View>)}
              </View>
              <View style={styles.raffleStats}>
                <View style={styles.statItem}><Text style={styles.statLabel}>Prizes</Text><Text style={styles.statValue}>{raffle.prizesRemaining}/{raffle.prizesAvailable}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>Entries</Text><Text style={styles.statValue}>{raffle.totalEntries}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>Draw Date</Text><Text style={styles.statValue}>{formatDate(new Date(raffle.drawDate))}</Text></View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.drawButton} onPress={() => handleDrawWinner(raffle)} disabled={!raffle.active || raffle.totalEntries === 0}>
                  <Ionicons name="trophy-outline" size={20} color="#fff" />
                  <Text style={styles.drawButtonText}>Draw Winner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(raffle)}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingRaffle ? 'Edit Raffle' : 'New Raffle'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity></View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} placeholder="Raffle title" placeholderTextColor="#999" />
              <Text style={styles.label}>Description *</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder="Raffle description" placeholderTextColor="#999" multiline numberOfLines={3} />
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryButtons}>
                {['food', 'hotel', 'spa'].map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.categoryButton, formData.category === cat && styles.categoryButtonActive]} onPress={() => setFormData({ ...formData, category: cat })}>
                    <Text style={[styles.categoryButtonText, formData.category === cat && styles.categoryButtonTextActive]}>{getCategoryIcon(cat)} {cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Partner *</Text>
              <View style={styles.partnerList}>
                {partners.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.partnerItem, formData.partnerId === p.id && styles.partnerItemActive]} onPress={() => setFormData({ ...formData, partnerId: p.id })}>
                    <Text style={[styles.partnerItemText, formData.partnerId === p.id && styles.partnerItemTextActive]}>{p.name}</Text>
                    {formData.partnerId === p.id && (<Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />)}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} value={formData.location} onChangeText={(text) => setFormData({ ...formData, location: text.toLowerCase() })} placeholder="e.g., bangkok" placeholderTextColor="#999" autoCapitalize="none" />
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} placeholder="Full address (optional)" placeholderTextColor="#999" />
              <Text style={styles.label}>Prizes Available *</Text>
              <TextInput style={styles.input} value={String(formData.prizesAvailable)} onChangeText={(text) => setFormData({ ...formData, prizesAvailable: parseInt(text) || 0 })} placeholder="Number of prizes" placeholderTextColor="#999" keyboardType="numeric" />
              <Text style={styles.label}>Ticket Cost *</Text>
              <TextInput style={styles.input} value={String(formData.ticketCost)} onChangeText={(text) => setFormData({ ...formData, ticketCost: parseInt(text) || 0 })} placeholder="Tickets per entry" placeholderTextColor="#999" keyboardType="numeric" />
              <Text style={styles.label}>Prize Validity (months) *</Text>
              <TextInput style={styles.input} value={String(formData.validityMonths)} onChangeText={(text) => setFormData({ ...formData, validityMonths: parseInt(text) || 3 })} placeholder="3" placeholderTextColor="#999" keyboardType="numeric" />
              <Text style={styles.helperText}>How long the prize is valid after winning (default: 3 months)</Text>
              <Text style={styles.label}>Draw Date *</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: theme.colors.onyx, fontSize: 16 }}>{formatDate(formData.drawDate instanceof Date ? formData.drawDate : new Date(formData.drawDate))}</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Must be at least 1 hour in the future.</Text>
              {showDatePicker && (
                <DateTimePicker value={formData.drawDate instanceof Date ? formData.drawDate : new Date(formData.drawDate)} mode="datetime" minimumDate={minDate} display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, selectedDate) => { setShowDatePicker(false); if (selectedDate) { if (selectedDate > new Date()) { setFormData({ ...formData, drawDate: selectedDate }); } else { Alert.alert('Invalid Date', 'Please choose a future date/time.'); } } }} />
              )}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>{saving ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.saveButtonText}>{editingRaffle ? 'Update Raffle' : 'Create Raffle'}</Text>)}</TouchableOpacity>
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
  content: { padding: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
  raffleCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  raffleHeader: { flexDirection: 'row', marginBottom: 16 },
  categoryIcon: { fontSize: 32, marginRight: 12 },
  raffleInfo: { flex: 1 },
  raffleTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.onyx, marginBottom: 4 },
  rafflePartner: { fontSize: 14, color: theme.colors.slate, marginBottom: 2 },
  raffleLocation: { fontSize: 13, color: theme.colors.slate, textTransform: 'capitalize' },
  activeBadge: { backgroundColor: '#4ECDC4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, height: 24 },
  activeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  inactiveBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, height: 24 },
  inactiveText: { fontSize: 10, fontWeight: '700', color: '#999' },
  raffleStats: { flexDirection: 'row', marginBottom: 16, backgroundColor: theme.colors.cloud, borderRadius: 8, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: theme.colors.slate, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: theme.colors.onyx },
  actionButtons: { flexDirection: 'row', gap: 12 },
  drawButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.mintA, padding: 12, borderRadius: 8 },
  drawButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  deleteButton: { backgroundColor: '#FFEAEA', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: 48 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onyx },
  formContainer: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.onyx, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, color: theme.colors.onyx },
  helperText: { fontSize: 12, color: theme.colors.slate, marginTop: 6 },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryButtons: { flexDirection: 'row', gap: 8 },
  categoryButton: { flex: 1, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, alignItems: 'center' },
  categoryButtonActive: { backgroundColor: theme.colors.primaryGold },
  categoryButtonText: { fontSize: 14, color: theme.colors.slate, textTransform: 'capitalize' },
  categoryButtonTextActive: { color: '#000', fontWeight: '600' },
  partnerList: { marginBottom: 8 },
  partnerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8, marginBottom: 8 },
  partnerItemActive: { backgroundColor: '#E8F8F7', borderWidth: 2, borderColor: '#4ECDC4' },
  partnerItemText: { fontSize: 14, color: theme.colors.onyx },
  partnerItemTextActive: { fontWeight: '700', color: theme.colors.onyx },
  saveButton: { backgroundColor: '#4ECDC4', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
