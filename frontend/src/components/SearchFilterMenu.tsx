import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { getUserLocation } from '../utils/locationService';

interface SearchFilterMenuProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  selectedLocation: string;
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  userCity?: string;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: 'apps' },
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'hotel', name: 'Hotels & Accommodation', icon: 'bed' },
  { id: 'spa', name: 'Spa & Wellness', icon: 'fitness' },
  { id: 'gift-cards', name: 'Gift Cards', icon: 'card' },
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait' },
  { id: 'voucher', name: 'Vouchers', icon: 'ticket' },
];

const SearchFilterMenu: React.FC<SearchFilterMenuProps> = ({
  visible,
  onClose,
  selectedCategory,
  selectedLocation,
  onCategoryChange,
  onLocationChange,
  userCity,
}) => {
  const [locations, setLocations] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(userCity || null);

  useEffect(() => {
    if (visible) {
      loadLocations();
      if (!detectedLocation && !userCity) {
        detectUserLocation();
      }
    }
  }, [visible]);

  const loadLocations = async () => {
    try {
      const response = await api.get('/api/raffles/locations/list');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const detectUserLocation = async () => {
    try {
      const location = await getUserLocation();
      if (location && location.city) {
        setDetectedLocation(location.city);
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

  const handleUseMyLocation = async () => {
    if (detectedLocation) {
      onLocationChange(detectedLocation);
    } else {
      setDetectingLocation(true);
      try {
        const location = await getUserLocation();
        if (location && location.city) {
          setDetectedLocation(location.city);
          onLocationChange(location.city);
        }
      } catch (error) {
        console.error('Failed to detect location:', error);
      } finally {
        setDetectingLocation(false);
      }
    }
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Search & Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* User Location */}
            {userCity && (
              <View style={styles.locationBanner}>
                <Ionicons name="location" size={20} color="#4ECDC4" />
                <Text style={styles.locationText}>Your location: {userCity}</Text>
              </View>
            )}

            {/* Category Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.optionsGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.optionCard,
                      selectedCategory === category.id && styles.optionCardSelected,
                    ]}
                    onPress={() => onCategoryChange(category.id)}
                  >
                    {selectedCategory === category.id ? (
                      <LinearGradient
                        colors={['#FFD700', '#FFC200']}
                        style={styles.optionGradient}
                      >
                        <Ionicons name={category.icon as any} size={28} color="#fff" />
                        <Text style={styles.optionTextSelected}>{category.name}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.optionContent}>
                        <Ionicons name={category.icon as any} size={28} color="#7F8C8D" />
                        <Text style={styles.optionText}>{category.name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              {loadingLocations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFD700" />
                </View>
              ) : (
                <View style={styles.locationList}>
                  {/* All Locations */}
                  <TouchableOpacity
                    style={[
                      styles.locationItem,
                      selectedLocation === 'all' && styles.locationItemSelected,
                    ]}
                    onPress={() => onLocationChange('all')}
                  >
                    <View style={styles.locationItemContent}>
                      <Ionicons
                        name="apps-outline"
                        size={20}
                        color={selectedLocation === 'all' ? '#FFD700' : '#7F8C8D'}
                      />
                      <Text
                        style={[
                          styles.locationItemText,
                          selectedLocation === 'all' && styles.locationItemTextSelected,
                        ]}
                      >
                        All Locations
                      </Text>
                    </View>
                    {selectedLocation === 'all' && (
                      <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                    )}
                  </TouchableOpacity>

                  {/* Use My Location */}
                  <TouchableOpacity
                    style={[
                      styles.locationItem,
                      styles.myLocationItem,
                      selectedLocation === detectedLocation && styles.locationItemSelected,
                    ]}
                    onPress={handleUseMyLocation}
                    disabled={detectingLocation}
                  >
                    <View style={styles.locationItemContent}>
                      {detectingLocation ? (
                        <ActivityIndicator size="small" color="#4ECDC4" />
                      ) : (
                        <Ionicons
                          name="navigate"
                          size={20}
                          color={selectedLocation === detectedLocation ? '#FFD700' : '#4ECDC4'}
                        />
                      )}
                      <Text
                        style={[
                          styles.locationItemText,
                          styles.myLocationText,
                          selectedLocation === detectedLocation && styles.locationItemTextSelected,
                        ]}
                      >
                        Use My Location {detectedLocation && `(${detectedLocation})`}
                      </Text>
                    </View>
                    {selectedLocation === detectedLocation && (
                      <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                    )}
                  </TouchableOpacity>

                  {/* Dynamic Locations */}
                  {locations.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.locationItem,
                        selectedLocation === location && styles.locationItemSelected,
                      ]}
                      onPress={() => onLocationChange(location)}
                    >
                      <View style={styles.locationItemContent}>
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color={selectedLocation === location ? '#FFD700' : '#7F8C8D'}
                        />
                        <Text
                          style={[
                            styles.locationItemText,
                            selectedLocation === location && styles.locationItemTextSelected,
                          ]}
                        >
                          {location}
                        </Text>
                      </View>
                      {selectedLocation === location && (
                        <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Apply Button */}
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <LinearGradient
                colors={['#FFD700', '#FFC200']}
                style={styles.applyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.applyText}>Apply Filters</Text>
                <Ionicons name="checkmark" size={24} color="#000" />
              </LinearGradient>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#FFD700',
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionContent: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  optionTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationList: {
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  myLocationItem: {
    borderColor: '#4ECDC4',
    borderWidth: 1.5,
  },
  locationItemSelected: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  myLocationText: {
    color: '#4ECDC4',
  },
  locationItemTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  applyButton: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  applyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
});

export default SearchFilterMenu;