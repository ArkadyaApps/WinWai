import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';
import api from '../utils/api';
import { useTranslation } from '../i18n/useTranslation';

interface PartnerInquiryModalProps {
  visible: boolean;
  onClose: () => void;
}

const PartnerInquiryModal: React.FC<PartnerInquiryModalProps> = ({ visible, onClose }) => {
  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!brand.trim() || !product.trim() || !name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/partner-inquiry', {
        brand: brand.trim(),
        product: product.trim(),
        name: name.trim(),
        phone: phone.trim(),
      });

      Alert.alert('Success! 🎉', response.data.message || 'Thank you! We\'ll contact you soon.');
      
      // Reset form
      setBrand('');
      setProduct('');
      setName('');
      setPhone('');
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to send inquiry. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="business" size={40} color={theme.colors.primaryGold} />
              </View>
              <Text style={styles.title}>Become a Partner</Text>
              <Text style={styles.subtitle}>
                Promote your brand or products to thousands of raffle participants!
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>Brand / Business Name *</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g., My Restaurant"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Product / Service *</Text>
              <TextInput
                style={styles.input}
                value={product}
                onChangeText={setProduct}
                placeholder="e.g., Food vouchers, Spa services"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Contact Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+66 XX XXX XXXX"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Send Inquiry</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    backgroundColor: '#FFF9E6',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onyx,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onyx,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.onyx,
  },
  submitButton: {
    backgroundColor: theme.colors.primaryGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default PartnerInquiryModal;
