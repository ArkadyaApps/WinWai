import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePwaInstallStore } from '../store/pwaInstallStore';
import { useLanguageStore } from '../store/languageStore';
import { useTranslation } from '../i18n/useTranslation';
import { translations } from '../utils/translations';
import WwIcon, { WwIconName } from './ui/WwIcon';

interface PwaInstallModalProps {
  visible: boolean;
  onClose: () => void;
  /**
   * First-visit mode: leads with "how WinWai works" and adds the install offer
   * only when there is something to install (browser prompt available, or iOS
   * manual steps). Without it (Profile menu) the modal is the install offer alone.
   */
  withHelper?: boolean;
}

const ICON_URI = '/icon-192.png';

const STEPS: { icon: WwIconName; key: 'earnTicketsStep' | 'watchAdsStep' | 'enterRafflesStep' | 'winPrizesStep' }[] = [
  { icon: 'ticket', key: 'earnTicketsStep' },
  { icon: 'play', key: 'watchAdsStep' },
  { icon: 'gift', key: 'enterRafflesStep' },
  { icon: 'trophy', key: 'winPrizesStep' },
];

const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ visible, onClose, withHelper = false }) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const tr = translations[language];
  const { deferredPrompt, isIOS, isStandalone, promptInstall } = usePwaInstallStore();

  const canInstall = !isStandalone && (isIOS || !!deferredPrompt);
  const showInstall = withHelper ? canInstall : true;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'unavailable') onClose();
  };

  const installBlock = showInstall ? (
    <>
      {withHelper ? (
        <View style={styles.installHeader}>
          {Platform.OS === 'web' && <Image source={{ uri: ICON_URI }} style={styles.smallIcon} resizeMode="contain" />}
          <View style={styles.installHeaderText}>
            <Text style={styles.installTitle}>{t('pwaInstall.title')}</Text>
            <Text style={styles.installDescription}>{t('pwaInstall.description')}</Text>
          </View>
        </View>
      ) : (
        <>
          {Platform.OS === 'web' && <Image source={{ uri: ICON_URI }} style={styles.icon} resizeMode="contain" />}
          <Text style={styles.title}>{t('pwaInstall.title')}</Text>
          <Text style={styles.description}>{t('pwaInstall.description')}</Text>
        </>
      )}

      {isIOS ? (
        <View style={styles.iosInstructions}>
          <Ionicons name="share-outline" size={22} color="#2C3E50" />
          <Text style={styles.iosText}>{t('pwaInstall.iosInstructions')}</Text>
        </View>
      ) : deferredPrompt ? (
        <TouchableOpacity style={styles.installButton} onPress={handleInstall}>
          <Text style={styles.installButtonText}>{t('pwaInstall.installButton')}</Text>
        </TouchableOpacity>
      ) : null}
    </>
  ) : null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#2C3E50" />
          </TouchableOpacity>

          {withHelper ? (
            <ScrollView contentContainerStyle={styles.helperContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{tr.howItWorks}</Text>
              <View style={styles.steps}>
                {STEPS.map((step, i) => (
                  <View key={step.key} style={styles.step}>
                    <View style={styles.stepIcon}><WwIcon name={step.icon} size={28} color="#1F2D3A" strokeWidth={1.4} /></View>
                    <Text style={styles.stepText}>{`${i + 1}. ${tr[step.key]}`}</Text>
                  </View>
                ))}
              </View>

              {showInstall && <View style={styles.divider} />}
              {installBlock}

              <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
                <Text style={styles.gotItText}>{tr.gotIt}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              {installBlock}
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.notNow}>{t('pwaInstall.notNow')}</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  helperContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  step: {
    width: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  stepIcon: { marginBottom: 8 },
  stepText: { fontSize: 12, fontWeight: '700', color: '#2C3E50', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#eee', alignSelf: 'stretch', marginVertical: 16 },
  installHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', marginBottom: 14 },
  smallIcon: { width: 44, height: 44, borderRadius: 12 },
  installHeaderText: { flex: 1 },
  installTitle: { fontSize: 15, fontWeight: '800', color: '#2C3E50' },
  installDescription: { fontSize: 12, color: '#7F8C8D', lineHeight: 17, marginTop: 2 },
  installButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  installButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  iosInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    width: '100%',
  },
  iosText: {
    flex: 1,
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 18,
  },
  gotItButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 14,
    borderRadius: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 12,
  },
  gotItText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notNow: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default PwaInstallModal;
