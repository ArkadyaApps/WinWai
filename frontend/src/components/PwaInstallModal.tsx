import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePwaInstallStore } from '../store/pwaInstallStore';
import { useTranslation } from '../i18n/useTranslation';

interface PwaInstallModalProps {
  visible: boolean;
  onClose: () => void;
}

const ICON_URI = '/icon-192.png';

const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { deferredPrompt, isIOS, promptInstall } = usePwaInstallStore();

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'unavailable') onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#2C3E50" />
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <Image source={{ uri: ICON_URI }} style={styles.icon} resizeMode="contain" />
          )}

          <Text style={styles.title}>{t('pwaInstall.title')}</Text>
          <Text style={styles.description}>{t('pwaInstall.description')}</Text>

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

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.notNow}>{t('pwaInstall.notNow')}</Text>
          </TouchableOpacity>
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
    maxWidth: 380,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
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
  notNow: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default PwaInstallModal;
