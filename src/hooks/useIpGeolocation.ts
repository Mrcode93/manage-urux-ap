import { useState, useEffect, useCallback } from 'react';
import { 
  fetchLocationFromIP, 
  isUnknownLocation, 
  hasUnknownStoredLocation,
  type LocationData 
} from '../utils/ipGeolocation';

interface UseIpGeolocationReturn {
  ipLocations: Record<string, LocationData>;
  loadingLocations: Set<string>;
  fetchLocation: (ip: string) => Promise<LocationData | null>;
  refreshLocation: (ip: string) => Promise<LocationData | null>;
  clearCache: () => void;
}

export const useIpGeolocation = (): UseIpGeolocationReturn => {
  const [ipLocations, setIpLocations] = useState<Record<string, LocationData>>({});
  const [loadingLocations, setLoadingLocations] = useState<Set<string>>(new Set());

  const fetchLocation = useCallback(async (ip: string): Promise<LocationData | null> => {
    if (!ip || ip === 'Unknown' || ip === 'unknown' || ip === 'N/A') {
      return null;
    }

    // Check if already loading
    if (loadingLocations.has(ip)) {
      return ipLocations[ip] || null;
    }

    // Check if already cached
    if (ipLocations[ip]) {
      return ipLocations[ip];
    }

    // Set loading state
    setLoadingLocations(prev => new Set([...prev, ip]));

    try {
      const location = await fetchLocationFromIP(ip);
      if (location) {
        setIpLocations(prev => ({ ...prev, [ip]: location }));
      }
      return location;
    } catch (error) {
      console.error('Error fetching location for IP:', ip, error);
      return null;
    } finally {
      // Clear loading state
      setLoadingLocations(prev => {
        const updated = new Set(prev);
        updated.delete(ip);
        return updated;
      });
    }
  }, [ipLocations, loadingLocations]);

  const refreshLocation = useCallback(async (ip: string): Promise<LocationData | null> => {
    // Remove from cache to force refresh
    setIpLocations(prev => {
      const updated = { ...prev };
      delete updated[ip];
      return updated;
    });

    return fetchLocation(ip);
  }, [fetchLocation]);

  const clearCache = useCallback(() => {
    setIpLocations({});
    setLoadingLocations(new Set());
  }, []);

  return {
    ipLocations,
    loadingLocations,
    fetchLocation,
    refreshLocation,
    clearCache
  };
};

// Hook specifically for handling unknown locations
export const useUnknownLocationHandler = (devices: any[]) => {
  const { ipLocations, loadingLocations, fetchLocation, refreshLocation } = useIpGeolocation();
  const [processedDevices, setProcessedDevices] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleUnknownLocations = async () => {
      const unknownLocationDevices = devices.filter(device => {
        if (!device.ip || device.ip === 'Unknown' || device.ip === 'unknown') {
          return false;
        }

        // Use the enhanced unknown location detection
        const isStoredUnknown = hasUnknownStoredLocation(device);

        // Only process if we haven't processed this device before and it's not already loading
        return isStoredUnknown && 
               !processedDevices.has(device.ip) && 
               !loadingLocations.has(device.ip) &&
               !ipLocations[device.ip];
      });

      if (unknownLocationDevices.length > 0) {
        
        
        // Mark these devices as processed
        const newProcessedDevices = new Set(processedDevices);
        unknownLocationDevices.forEach(device => newProcessedDevices.add(device.ip));
        setProcessedDevices(newProcessedDevices);

        // Fetch locations for devices with unknown stored locations
        for (const device of unknownLocationDevices) {
          
          await fetchLocation(device.ip);
        }
      }
    };

    if (devices.length > 0) {
      handleUnknownLocations();
    }
  }, [devices]); // Only depend on devices, not on ipLocations or loadingLocations

  return { ipLocations, loadingLocations, refreshLocation };
}; 