import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { getUserLocation } from '../utils/locationService';
import { theme } from '../theme/tokens';

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

export default function LocationFilter({ selectedLocation, onLocationChange }: LocationFilterProps) {
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
    detectUserLocation();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/api/raffles/locations/list');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectUserLocation = async () => {
    try {
      const location = await getUserLocation();
      if (location && location.city) {
        setUserLocation(location.city);
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

  const handleUseMyLocation = async () => {
    if (userLocation) {
      // Check if user's location matches any available location
      const matchingLocation = locations.find(
        loc => loc.toLowerCase() === userLocation.toLowerCase()
      );
      if (matchingLocation) {
        onLocationChange(matchingLocation);
      } else {
        // Use the detected location even if not in the list
        onLocationChange(userLocation);
      }
    } else {
      // Try to detect location again
      setDetectingLocation(true);
      try {
        const location = await getUserLocation();
        if (location && location.city) {
          setUserLocation(location.city);
          const matchingLocation = locations.find(
            loc => loc.toLowerCase() === location.city.toLowerCase()
          );
          if (matchingLocation) {
            onLocationChange(matchingLocation);
          } else {
            onLocationChange(location.city);
          }
        }
      } catch (error) {
        console.error('Failed to detect location:', error);
      } finally {
        setDetectingLocation(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.colors.primaryGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Locations */}
        <TouchableOpacity
          style={[styles.locationPill, selectedLocation === 'all' && styles.locationPillActive]}
          onPress={() => onLocationChange('all')}
        >
          <Text style={[styles.locationText, selectedLocation === 'all' && styles.locationTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {/* Use My Location */}
        <TouchableOpacity
          style={[
            styles.locationPill,
            styles.myLocationPill,
            selectedLocation === userLocation && styles.locationPillActive
          ]}
          onPress={handleUseMyLocation}
          disabled={detectingLocation}
        >
          {detectingLocation ? (
            <ActivityIndicator size="small" color={theme.colors.primaryGold} />
          ) : (
            <>
              <Ionicons 
                name="navigate" 
                size={14} 
                color={selectedLocation === userLocation ? '#000' : theme.colors.emeraldA} 
              />
              <Text 
                style={[
                  styles.locationText, 
                  styles.myLocationText,
                  selectedLocation === userLocation && styles.locationTextActive
                ]}
              >
                Use My Location
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Dynamic Locations */}
        {locations.map((location) => (
          <TouchableOpacity
            key={location}
            style={[styles.locationPill, selectedLocation === location && styles.locationPillActive]}
            onPress={() => onLocationChange(location)}
          >
            <Text style={[styles.locationText, selectedLocation === location && styles.locationTextActive]}>
              {location}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.cloud,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  locationPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationPillActive: {
    backgroundColor: theme.colors.primaryGold,
    borderColor: theme.colors.primaryGold,
  },
  myLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: theme.colors.emeraldA,
    borderWidth: 1.5,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  myLocationText: {
    color: theme.colors.emeraldA,
  },
  locationTextActive: {
    color: '#000',
  },
});
