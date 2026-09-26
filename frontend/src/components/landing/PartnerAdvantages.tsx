import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import WwIcon, { WwIconName } from '../ui/WwIcon';
import Reveal from './Reveal';
import { useTranslation } from '../../i18n/useTranslation';
import { FONT_DISPLAY } from '../../theme/fonts';

const ADVANTAGES: { icon: WwIconName; key: 'visibility' | 'footfall' | 'prize' | 'managed'; tint: string }[] = [
  { icon: 'megaphone', key: 'visibility', tint: '#FFE9A8' },
  { icon: 'pin', key: 'footfall', tint: '#CFF1EC' },
  { icon: 'gift', key: 'prize', tint: '#FFD9CC' },
  { icon: 'shield', key: 'managed', tint: '#E4E1FA' },
];

interface PartnerAdvantagesProps {
  onBecomePartner: () => void;
}

/** "For businesses" pitch: four advantage cards (nested bezel style) and a call to action. */
const PartnerAdvantages: React.FC<PartnerAdvantagesProps> = ({ onBecomePartner }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Reveal>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>{t('landing.partners.eyebrow')}</Text>
        </View>
        <Text style={styles.title}>{t('landing.partners.title')}</Text>
        <Text style={styles.subtitle}>{t('landing.partners.subtitle')}</Text>
      </Reveal>

      <View style={styles.grid}>
        {ADVANTAGES.map((a, i) => (
          <Reveal key={a.key} delay={i * 110} style={styles.cardWrap}>
            <View style={styles.shell}>
              <View style={styles.core}>
                <View style={[styles.iconDisc, { backgroundColor: a.tint }]}>
                  <WwIcon name={a.icon} size={26} color="#1F2D3A" strokeWidth={1.4} />
                </View>
                <Text style={styles.cardTitle}>{t(`landing.partners.items.${a.key}.title`)}</Text>
                <Text style={styles.cardBody}>{t(`landing.partners.items.${a.key}.body`)}</Text>
              </View>
            </View>
          </Reveal>
        ))}
      </View>

      <Reveal delay={200}>
        <TouchableOpacity activeOpacity={0.9} style={styles.cta} onPress={onBecomePartner} accessibilityRole="button">
          <Text style={styles.ctaText}>{t('landing.partners.cta')}</Text>
          <View style={styles.ctaIcon}>
            <WwIcon name="arrow" size={18} color="#FFD700" strokeWidth={1.8} />
          </View>
        </TouchableOpacity>
      </Reveal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { width: '100%', maxWidth: 420, alignItems: 'flex-start' },
  eyebrow: { alignSelf: 'flex-start', backgroundColor: '#E4E1FA', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  eyebrowText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#4B3FA8', textTransform: 'uppercase' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, lineHeight: 34, fontWeight: '800', color: '#1F2D3A', letterSpacing: -0.5 },
  subtitle: { fontFamily: FONT_DISPLAY, fontSize: 15, lineHeight: 23, color: '#5D6D7E', marginTop: 8, marginBottom: 20 },
  grid: { width: '100%', gap: 14 },
  cardWrap: { width: '100%' },
  shell: {
    padding: 5,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.07)',
  },
  core: {
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    padding: 18,
    ...Platform.select({ web: { boxShadow: '0 18px 36px -24px rgba(31,45,58,0.28), inset 0 1px 1px rgba(255,255,255,0.9)' } as any, default: {} }),
  },
  iconDisc: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: '800', color: '#1F2D3A' },
  cardBody: { fontFamily: FONT_DISPLAY, fontSize: 14, lineHeight: 21, color: '#5D6D7E', marginTop: 4 },
  cta: {
    marginTop: 22,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1F2D3A',
    borderRadius: 999,
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 8,
  },
  ctaText: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  ctaIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});

export default PartnerAdvantages;
