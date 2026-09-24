import axios from 'axios';
import * as Location from 'expo-location';

export interface LocationData {
  city: string;
  regionName: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

// Country from the visitor's IP only - no permission prompt, so it is safe to
// run at app start (used for the default language). null on any failure.
export const detectCountryCode = async (): Promise<string | null> => {
  try {
    const response = await axios.get('https://ipapi.co/json/', { timeout: 4000 });
    const code = response.data?.country_code;
    return typeof code === 'string' && code.length === 2 ? code.toUpperCase() : null;
  } catch {
    return null;
  }
};

// Try GPS location first, fall back to IP geolocation
export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    // First, try to get GPS location
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        // Reverse geocode to get city/country
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          return {
            city: place.city || place.subregion || 'Bangkok',
            regionName: place.region || 'Bangkok',
            country: place.country || 'Thailand',
            countryCode: place.isoCountryCode || 'TH',
            lat: location.coords.latitude,
            lon: location.coords.longitude,
          };
        }
      } catch (gpsError) {
        // fall back to IP geolocation
      }
    }
    
    // Fallback to IP geolocation
    const response = await axios.get('https://ipapi.co/json/');
    if (response.data) {
      return {
        city: response.data.city || 'Bangkok',
        regionName: response.data.region || 'Bangkok',
        country: response.data.country_name || 'Thailand',
        countryCode: response.data.country_code || 'TH',
        lat: response.data.latitude || 13.7563,
        lon: response.data.longitude || 100.5018,
      };
    }
    
    // Final fallback to Bangkok
    return {
      city: 'Bangkok',
      regionName: 'Bangkok',
      country: 'Thailand',
      countryCode: 'TH',
      lat: 13.7563,
      lon: 100.5018,
    };
  } catch (error) {
    console.error('Failed to get user location:', error);
    // Return Bangkok as fallback
    return {
      city: 'Bangkok',
      regionName: 'Bangkok',
      country: 'Thailand',
      countryCode: 'TH',
      lat: 13.7563,
      lon: 100.5018,
    };
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};