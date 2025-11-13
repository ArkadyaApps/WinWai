import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch, Platform, TextInput, Modal, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useAdminStore } from '../../src/store/adminStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { translations } from '../../src/utils/translations';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BannerAdComponent from '../../src/components/BannerAd';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/utils/api';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const { user, setUser } = useUserStore();
  const { adminMode, setAdminMode, initializeAdminMode } = useAdminStore();
  const { language, setLanguage, initializeLanguage } = useLanguageStore();
  const t = translations[language];
  const { signOut, changePassword } = useAuth();
  const router = useRouter();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { initializeAdminMode(); initializeLanguage(); }, []);
  useEffect(() => { if (user) setFormData({ name: user.name, email: user.email, phone: user.phone || '' }); }, [user]);

  const isAdmin = user?.role === 'admin';

  const handleSignOut = () => {
    Alert.alert(t.signOut, t.areYouSure, [
      { text: t.cancel, style: 'cancel' },
      { text: t.signOut, style: 'destructive', onPress: async () => {
        try { await signOut(); setTimeout(() => { router.push('/'); }, 100); } catch (e) { Alert.alert(t.error, 'Failed to sign out. Please try again.'); }
      }}
    ]);
  };

  const handleAdminToggle = async (value: boolean) => {
    await setAdminMode(value);
    Alert.alert(value ? t.adminModeEnabled : t.adminModeDisabled, value ? t.adminAccessMessage : t.adminFeaturesHidden);
  };

  const handleEditProfile = () => setEditModalVisible(true);

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.email) { Alert.alert(t.error, t.nameEmailRequired); return; }
    try { setSaving(true); const response = await api.put('/api/users/me/profile', formData); setUser(response.data); setEditModalVisible(false); Alert.alert(t.success, t.profileUpdated); }
    catch (error: any) { Alert.alert(t.error, error.response?.data?.detail || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(t.error, t.passwordsDontMatch);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert(t.error, t.passwordMin6);
      return;
    }
    try {
      setSaving(true);
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setChangePasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert(t.success, t.passwordChanged);
    } catch (error: any) {
      Alert.alert(t.error, error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Check if user has password (not OAuth-only)
  const hasPassword = user && !user.picture?.includes('google');

  const handleLanguageChange = async (lang: 'en' | 'th' | 'fr') => { await setLanguage(lang); setLanguageModalVisible(false); Alert.alert(t.language, `${getLanguageName(lang)}`); };

  const getLanguageName = (lang: string) => lang === 'th' ? 'ภาษาไทย (Thai)' : lang === 'fr' ? 'Français (French)' : 'English';
  const getLanguageFlag = (lang: string) => lang === 'th' ? '🇹🇭' : lang === 'fr' ? '🇫🇷' : '🇺🇸';

  return (
    <View style={styles.container}>
      <AppHeader variant="gold" logoUri="https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png" showDivider />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={theme.colors.primaryGold} />
            </View>
          )}
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
              <Text style={styles.adminText}>ADMIN</Text>
            </View>
          )}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}><Text style={styles.statValue}>{user?.tickets || 0}</Text><Text style={styles.statLabel}>{t.tickets}</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>{user?.dailyStreak || 0}</Text><Text style={styles.statLabel}>{t.dayStreak}</Text></View>
        </View>

        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editProfileText}>{t.editProfile}</Text>
        </TouchableOpacity>

        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primaryGold} />
              <Text style={styles.sectionTitle}>{t.adminPanel}</Text>
            </View>
            
            {/* Admin Mode Toggle */}
            <TouchableOpacity 
              style={styles.adminToggleItem} 
              onPress={() => handleAdminToggle(!adminMode)}
            >
              <View style={styles.adminToggleContent}>
                <Ionicons name="settings" size={24} color={theme.colors.onyx} />
                <View style={styles.adminToggleText}>
                  <Text style={styles.adminToggleTitle}>{t.adminMode}</Text>
                  <Text style={styles.adminToggleSubtitle}>
                    {adminMode ? t.adminFeaturesEnabled : t.enableAdminFeatures}
                  </Text>
                </View>
              </View>
              <View style={[styles.toggle, adminMode && styles.toggleActive]}>
                <View style={[styles.toggleCircle, adminMode && styles.toggleCircleActive]} />
              </View>
            </TouchableOpacity>

            {adminMode && (
              <>
                <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/partners')}>
                  <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={styles.adminMenuGradient}>
                    <Ionicons name="business" size={24} color="#fff" />
                    <View style={styles.adminMenuText}><Text style={styles.adminMenuTitle}>{t.managePartners}</Text><Text style={styles.adminMenuSubtitle}>{t.addEditRemovePartners}</Text></View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/users')}>
                  <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.adminMenuGradient}>
                    <Ionicons name="people" size={24} color="#fff" />
                    <View style={styles.adminMenuText}><Text style={styles.adminMenuTitle}>{t.manageUsers}</Text><Text style={styles.adminMenuSubtitle}>{t.viewManageUsers}</Text></View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/raffles')}>
                  <LinearGradient colors={["#A8E6CF", "#88D8B0"]} style={styles.adminMenuGradient}>
                    <Ionicons name="gift" size={24} color="#fff" />
                    <View style={styles.adminMenuText}><Text style={styles.adminMenuTitle}>{t.manageRaffles}</Text><Text style={styles.adminMenuSubtitle}>{t.createEditDrawWinners}</Text></View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleGray}>{t.account}</Text>
          {hasPassword && (
            <TouchableOpacity style={styles.menuItem} onPress={() => setChangePasswordModalVisible(true)}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.colors.onyx} />
              <Text style={styles.menuText}>{t.changePassword}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/referral')}>
            <Ionicons name="gift-outline" size={24} color={theme.colors.primaryGold} />
            <Text style={styles.menuText}>{t.inviteFriends}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert(t.notifications, 'Notification settings coming soon!')}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.onyx} />
            <Text style={styles.menuText}>{t.notifications}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setLanguageModalVisible(true)}>
            <Ionicons name="language-outline" size={24} color={theme.colors.onyx} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.menuText}>{t.language}</Text>
              <Text style={styles.currentLanguage}>{getLanguageFlag(language)} {getLanguageName(language)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleGray}>{t.support}</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert(t.helpCenter, t.needHelp)}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.onyx} />
            <Text style={styles.menuText}>{t.helpCenter}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert(t.termsConditions, t.viewTerms)}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.onyx} />
            <Text style={styles.menuText}>{t.termsConditions}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert(t.privacyPolicy, t.viewPrivacy)}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.onyx} />
            <Text style={styles.menuText}>{t.privacyPolicy}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.danger} />
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>WinWai v1.0.0</Text>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{t.editProfile}</Text><TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity></View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>{t.name} *</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder={t.yourName} placeholderTextColor="#999" />
              <Text style={styles.label}>{t.email} *</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} placeholder={t.emailAddress} placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>{t.phone}</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} placeholder={t.phoneNumber} placeholderTextColor="#999" keyboardType="phone-pad" />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>{saving ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.saveButtonText}>{t.saveChanges}</Text>)}</TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Selection Modal */}
      <Modal visible={languageModalVisible} animationType="slide" transparent onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{t.selectLanguage}</Text><TouchableOpacity onPress={() => setLanguageModalVisible(false)}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity></View>
            <View style={styles.languageList}>
              <TouchableOpacity style={[styles.languageOption, language === 'en' && styles.languageOptionActive]} onPress={() => handleLanguageChange('en')}>
                <Text style={styles.languageFlag}>🇺🇸</Text>
                <Text style={styles.languageText}>English</Text>
                {language === 'en' && (<Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />)}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.languageOption, language === 'th' && styles.languageOptionActive]} onPress={() => handleLanguageChange('th')}>
                <Text style={styles.languageFlag}>🇹🇭</Text>
                <Text style={styles.languageText}>ภาษาไทย (Thai)</Text>
                {language === 'th' && (<Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />)}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.languageOption, language === 'fr' && styles.languageOptionActive]} onPress={() => handleLanguageChange('fr')}>
                <Text style={styles.languageFlag}>🇫🇷</Text>
                <Text style={styles.languageText}>Français (French)</Text>
                {language === 'fr' && (<Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />)}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordModalVisible} animationType="slide" transparent onRequestClose={() => setChangePasswordModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.changePassword}</Text>
              <TouchableOpacity onPress={() => { setChangePasswordModalVisible(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>{t.currentPassword} *</Text>
              <TextInput 
                style={styles.input} 
                value={passwordData.currentPassword} 
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })} 
                placeholder={t.enterCurrentPassword} 
                placeholderTextColor="#999" 
                secureTextEntry 
                autoCapitalize="none" 
              />
              <Text style={styles.label}>{t.newPassword} *</Text>
              <TextInput 
                style={styles.input} 
                value={passwordData.newPassword} 
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })} 
                placeholder={t.enterNewPassword} 
                placeholderTextColor="#999" 
                secureTextEntry 
                autoCapitalize="none" 
              />
              <Text style={styles.label}>{t.confirmPassword} *</Text>
              <TextInput 
                style={styles.input} 
                value={passwordData.confirmPassword} 
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })} 
                placeholder={t.reenterNewPassword} 
                placeholderTextColor="#999" 
                secureTextEntry 
                autoCapitalize="none" 
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={saving}>
                {saving ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.saveButtonText}>{t.changePassword}</Text>)}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  content: { paddingBottom: 80 },
  profileHeader: { padding: 32, paddingTop: 24, alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }, android: { elevation: 4 } }) },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, borderWidth: 4, borderColor: theme.colors.primaryGold },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.cloud, borderWidth: 4, borderColor: theme.colors.primaryGold, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: '700', color: theme.colors.onyx, marginBottom: 4 },
  email: { fontSize: 14, color: theme.colors.slate },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryGold, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12, gap: 6 },
  adminText: { fontSize: 12, fontWeight: '700', color: '#000' },
  statsCard: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: 16, marginTop: -32, marginBottom: 16, padding: 20, borderRadius: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700', color: theme.colors.onyx },
  statLabel: { fontSize: 14, color: theme.colors.slate, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: theme.colors.line },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  section: { backgroundColor: '#ffffff', marginBottom: 16, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 2 } }) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.onyx },
  sectionTitleGray: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  adminToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  adminToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  adminToggleText: {
    flex: 1,
  },
  adminToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onyx,
    marginBottom: 2,
  },
  adminToggleSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: theme.colors.emeraldA,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  adminMenuItem: { marginBottom: 12, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }, android: { elevation: 4 } }) },
  adminMenuGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  adminMenuText: { flex: 1 },
  adminMenuTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  adminMenuSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  menuText: { flex: 1, fontSize: 16, color: theme.colors.onyx },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 2, borderColor: theme.colors.danger },
  signOutText: { fontSize: 16, fontWeight: '600', color: theme.colors.danger },
  version: { textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onyx },
  formContainer: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.onyx, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, color: theme.colors.onyx },
  saveButton: { backgroundColor: '#4ECDC4', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  currentLanguage: { fontSize: 13, color: theme.colors.slate, marginLeft: 8 },
  languageList: { padding: 20 },
  languageOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12, marginBottom: 12, gap: 12 },
  languageOptionActive: { backgroundColor: '#E8F8F7', borderWidth: 2, borderColor: '#4ECDC4' },
  languageFlag: { fontSize: 32 },
  languageText: { flex: 1, fontSize: 16, fontWeight: '600', color: theme.colors.onyx },
});
