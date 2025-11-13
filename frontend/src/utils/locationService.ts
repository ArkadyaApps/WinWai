import axios from 'axios';

interface LocationData {
  city: string;
  regionName: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    // Use HTTPS endpoint for better compatibility
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
    // Fallback to Bangkok
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