import axios from 'axios';

interface LocationData {
  city: string;
  regionName: string;
  country: string;
  lat: number;
  lon: number;
}

export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    const response = await axios.get('http://ip-api.com/json/');
    if (response.data.status === 'success') {
      return {
        city: response.data.city,
        regionName: response.data.regionName,
        country: response.data.country,
        lat: response.data.lat,
        lon: response.data.lon,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get user location:', error);
    return null;
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