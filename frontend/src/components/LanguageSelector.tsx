import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '../store/languageStore';
import { LinearGradient } from 'expo-linear-gradient';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', flag: '🇲🇦', nativeName: 'العربية' },
];

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguageStore();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  const handleSelectLanguage = async (code: string) => {
    await setLanguage(code as 'en' | 'th' | 'fr');
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{currentLanguage.flag}</Text>
        <Text style={styles.code}>{currentLanguage.code.toUpperCase()}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    language === lang.code && styles.languageItemActive,
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  {language === lang.code ? (
                    <LinearGradient
                      colors={['#FFD700', '#FFC200']}
                      style={styles.languageGradient}
                    >
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageNameActive}>{lang.nativeName}</Text>
                        <Text style={styles.languageSubActive}>{lang.name}</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={24} color="#000" />
                    </LinearGradient>
                  ) : (
                    <View style={styles.languageContent}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageName}>{lang.nativeName}</Text>
                        <Text style={styles.languageSub}>{lang.name}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  flag: {
    fontSize: 18,
  },
  code: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3E50',
  },
  languageList: {
    padding: 16,
    gap: 12,
  },
  languageItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemActive: {
    borderColor: '#FFD700',
  },
  languageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
  },
  languageNameActive: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  languageSub: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  languageSubActive: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
    fontWeight: '600',
  },
});

export default LanguageSelector;