import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { Partner } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminPartnersScreen() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'food',
    contactInfo: '',
    sponsored: false,
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/partners');
      setPartners(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        description: partner.description,
        category: partner.category,
        contactInfo: partner.contactInfo || '',
        sponsored: partner.sponsored,
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        description: '',
        category: 'food',
        contactInfo: '',
        sponsored: false,
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingPartner) {
        await api.put(`/api/admin/partners/${editingPartner.id}`, {
          ...editingPartner,
          ...formData,
        });
        Alert.alert('Success', 'Partner updated successfully');
      } else {
        await api.post('/api/admin/partners', formData);
        Alert.alert('Success', 'Partner created successfully');
      }
      setModalVisible(false);
      fetchPartners();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save partner');
    }
  };

  const handleDelete = (partner: Partner) => {
    Alert.alert(
      'Delete Partner',
      `Are you sure you want to delete "${partner.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/admin/partners/${partner.id}`);
              Alert.alert('Success', 'Partner deleted successfully');
              fetchPartners();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete partner');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'hotel': return '🏨';
      case 'spa': return '💆';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FFD700', '#FFC200']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Partners</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {partners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No partners yet</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => handleOpenModal()}>
              <Text style={styles.createButtonText}>Create First Partner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          partners.map((partner) => (
            <View key={partner.id} style={styles.partnerCard}>
              <View style={styles.partnerHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(partner.category)}</Text>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerCategory}>{partner.category}</Text>
                </View>
                {partner.sponsored && (
                  <View style={styles.sponsoredBadge}>
                    <Text style={styles.sponsoredText}>SPONSORED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.partnerDescription}>{partner.description}</Text>
              {partner.contactInfo && (
                <Text style={styles.contactInfo}>📞 {partner.contactInfo}</Text>
              )}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleOpenModal(partner)}
                >
                  <Ionicons name="create-outline" size={20} color="#4ECDC4" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(partner)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPartner ? 'Edit Partner' : 'New Partner'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Partner name"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Partner description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryButtons}>
                {['food', 'hotel', 'spa'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      formData.category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Contact Info</Text>
              <TextInput
                style={styles.input}
                value={formData.contactInfo}
                onChangeText={(text) => setFormData({ ...formData, contactInfo: text })}
                placeholder="Phone or email"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.sponsoredToggle}
                onPress={() => setFormData({ ...formData, sponsored: !formData.sponsored })}
              >
                <Text style={styles.sponsoredToggleText}>Sponsored Partner</Text>
                <Ionicons
                  name={formData.sponsored ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={formData.sponsored ? '#FFD700' : '#999'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingPartner ? 'Update Partner' : 'Create Partner'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  partnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  partnerCategory: {
    fontSize: 14,
    color: '#7F8C8D',
    textTransform: 'capitalize',
  },
  sponsoredBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  partnerDescription: {
    fontSize: 14,
    color: '#5A6C7D',
    lineHeight: 20,
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F8F7',
    padding: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFEAEA',
    padding: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#FFD700',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    textTransform: 'capitalize',
  },
  categoryButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  sponsoredToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  sponsoredToggleText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
