import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import SponsorModal from './SponsorModal';
import { useTranslation } from '../i18n/useTranslation';
import WwIcon from './ui/WwIcon';
import PressScale from './ui/PressScale';
import { LinearGradient } from 'expo-linear-gradient';
import { Partner } from '../types';

interface SponsorCardProps {
  partner: Partner;
}

const SponsorCard: React.FC<SponsorCardProps> = ({ partner }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  // The admin partner form only ever writes to `photo` (its one image
  // picker) - `logo` is a separate, currently unused DB column. Prefer a
  // dedicated logo if one's ever set, but fall back to the photo that's
  // actually populated today.
  const image = partner.logo || partner.photo;

  return (
    <>
      <PressScale style={styles.card} onPress={() => setShowModal(true)}>
        <View style={styles.logoContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.logo} resizeMode="contain" />
          ) : (
            <LinearGradient colors={['#FFD700', '#FFC200']} style={styles.logoPlaceholder}>
              <WwIcon name="store" size={36} color="#fff" strokeWidth={1.3} />
            </LinearGradient>
          )}
          <View style={styles.sponsoredBadge}>
            <Text style={styles.sponsoredBadgeText}>{t('sponsor.badge')}</Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{partner.name}</Text>
          <Text style={styles.category} numberOfLines={1}>{partner.category}</Text>
          {!!partner.description && <Text style={styles.description} numberOfLines={2}>{partner.description}</Text>}
        </View>
      </PressScale>

      <SponsorModal partner={partner} visible={showModal} onClose={() => setShowModal(false)} />
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
  sponsoredBadgeText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  content: { padding: 12, flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 4, lineHeight: 17 },
  category: { fontSize: 11, color: '#95A5A6', fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 11, color: '#7F8C8D', lineHeight: 15, marginTop: 6 },

});

export default SponsorCard;
