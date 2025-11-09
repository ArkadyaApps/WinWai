import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useAdminStore } from '../../src/store/adminStore';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BannerAdComponent from '../../src/components/BannerAd';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/utils/api';

export default function ProfileScreen() {
  const { user, setUser } = useUserStore();
  const { adminMode, setAdminMode, initializeAdminMode } = useAdminStore();
  const { signOut } = useAuth();
  const router = useRouter();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    initializeAdminMode();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleAdminToggle = async (value: boolean) => {
    await setAdminMode(value);
    Alert.alert(
      value ? 'Admin Mode Enabled' : 'Admin Mode Disabled',
      value 
        ? 'You now have access to admin management features.'
        : 'Admin features are now hidden.'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#FFD700', '#FFC200']}
          style={styles.profileHeader}
        >
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#ffffff" />
            </View>
          )}
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
              <Text style={styles.adminText}>ADMIN</Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.tickets || 0}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.dailyStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Admin Mode Toggle */}
        {isAdmin && (
          <View style={styles.adminToggleCard}>
            <View style={styles.adminToggleHeader}>
              <View style={styles.adminToggleInfo}>
                <Text style={styles.adminToggleTitle}>Admin Mode</Text>
                <Text style={styles.adminToggleSubtitle}>
                  {adminMode ? 'Management features visible' : 'Hidden from view'}
                </Text>
              </View>
              <Switch
                value={adminMode}
                onValueChange={handleAdminToggle}
                trackColor={{ false: '#D1D5DB', true: '#FFD700' }}
                thumbColor={adminMode ? '#000' : '#f4f3f4'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>
        )}

        {/* Admin Panel */}
        {isAdmin && adminMode && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Admin Panel</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.adminMenuItem}
              onPress={() => router.push('/admin/partners')}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.adminMenuGradient}
              >
                <Ionicons name="business" size={24} color="#fff" />
                <View style={styles.adminMenuText}>
                  <Text style={styles.adminMenuTitle}>Manage Partners</Text>
                  <Text style={styles.adminMenuSubtitle}>Add, edit, remove partners</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.adminMenuItem}
              onPress={() => router.push('/admin/users')}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.adminMenuGradient}
              >
                <Ionicons name="people" size={24} color="#fff" />
                <View style={styles.adminMenuText}>
                  <Text style={styles.adminMenuTitle}>Manage Users</Text>
                  <Text style={styles.adminMenuSubtitle}>View and manage all users</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.adminMenuItem}
              onPress={() => router.push('/admin/raffles')}
            >
              <LinearGradient
                colors={['#A8E6CF', '#88D8B0']}
                style={styles.adminMenuGradient}
              >
                <Ionicons name="gift" size={24} color="#fff" />
                <View style={styles.adminMenuText}>
                  <Text style={styles.adminMenuTitle}>Manage Raffles</Text>
                  <Text style={styles.adminMenuSubtitle}>Create, edit, draw winners</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleGray}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#2C3E50" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="language-outline" size={24} color="#2C3E50" />
            <Text style={styles.menuText}>Language</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleGray}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#2C3E50" />
            <Text style={styles.menuText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color="#2C3E50" />
            <Text style={styles.menuText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#2C3E50" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>WinWai v1.0.0</Text>
        <View style={{ height: 80 }} />
      </ScrollView>

      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingBottom: 80,
  },
  profileHeader: {
    padding: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#333',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  adminText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -32,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  adminToggleCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
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
  adminToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminToggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  adminToggleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  adminToggleSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  sectionTitleGray: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  adminMenuItem: {
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  adminMenuGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  adminMenuText: {
    flex: 1,
  },
  adminMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  adminMenuSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
});