import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform, KeyboardAvoidingView, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/utils/api';
import { Partner } from '../../src/types';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

export default function AdminPartnersScreen() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'hotel' | 'spa'>('all');

  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    category: 'food', 
    contactInfo: '', 
    sponsored: false,
    email: '',
    whatsapp: '',
    line: '',
    address: '',
    latitude: '',
    longitude: '',
    photo: '',
  });
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  useEffect(() => { fetchPartners(true); }, []);
  useEffect(() => { const t = setTimeout(() => fetchPartners(true), 400); return () => clearTimeout(t); }, [query, categoryFilter]);

  const fetchPartners = async (reset = false) => {
    try {
      if (reset) { setLoading(true); setPage(1); }
      const currentPage = reset ? 1 : page;
      const response = await api.get(`/api/admin/partners`, { params: { page: currentPage, limit: 20, q: query || undefined, category: categoryFilter === 'all' ? undefined : categoryFilter } });
      const data: Partner[] = response.data;
      if (reset) setPartners(data); else setPartners((prev) => [...prev, ...data]);
      setHasMore(data.length === 20); setPage(currentPage + 1);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch partners');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchPartners(true); };
  const onEndReached = () => { if (!loading && hasMore) fetchPartners(); };

  const handleOpenModal = (partner?: Partner) => {
    if (partner) { 
      setEditingPartner(partner); 
      setFormData({ 
        name: partner.name, 
        description: partner.description, 
        category: partner.category, 
        contactInfo: partner.contactInfo || '', 
        sponsored: partner.sponsored,
        email: partner.email || '',
        whatsapp: partner.whatsapp || '',
        line: partner.line || '',
        address: partner.address || '',
        latitude: partner.latitude?.toString() || '',
        longitude: partner.longitude?.toString() || '',
        photo: partner.photo || '',
      }); 
    }
    else { 
      setEditingPartner(null); 
      setFormData({ 
        name: '', 
        description: '', 
        category: 'food', 
        contactInfo: '', 
        sponsored: false,
        email: '',
        whatsapp: '',
        line: '',
        address: '',
        latitude: '',
        longitude: '',
        photo: '',
      }); 
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    try {
      // Prepare data with proper types
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };
      
      if (editingPartner) { 
        await api.put(`/api/admin/partners/${editingPartner.id}`, { ...editingPartner, ...payload }); 
        Alert.alert('Success', 'Partner updated successfully'); 
      }
      else { 
        await api.post('/api/admin/partners', payload); 
        Alert.alert('Success', 'Partner created successfully'); 
      }
      setModalVisible(false); fetchPartners(true);
    } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to save partner'); }
  };

  const handleDelete = (partner: Partner) => {
    Alert.alert('Delete Partner', `Are you sure you want to delete "${partner.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/api/admin/partners/${partner.id}`); Alert.alert('Success', 'Partner deleted successfully'); fetchPartners(true); } catch (error: any) { Alert.alert('Error', error.response?.data?.detail || 'Failed to delete partner'); } } },
    ]);
  };

  const getCategoryIcon = (category: string) => category === 'food' ? '🍽️' : category === 'hotel' ? '🏨' : category === 'spa' ? '💆' : '📦';

  if (loading && partners.length === 0) {
    return (<View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.colors.primaryGold} /></View>);
  }

  return (
    <View style={styles.container}>
      <AppHeader variant="gold" logoUri="https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png" onBack={() => router.back()} right={<TouchableOpacity onPress={() => handleOpenModal()}><Ionicons name="add" size={24} color="#000" /></TouchableOpacity>} showDivider />

      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={theme.colors.slate} />
          <TextInput style={styles.searchInput} placeholder="Search partners" placeholderTextColor="#9AA0A6" value={query} onChangeText={setQuery} autoCapitalize="none" returnKeyType="search" />
          {query.length > 0 && (<TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}><Ionicons name="close-circle" size={18} color="#999" /></TouchableOpacity>)}
        </View>
        <View style={styles.pillsRow}>
          {(['all', 'food', 'hotel', 'spa'] as const).map((c) => (
            <TouchableOpacity key={c} style={[styles.pill, categoryFilter === c && styles.pillActive]} onPress={() => setCategoryFilter(c)}>
              <Text style={[styles.pillText, categoryFilter === c && styles.pillTextActive]}>{c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} onScroll={({ nativeEvent }) => { const { layoutMeasurement, contentOffset, contentSize } = nativeEvent; const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y); if (distanceFromBottom < 200) onEndReached(); }} scrollEventThrottle={200}>
        {partners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No partners yet</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => handleOpenModal()}><Text style={styles.createButtonText}>Create First Partner</Text></TouchableOpacity>
          </View>
        ) : (
          partners.map((partner) => (
            <View key={partner.id} style={styles.partnerCard}>
              <View style={styles.partnerHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(partner.category)}</Text>
                <View style={styles.partnerInfo}><Text style={styles.partnerName}>{partner.name}</Text><Text style={styles.partnerCategory}>{partner.category}</Text></View>
                {partner.sponsored && (<View style={styles.sponsoredBadge}><Text style={styles.sponsoredText}>SPONSORED</Text></View>)}
              </View>
              <Text style={styles.partnerDescription}>{partner.description}</Text>
              {partner.contactInfo && (<Text style={styles.contactInfo}>📞 {partner.contactInfo}</Text>)}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleOpenModal(partner)}><Ionicons name="create-outline" size={20} color="#4ECDC4" /><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(partner)}><Ionicons name="trash-outline" size={20} color={theme.colors.danger} /><Text style={styles.deleteButtonText}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {loading && partners.length > 0 && (<View style={{ padding: 16 }}><ActivityIndicator color={theme.colors.primaryGold} /></View>)}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingPartner ? 'Edit Partner' : 'New Partner'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity></View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="Partner name" placeholderTextColor="#999" />
              <Text style={styles.label}>Description *</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder="Partner description" placeholderTextColor="#999" multiline numberOfLines={3} />
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryButtons}>
                {['food', 'hotel', 'spa'].map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.categoryButton, formData.category === cat && styles.categoryButtonActive]} onPress={() => setFormData({ ...formData, category: cat })}>
                    <Text style={[styles.categoryButtonText, formData.category === cat && styles.categoryButtonTextActive]}>{getCategoryIcon(cat)} {cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Contact Info (Legacy)</Text>
              <TextInput style={styles.input} value={formData.contactInfo} onChangeText={(text) => setFormData({ ...formData, contactInfo: text })} placeholder="Phone or email" placeholderTextColor="#999" />
              
              <Text style={[styles.label, { marginTop: 20, fontSize: 16, color: theme.colors.primaryGold }]}>📍 Contact Details</Text>
              
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} placeholder="partner@example.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
              
              <Text style={styles.label}>WhatsApp Number</Text>
              <TextInput style={styles.input} value={formData.whatsapp} onChangeText={(text) => setFormData({ ...formData, whatsapp: text })} placeholder="+66812345678" placeholderTextColor="#999" keyboardType="phone-pad" />
              
              <Text style={styles.label}>LINE ID</Text>
              <TextInput style={styles.input} value={formData.line} onChangeText={(text) => setFormData({ ...formData, line: text })} placeholder="@partnerline" placeholderTextColor="#999" autoCapitalize="none" />
              
              <Text style={[styles.label, { marginTop: 20, fontSize: 16, color: theme.colors.primaryGold }]}>📍 Location Details</Text>
              
              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} placeholder="123 Street Name, City, Province, Postal Code" placeholderTextColor="#999" multiline numberOfLines={2} />
              
              <Text style={styles.label}>Latitude (Optional)</Text>
              <TextInput style={styles.input} value={formData.latitude} onChangeText={(text) => setFormData({ ...formData, latitude: text })} placeholder="13.7563" placeholderTextColor="#999" keyboardType="numeric" />
              
              <Text style={styles.label}>Longitude (Optional)</Text>
              <TextInput style={styles.input} value={formData.longitude} onChangeText={(text) => setFormData({ ...formData, longitude: text })} placeholder="100.5018" placeholderTextColor="#999" keyboardType="numeric" />
              
              <Text style={[styles.label, { marginTop: 20, fontSize: 16, color: theme.colors.primaryGold }]}>📷 Media</Text>
              
              <Text style={styles.label}>Photo URL</Text>
              <TextInput style={styles.input} value={formData.photo} onChangeText={(text) => setFormData({ ...formData, photo: text })} placeholder="https://example.com/photo.jpg" placeholderTextColor="#999" autoCapitalize="none" />
              
              <TouchableOpacity style={styles.sponsoredToggle} onPress={() => setFormData({ ...formData, sponsored: !formData.sponsored })}>
                <Text style={styles.sponsoredToggleText}>Sponsored Partner</Text>
                <Ionicons name={formData.sponsored ? 'checkbox' : 'square-outline'} size={24} color={formData.sponsored ? theme.colors.primaryGold : '#999'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>{editingPartner ? 'Update Partner' : 'Create Partner'}</Text></TouchableOpacity>
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
  pillActive: { backgroundColor: theme.colors.primaryGold },
  pillText: { color: theme.colors.onyx, fontWeight: '600' },
  pillTextActive: { color: '#000' },
  content: { padding: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16, marginBottom: 24 },
  createButton: { backgroundColor: theme.colors.primaryGold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  partnerCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { fontSize: 32, marginRight: 12 },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 18, fontWeight: '700', color: theme.colors.onyx },
  partnerCategory: { fontSize: 14, color: theme.colors.slate, textTransform: 'capitalize' },
  sponsoredBadge: { backgroundColor: theme.colors.primaryGold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  sponsoredText: { fontSize: 10, fontWeight: '700', color: '#000' },
  partnerDescription: { fontSize: 14, color: '#5A6C7D', lineHeight: 20, marginBottom: 8 },
  contactInfo: { fontSize: 13, color: theme.colors.slate, marginBottom: 12 },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryButtons: { flexDirection: 'row', gap: 8 },
  categoryButton: { flex: 1, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, alignItems: 'center' },
  categoryButtonActive: { backgroundColor: theme.colors.primaryGold },
  categoryButtonText: { fontSize: 14, color: theme.colors.slate, textTransform: 'capitalize' },
  categoryButtonTextActive: { color: '#000', fontWeight: '600' },
  sponsoredToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginTop: 12 },
  sponsoredToggleText: { fontSize: 16, color: theme.colors.onyx },
  saveButton: { backgroundColor: '#4ECDC4', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
