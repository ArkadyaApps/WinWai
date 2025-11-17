import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, TextInput, KeyboardAvoidingView, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import api from '../../src/utils/api';
import { Raffle, Partner } from '../../src/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

export default function AdminRafflesScreen() {
  console.log('==================== ADMIN RAFFLES SCREEN MOUNTED ====================');
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Secret code upload modal
  const [secretCodeModalVisible, setSecretCodeModalVisible] = useState(false);
  const [selectedRaffleForCodes, setSelectedRaffleForCodes] = useState<Raffle | null>(null);
  const [secretCodesText, setSecretCodesText] = useState('');
  const [uploadingCodes, setUploadingCodes] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', image: '', category: 'food', partnerId: '', location: '', address: '', prizesAvailable: 1, ticketCost: 10, prizeValue: 0, gamePrice: 0, drawDate: new Date(), validityMonths: 3, active: true, language: 'en', allowedCountries: ['TH'], currency: 'THB',
  });
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [secretCodes, setSecretCodes] = useState<string[]>(['']);
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  const CATEGORIES = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'hotel', label: 'Hotels & Accommodation' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'gift-cards', label: 'Gift Cards' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'voucher', label: 'Vouchers' },
  ];

  const DIGITAL_CATEGORIES = ['gift-cards', 'electronics', 'voucher'];
  const isDigitalPrize = DIGITAL_CATEGORIES.includes(formData.category);

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

  const openCreateModal = () => { 
    setEditingRaffle(null); 
    setFormData({ title: '', description: '', image: '', category: 'food', partnerId: partners[0]?.id || '', location: '', address: '', prizesAvailable: 1, ticketCost: 10, prizeValue: 0, gamePrice: 0, drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), validityMonths: 3, active: true, language: 'en', allowedCountries: ['TH'], currency: 'THB' }); 
    setPartnerSearch(''); 
    setSelectedImage(null);
    setSecretCodes(['']);
    setModalVisible(true); 
  };

  const openEditModal = (raffle: Raffle) => { setEditingRaffle(raffle); setFormData({ title: raffle.title, description: raffle.description, image: raffle.image || '', category: raffle.category, partnerId: raffle.partnerId, location: raffle.location || '', address: raffle.address || '', prizesAvailable: raffle.prizesAvailable, ticketCost: raffle.ticketCost, prizeValue: raffle.prizeValue || 0, gamePrice: raffle.gamePrice || 0, drawDate: new Date(raffle.drawDate), validityMonths: raffle.validityMonths || 3, active: raffle.active, language: (raffle as any).language || 'en', allowedCountries: (raffle as any).allowedCountries || ['TH'], currency: (raffle as any).currency || 'THB' }); setPartnerSearch(''); setModalVisible(true); };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.partnerId || !formData.drawDate) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    if (!formData.image && !selectedImage) { Alert.alert('Error', 'Please upload an image'); return; }
    
    // Validate secret codes for digital prizes
    if (isDigitalPrize) {
      const validCodes = secretCodes.filter(c => c.trim());
      if (validCodes.length === 0) {
        Alert.alert('Error', 'Please add at least one secret code for digital prizes');
        return;
      }
      // Check for duplicate codes
      const uniqueCodes = new Set(validCodes);
      if (uniqueCodes.size !== validCodes.length) {
        Alert.alert('Error', 'Duplicate codes found. Each code must be unique.');
        return;
      }
    }

    const now = new Date(); if (formData.drawDate instanceof Date && formData.drawDate <= now) { Alert.alert('Invalid Date', 'Draw date/time must be in the future.'); return; }
    try {
      setSaving(true);
      const drawDateISO = formData.drawDate instanceof Date ? formData.drawDate.toISOString() : String(formData.drawDate);
      
      // For digital prizes, set prizesAvailable to number of valid codes
      const validSecretCodes = secretCodes.filter(c => c.trim());
      const finalPrizesAvailable = isDigitalPrize ? validSecretCodes.length : formData.prizesAvailable;
      
      if (editingRaffle) {
        const payload: Raffle = { id: editingRaffle.id, title: formData.title, description: formData.description, image: formData.image || undefined, category: formData.category, partnerId: formData.partnerId, partnerName: partners.find(p => p.id === formData.partnerId)?.name, prizesAvailable: finalPrizesAvailable, prizesRemaining: editingRaffle.prizesRemaining, ticketCost: formData.ticketCost, prizeValue: formData.prizeValue, gamePrice: formData.gamePrice, drawDate: drawDateISO, validityMonths: formData.validityMonths, active: formData.active, totalEntries: editingRaffle.totalEntries, createdAt: editingRaffle.createdAt };
        await api.put(`/api/admin/raffles/${editingRaffle.id}`, payload); Alert.alert('Success', 'Raffle updated');
      } else {
        const payload: any = { 
          title: formData.title, 
          description: formData.description, 
          image: selectedImage || formData.image, 
          category: formData.category, 
          partnerId: formData.partnerId, 
          partnerName: partners.find(p => p.id === formData.partnerId)?.name, 
          prizesAvailable: finalPrizesAvailable, 
          ticketCost: formData.ticketCost, 
          prizeValue: formData.prizeValue, 
          gamePrice: formData.gamePrice, 
          drawDate: drawDateISO, 
          validityMonths: formData.validityMonths, 
          active: formData.active,
          language: formData.language,
          allowedCountries: formData.allowedCountries,
          currency: formData.currency
        };
        
        // Add secret codes for digital prizes
        if (isDigitalPrize) {
          payload.isDigitalPrize = true;
          payload.secretCodes = validSecretCodes;
        }
        
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

  const openSecretCodeModal = (raffle: Raffle) => {
    setSelectedRaffleForCodes(raffle);
    setSecretCodesText('');
    setSecretCodeModalVisible(true);
  };

  const handleUploadSecretCodes = async () => {
    if (!selectedRaffleForCodes) return;
    
    // Parse secret codes from text (one per line)
    const codes = secretCodesText
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);
    
    if (codes.length === 0) {
      Alert.alert('Error', 'Please enter at least one secret code');
      return;
    }

    try {
      setUploadingCodes(true);
      const response = await api.post('/api/admin/raffles/upload-secret-codes', {
        raffleId: selectedRaffleForCodes.id,
        secretCodes: codes
      });
      
      Alert.alert('Success', `Uploaded ${response.data.codesCount} secret codes`);
      setSecretCodeModalVisible(false);
      setSecretCodesText('');
      fetchAll();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload secret codes');
    } finally {
      setUploadingCodes(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'food': return '🍽️';
      case 'hotel': return '🏨';
      case 'spa': return '💆';
      case 'gift-cards': return '🎁';
      case 'electronics': return '📱';
      case 'voucher': return '🎫';
      default: return '🎁';
    }
  };
  const formatDate = (date: Date) => date.toLocaleString();

  // Image Picker Handler
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSelectedImage(base64Image);
        setFormData({ ...formData, image: base64Image });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Secret Codes Management
  const addSecretCodeField = () => {
    setSecretCodes([...secretCodes, '']);
  };

  const removeSecretCodeField = (index: number) => {
    if (secretCodes.length > 1) {
      const newCodes = secretCodes.filter((_, i) => i !== index);
      setSecretCodes(newCodes);
    }
  };

  const updateSecretCode = (index: number, value: string) => {
    const newCodes = [...secretCodes];
    newCodes[index] = value;
    setSecretCodes(newCodes);
  };

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
                <TouchableOpacity style={styles.uploadCodeButton} onPress={() => openSecretCodeModal(raffle)}>
                  <Ionicons name="code-outline" size={18} color="#fff" />
                  <Text style={styles.uploadCodeText}>Codes</Text>
                </TouchableOpacity>
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
              <Text style={styles.label}>Language * (Content Language)</Text>
              <View style={styles.categoryButtons}>
                {[{ code: 'en', name: 'English' }, { code: 'th', name: 'ภาษาไทย' }, { code: 'fr', name: 'Français' }, { code: 'ar', name: 'العربية' }].map((lang) => (
                  <TouchableOpacity key={lang.code} style={[styles.categoryButton, formData.language === lang.code && styles.categoryButtonActive]} onPress={() => setFormData({ ...formData, language: lang.code })}>
                    <Text style={[styles.categoryButtonText, formData.language === lang.code && styles.categoryButtonTextActive]}>{lang.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Allowed Countries * (User Geolocation)</Text>
              <View style={styles.countryGrid}>
                {[
                  { code: 'TH', name: '🇹🇭 Thailand', flag: '🇹🇭' },
                  { code: 'MA', name: '🇲🇦 Morocco', flag: '🇲🇦' },
                  { code: 'US', name: '🇺🇸 USA', flag: '🇺🇸' },
                  { code: 'GB', name: '🇬🇧 UK', flag: '🇬🇧' },
                  { code: 'FR', name: '🇫🇷 France', flag: '🇫🇷' },
                  { code: 'DE', name: '🇩🇪 Germany', flag: '🇩🇪' },
                  { code: 'JP', name: '🇯🇵 Japan', flag: '🇯🇵' },
                  { code: 'CN', name: '🇨🇳 China', flag: '🇨🇳' },
                  { code: 'IN', name: '🇮🇳 India', flag: '🇮🇳' },
                  { code: 'SG', name: '🇸🇬 Singapore', flag: '🇸🇬' },
                  { code: 'MY', name: '🇲🇾 Malaysia', flag: '🇲🇾' },
                  { code: 'VN', name: '🇻🇳 Vietnam', flag: '🇻🇳' },
                  { code: 'ALL', name: '🌍 All Countries', flag: '🌍' },
                ].map((country) => {
                  const isSelected = country.code === 'ALL' 
                    ? formData.allowedCountries.includes('ALL')
                    : formData.allowedCountries.includes(country.code);
                  return (
                    <TouchableOpacity 
                      key={country.code} 
                      style={[styles.countryButton, isSelected && styles.countryButtonActive]} 
                      onPress={() => {
                        if (country.code === 'ALL') {
                          setFormData({ ...formData, allowedCountries: ['ALL'] });
                        } else {
                          const newCountries = isSelected
                            ? formData.allowedCountries.filter(c => c !== country.code && c !== 'ALL')
                            : [...formData.allowedCountries.filter(c => c !== 'ALL'), country.code];
                          setFormData({ ...formData, allowedCountries: newCountries.length > 0 ? newCountries : ['TH'] });
                        }
                      }}
                    >
                      <Text style={[styles.countryButtonText, isSelected && styles.countryButtonTextActive]}>
                        {country.flag} {country.name.replace(/🇹🇭 |🇺🇸 |🇬🇧 |🇫🇷 |🇩🇪 |🇯🇵 |🇨🇳 |🇮🇳 |🇸🇬 |🇲🇾 |🇻🇳 |🌍 /, '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>Users from selected countries can participate. Default: Thailand only.</Text>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  style={styles.picker}
                >
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat.value} label={`${getCategoryIcon(cat.value)} ${cat.label}`} value={cat.value} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Raffle Image *</Text>
              <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
                {selectedImage || formData.image ? (
                  <Image source={{ uri: selectedImage || formData.image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imageUploadPlaceholder}>
                    <Ionicons name="image" size={40} color="#999" />
                    <Text style={styles.imageUploadText}>Tap to upload image</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.label}>Partner * (Searchable)</Text>
              <TextInput 
                style={styles.input} 
                value={partnerSearch} 
                onChangeText={setPartnerSearch}
                placeholder="Search partners..." 
                placeholderTextColor="#999" 
              />
              <View style={styles.partnerList}>
                {filteredPartners.length === 0 ? (
                  <Text style={styles.noResultsText}>No partners found</Text>
                ) : (
                  filteredPartners.map((p) => (
                    <TouchableOpacity key={p.id} style={[styles.partnerItem, formData.partnerId === p.id && styles.partnerItemActive]} onPress={() => setFormData({ ...formData, partnerId: p.id })}>
                      <Text style={[styles.partnerItemText, formData.partnerId === p.id && styles.partnerItemTextActive]}>{p.name}</Text>
                      {formData.partnerId === p.id && (<Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />)}
                    </TouchableOpacity>
                  ))
                )}
              </View>
              
              <Text style={styles.label}>Location/City</Text>
              <TextInput style={styles.input} value={formData.location} onChangeText={(text) => setFormData({ ...formData, location: text })} placeholder="Bangkok, Chiang Mai, Online..." placeholderTextColor="#999" />
              
              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} placeholder="Partner address or redemption location" placeholderTextColor="#999" multiline numberOfLines={2} />
              
              {isDigitalPrize ? (
                <>
                  <Text style={styles.label}>Secret Codes * (One code per prize)</Text>
                  <Text style={styles.helperText}>Add unique codes for each prize. Number of codes = prizes available</Text>
                  {secretCodes.map((code, index) => (
                    <View key={index} style={styles.secretCodeRow}>
                      <TextInput
                        style={[styles.input, styles.secretCodeInput]}
                        value={code}
                        onChangeText={(text) => updateSecretCode(index, text)}
                        placeholder={`Code #${index + 1}`}
                        placeholderTextColor="#999"
                      />
                      {secretCodes.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeCodeButton}
                          onPress={() => removeSecretCodeField(index)}
                        >
                          <Ionicons name="remove-circle" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addCodeButton} onPress={addSecretCodeField}>
                    <Ionicons name="add-circle" size={24} color="#4ECDC4" />
                    <Text style={styles.addCodeText}>Add Another Code</Text>
                  </TouchableOpacity>
                  <Text style={styles.helperText}>Prizes Available: {secretCodes.filter(c => c.trim()).length}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Prizes Available *</Text>
                  <TextInput style={styles.input} value={String(formData.prizesAvailable)} onChangeText={(text) => setFormData({ ...formData, prizesAvailable: parseInt(text) || 0 })} placeholder="Number of prizes" placeholderTextColor="#999" keyboardType="numeric" />
                </>
              )}
              <Text style={styles.label}>Ticket Cost *</Text>
              <TextInput style={styles.input} value={String(formData.ticketCost)} onChangeText={(text) => setFormData({ ...formData, ticketCost: parseInt(text) || 0 })} placeholder="Tickets per entry" placeholderTextColor="#999" keyboardType="numeric" />
              <Text style={styles.helperText}>Number of tickets required to enter this raffle</Text>
              
              <Text style={styles.label}>Currency *</Text>
              <View style={styles.categoryButtons}>
                {[
                  { code: 'THB', name: '฿ THB', symbol: '฿' },
                  { code: 'USD', name: '$ USD', symbol: '$' },
                  { code: 'EUR', name: '€ EUR', symbol: '€' },
                  { code: 'GBP', name: '£ GBP', symbol: '£' },
                  { code: 'MAD', name: 'DH MAD', symbol: 'DH' },
                ].map((curr) => (
                  <TouchableOpacity key={curr.code} style={[styles.categoryButton, formData.currency === curr.code && styles.categoryButtonActive]} onPress={() => setFormData({ ...formData, currency: curr.code })}>
                    <Text style={[styles.categoryButtonText, formData.currency === curr.code && styles.categoryButtonTextActive]}>{curr.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.label}>Prize Value ({formData.currency}) *</Text>
              <TextInput style={styles.input} value={String(formData.prizeValue)} onChangeText={(text) => setFormData({ ...formData, prizeValue: parseFloat(text) || 0 })} placeholder="e.g., 5000" placeholderTextColor="#999" keyboardType="numeric" />
              <Text style={styles.helperText}>Total value of the prize in {formData.currency} (Auto-converted to USD in database)</Text>
              
              <Text style={styles.label}>Game Price (฿) *</Text>
              <TextInput style={styles.input} value={String(formData.gamePrice)} onChangeText={(text) => setFormData({ ...formData, gamePrice: parseFloat(text) || 0 })} placeholder="e.g., 100" placeholderTextColor="#999" keyboardType="numeric" />
              <Text style={styles.helperText}>Cost per ticket/game in Thai Baht</Text>
              
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

      {/* Secret Code Upload Modal */}
      <Modal visible={secretCodeModalVisible} animationType="slide" transparent onRequestClose={() => setSecretCodeModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Secret Codes</Text>
              <TouchableOpacity onPress={() => setSecretCodeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.codeInfoBox}>
                <Ionicons name="information-circle-outline" size={24} color={theme.colors.primaryGold} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.codeInfoTitle}>Digital Prize Codes</Text>
                  <Text style={styles.codeInfoText}>
                    Enter secret codes for digital prizes (e.g., Netflix codes, gift card PINs).
                    One code per line. Duplicates will be automatically removed.
                  </Text>
                </View>
              </View>

              {selectedRaffleForCodes && (
                <View style={styles.selectedRaffleBox}>
                  <Text style={styles.selectedRaffleLabel}>Raffle:</Text>
                  <Text style={styles.selectedRaffleTitle}>{selectedRaffleForCodes.title}</Text>
                </View>
              )}

              <Text style={styles.label}>Secret Codes *</Text>
              <Text style={styles.helperText}>Enter one code per line</Text>
              <TextInput
                style={[styles.input, styles.codeTextArea]}
                value={secretCodesText}
                onChangeText={setSecretCodesText}
                placeholder="CODE1&#10;CODE2&#10;CODE3&#10;..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              
              <View style={styles.codeStats}>
                <Text style={styles.codeStatsText}>
                  {secretCodesText.split('\n').filter(code => code.trim().length > 0).length} codes entered
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handleUploadSecretCodes} 
                disabled={uploadingCodes || secretCodesText.trim().length === 0}
              >
                {uploadingCodes ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>Upload Codes</Text>
                  </>
                )}
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
  noResultsText: { fontSize: 14, color: theme.colors.slate, textAlign: 'center', padding: 16 },
  saveButton: { backgroundColor: '#4ECDC4', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  countryButton: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: '30%' },
  countryButtonActive: { backgroundColor: '#4ECDC4', borderWidth: 2, borderColor: '#3ABDB4' },
  countryButtonText: { fontSize: 13, color: theme.colors.onyx },
  countryButtonTextActive: { color: '#fff', fontWeight: '700' },
  uploadCodeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9C27B0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  uploadCodeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  codeInfoBox: { flexDirection: 'row', backgroundColor: '#FFF9E6', padding: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: theme.colors.primaryGold, marginBottom: 16 },
  codeInfoTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.onyx, marginBottom: 4 },
  codeInfoText: { fontSize: 13, color: theme.colors.slate, lineHeight: 18 },
  selectedRaffleBox: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 16 },
  selectedRaffleLabel: { fontSize: 12, color: theme.colors.slate, marginBottom: 4 },
  selectedRaffleTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.onyx },
  codeTextArea: { height: 200, paddingTop: 12 },
  codeStats: { backgroundColor: '#E8F8F7', padding: 8, borderRadius: 6, marginTop: 8, marginBottom: 16 },
  codeStatsText: { fontSize: 13, color: '#4ECDC4', fontWeight: '600', textAlign: 'center' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9C27B0', padding: 16, borderRadius: 8, gap: 8 },
  uploadButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  pickerContainer: { backgroundColor: '#F5F5F5', borderRadius: 8, marginBottom: 8 },
  picker: { height: 50, width: '100%' },
  imageUploadButton: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8, minHeight: 150 },
  imageUploadPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imageUploadText: { fontSize: 14, color: '#999', marginTop: 8 },
  imagePreview: { width: '100%', height: 150, borderRadius: 8 },
  secretCodeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  secretCodeInput: { flex: 1, marginBottom: 0 },
  removeCodeButton: { padding: 8 },
  addCodeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F8F7', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  addCodeText: { fontSize: 14, fontWeight: '600', color: '#4ECDC4' },
});
