import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, Linking, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Partner } from '../types';

interface SponsorCardProps {
  partner: Partner;
}

const SponsorCard: React.FC<SponsorCardProps> = ({ partner }) => {
  const [showModal, setShowModal] = useState(false);
  // The admin partner form only ever writes to `photo` (its one image
  // picker) - `logo` is a separate, currently unused DB column. Prefer a
  // dedicated logo if one's ever set, but fall back to the photo that's
  // actually populated today.
  const image = partner.logo || partner.photo;

  const openWhatsApp = () => {
    if (!partner.whatsapp) return;
    const digits = partner.whatsapp.replace(/[^\d]/g, '');
    // wa.me works everywhere (web falls back to WhatsApp Web); the native
    // whatsapp:// scheme has no meaning in a browser.
    const url = Platform.OS === 'web' ? `https://wa.me/${digits}` : `whatsapp://send?phone=${digits}`;
    Linking.openURL(url).catch(() => {});
  };

  const openEmail = () => {
    if (!partner.email) return;
    Linking.openURL(`mailto:${partner.email}`).catch(() => {});
  };

  return (
    <>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => setShowModal(true)}>
        <View style={styles.logoContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.logo} resizeMode="contain" />
          ) : (
            <LinearGradient colors={['#FFD700', '#FFC200']} style={styles.logoPlaceholder}>
              <Ionicons name="storefront" size={32} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.sponsoredBadge}>
            <Text style={styles.sponsoredBadgeText}>SPONSOR</Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{partner.name}</Text>
          <Text style={styles.category} numberOfLines={1}>{partner.category}</Text>
          {!!partner.description && <Text style={styles.description} numberOfLines={4}>{partner.description}</Text>}
        </View>
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={22} color="#2C3E50" />
            </TouchableOpacity>

            {image ? (
              <Image source={{ uri: image }} style={styles.modalLogo} resizeMode="contain" />
            ) : (
              <LinearGradient colors={['#FFD700', '#FFC200']} style={styles.modalLogoPlaceholder}>
                <Ionicons name="storefront" size={40} color="#fff" />
              </LinearGradient>
            )}

            <Text style={styles.modalName}>{partner.name}</Text>
            <Text style={styles.modalCategory}>{partner.category}</Text>
            {!!partner.description && <Text style={styles.modalDescription}>{partner.description}</Text>}

            {(!!partner.whatsapp || !!partner.email) && (
              <View style={styles.contactRow}>
                {!!partner.whatsapp && (
                  <TouchableOpacity style={styles.contactButton} onPress={openWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    <Text style={styles.contactButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
                {!!partner.email && (
                  <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
                    <Ionicons name="mail" size={20} color="#2C3E50" />
                    <Text style={styles.contactButtonText}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEF',
    borderRadius: 20,
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE9A8',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(0,0,0,0.08)' },
    }),
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  logoContainer: { width: '100%', height: 130, position: 'relative', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { width: '70%', height: '70%' },
  logoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  sponsoredBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sponsoredBadgeText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  content: { padding: 12, flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 4, lineHeight: 17 },
  category: { fontSize: 11, color: '#95A5A6', fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 11, color: '#7F8C8D', lineHeight: 15, marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: 24, alignItems: 'center' },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  modalLogo: { width: 90, height: 90, borderRadius: 16, marginBottom: 12, marginTop: 8 },
  modalLogoPlaceholder: { width: 90, height: 90, borderRadius: 16, marginBottom: 12, marginTop: 8, justifyContent: 'center', alignItems: 'center' },
  modalName: { fontSize: 20, fontWeight: '800', color: '#2C3E50', textAlign: 'center', marginBottom: 4 },
  modalCategory: { fontSize: 13, color: '#95A5A6', fontWeight: '600', textTransform: 'capitalize', marginBottom: 12 },
  modalDescription: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  contactRow: { flexDirection: 'row', gap: 12, width: '100%' },
  contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F8F9FA', paddingVertical: 12, borderRadius: 12 },
  contactButtonText: { fontSize: 13, fontWeight: '700', color: '#2C3E50' },
});

export default SponsorCard;
