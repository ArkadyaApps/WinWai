import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, Linking, Modal, ScrollView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WwIcon, { WwIconName } from './ui/WwIcon';
import { GlyphField } from './landing/AuroraBackground';
import { useTranslation } from '../i18n/useTranslation';
import { Partner } from '../types';
import { FONT_DISPLAY } from '../theme/fonts';

interface SponsorModalProps {
  partner: Partner;
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_ICON: Record<string, WwIconName> = { food: 'store', hotel: 'home', spa: 'sparkle', electronics: 'code', services: 'shield', shopping: 'gift' };

/** Opens a link in a new tab on the web (never replacing the app), or via the OS elsewhere. */
function openExternal(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(url).catch(() => {});
}

function whatsappUrl(number: string) {
  const digits = number.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}`;
}

function lineUrl(id: string) {
  const clean = id.trim();
  return clean.startsWith('@') ? `https://line.me/R/ti/p/${encodeURIComponent(clean)}` : `https://line.me/R/ti/p/~${encodeURIComponent(clean)}`;
}

function directionsUrl(p: Partner) {
  if (typeof p.latitude === 'number' && typeof p.longitude === 'number') return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  const q = [p.name, p.address || p.location].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

const prettyHost = (url: string) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

/**
 * Sponsor profile popup: a nested "bezel" card with a cover (the partner's photo, or
 * a brand gradient with drifting glyphs), an overlapping logo, the story, and a
 * clear set of actions - website first, then WhatsApp, LINE, email and directions.
 */
const SponsorModal: React.FC<SponsorModalProps> = ({ partner, visible, onClose }) => {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, friction: 8, tension: 70, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [visible]);

  // `logo` is rarely set (the admin form writes one image to `photo`), so the
  // avatar falls back to the photo; a distinct photo becomes the cover banner.
  const avatar = partner.logo || partner.photo;
  const cover = partner.logo && partner.photo && partner.logo !== partner.photo ? partner.photo : undefined;
  const place = [partner.location, partner.address].filter(Boolean)[0];

  type Action = { key: string; icon: WwIconName; label: string; url: string; tone: string };
  const secondary: Action[] = [];
  if (partner.whatsapp) secondary.push({ key: 'wa', icon: 'chat', label: t('sponsor.whatsapp'), url: whatsappUrl(partner.whatsapp), tone: '#DCF8E6' });
  if (partner.line) secondary.push({ key: 'line', icon: 'chat', label: t('sponsor.line'), url: lineUrl(partner.line), tone: '#DDF6E0' });
  if (partner.email) secondary.push({ key: 'mail', icon: 'mail', label: t('sponsor.email'), url: `mailto:${partner.email}`, tone: '#E7ECFB' });
  if (partner.address || partner.location || (typeof partner.latitude === 'number' && typeof partner.longitude === 'number')) {
    secondary.push({ key: 'map', icon: 'pin', label: t('sponsor.directions'), url: directionsUrl(partner), tone: '#FFE9DF' });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[styles.shell, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.core}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* cover */}
              <View style={styles.cover}>
                {cover ? (
                  <>
                    <Image source={{ uri: cover }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)']} style={StyleSheet.absoluteFillObject} />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['#FFE680', '#FFC200', '#FF8A60']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                    <GlyphField color="#FFFFFF" rise={150} />
                  </>
                )}
                <View style={styles.sponsorBadge}>
                  <WwIcon name="sparkle" size={13} color="#7A5C00" strokeWidth={1.8} />
                  <Text style={styles.sponsorBadgeText}>{t('sponsor.badge')}</Text>
                </View>
                <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
                  <WwIcon name="close" size={18} color="#1F2D3A" strokeWidth={1.8} />
                </Pressable>
              </View>

              {/* logo overlapping the cover */}
              <View style={styles.avatarRing}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="contain" />
                ) : (
                  <WwIcon name="store" size={40} color="#E0A800" strokeWidth={1.3} />
                )}
              </View>

              <View style={styles.body}>
                <Text style={styles.name}>{partner.name}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.categoryChip}>
                    <WwIcon name={CATEGORY_ICON[partner.category] ?? 'store'} size={14} color="#5D6D7E" strokeWidth={1.6} />
                    <Text style={styles.categoryText}>{partner.category}</Text>
                  </View>
                  {!!place && (
                    <View style={styles.placeChip}>
                      <WwIcon name="pin" size={14} color="#8A96A1" strokeWidth={1.6} />
                      <Text style={styles.placeText} numberOfLines={1}>{place}</Text>
                    </View>
                  )}
                </View>

                {!!partner.description && <Text style={styles.description}>{partner.description}</Text>}

                {!!partner.website && (
                  <Pressable
                    onPress={() => openExternal(partner.website as string)}
                    accessibilityRole="link"
                    accessibilityLabel={`${t('sponsor.website')} ${prettyHost(partner.website)}`}
                    style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
                  >
                    <View style={styles.primaryIcon}>
                      <WwIcon name="globe" size={20} color="#FFD700" strokeWidth={1.6} />
                    </View>
                    <View style={styles.primaryText}>
                      <Text style={styles.primaryLabel}>{t('sponsor.website')}</Text>
                      <Text style={styles.primaryHost} numberOfLines={1}>{prettyHost(partner.website)}</Text>
                    </View>
                    <View style={styles.primaryArrow}>
                      <WwIcon name="arrow" size={18} color="#FFD700" strokeWidth={1.8} />
                    </View>
                  </Pressable>
                )}

                {secondary.length > 0 && (
                  <View style={styles.actions}>
                    {secondary.map((a) => (
                      <Pressable
                        key={a.key}
                        onPress={() => openExternal(a.url)}
                        accessibilityRole="link"
                        accessibilityLabel={a.label}
                        style={({ pressed }) => [styles.action, { backgroundColor: a.tone }, pressed && styles.pressed]}
                      >
                        <WwIcon name={a.icon} size={18} color="#1F2D3A" strokeWidth={1.6} />
                        <Text style={styles.actionText}>{a.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,32,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({ web: { backdropFilter: 'blur(6px)' } as any, default: {} }),
  },
  shell: { width: '100%', maxWidth: 400, maxHeight: '92%', padding: 6, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' },
  core: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 40px 80px -30px rgba(15,23,32,0.55)' } as any, default: {} }),
  },
  cover: { height: 140, overflow: 'hidden', justifyContent: 'space-between' },
  sponsorBadge: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFD700', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  sponsorBadgeText: { fontFamily: FONT_DISPLAY, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, color: '#5C4400', textTransform: 'uppercase' },
  close: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  avatarRing: {
    marginTop: -44,
    marginLeft: 22,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 16px 28px -14px rgba(31,45,58,0.5)' } as any, default: {} }),
  },
  avatar: { width: '100%', height: '100%' },
  body: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22 },
  name: { fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 30, fontWeight: '800', color: '#1F2D3A', letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  categoryText: { fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: '700', color: '#5D6D7E', textTransform: 'capitalize' },
  placeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  placeText: { fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: '600', color: '#8A96A1', flexShrink: 1 },
  description: { fontFamily: FONT_DISPLAY, fontSize: 15, lineHeight: 23, color: '#5D6D7E', marginTop: 16 },
  primaryAction: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, backgroundColor: '#1F2D3A', borderRadius: 999, paddingLeft: 8, paddingRight: 8, paddingVertical: 8 },
  primaryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  primaryText: { flex: 1 },
  primaryLabel: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  primaryHost: { fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  primaryArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  actionText: { fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: '800', color: '#1F2D3A' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

export default SponsorModal;
