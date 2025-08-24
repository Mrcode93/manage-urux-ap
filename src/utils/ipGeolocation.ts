export interface LocationData {
  city?: string;
  country?: string;
  country_name?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
  source?: string;
  service?: string;
}

// Primary IP geolocation service (ipapi.co)
const fetchFromIpApi = async (ip: string): Promise<LocationData | null> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LicenseManager/1.0)'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Check if we got valid data (not error response)
      if (data.error || data.reserved || data.private) {
        return null;
      }
      
      return {
        city: data.city,
        country: data.country,
        country_name: data.country_name,
        region: data.region,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
        source: 'live_geolocation',
        service: 'ipapi.co'
      };
    }
  } catch (error) {
    console.error('Error fetching from ipapi.co:', error);
  }
  return null;
};

// Fallback service 1 (ip-api.com)
const fetchFromIpApiCom = async (ip: string): Promise<LocationData | null> => {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LicenseManager/1.0)'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          city: data.city,
          country: data.countryCode,
          country_name: data.country,
          region: data.regionName,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon,
          source: 'live_geolocation',
          service: 'ip-api.com'
        };
      }
    }
  } catch (error) {
    console.error('Error fetching from ip-api.com:', error);
  }
  return null;
};

// Fallback service 2 (ipinfo.io - requires API key but has free tier)
const fetchFromIpInfo = async (ip: string): Promise<LocationData | null> => {
  try {
    // Note: This requires an API key for production use
    // For now, we'll use the free endpoint which has rate limits
    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LicenseManager/1.0)'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.error) {
        return null;
      }
      
      // Parse location from "lat,lng" format
      let latitude, longitude;
      if (data.loc) {
        const [lat, lng] = data.loc.split(',').map(Number);
        latitude = lat;
        longitude = lng;
      }
      
      return {
        city: data.city,
        country: data.country,
        country_name: data.country,
        region: data.region,
        timezone: data.timezone,
        latitude,
        longitude,
        source: 'live_geolocation',
        service: 'ipinfo.io'
      };
    }
  } catch (error) {
    console.error('Error fetching from ipinfo.io:', error);
  }
  return null;
};

// Cache for IP locations to avoid repeated API calls
const locationCache = new Map<string, { data: LocationData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Check if location is "Unknown, Unknown"
export const isUnknownLocation = (location: any): boolean => {
  if (!location) return true;
  
  const city = location.city || '';
  const country = location.country || '';
  
  // Check for various "unknown" patterns
  const unknownPatterns = [
    'unknown',
    'Unknown',
    'UNKNOWN',
    'غير محدد',
    'غير معروف',
    'N/A',
    'n/a',
    'null',
    'undefined',
    ''
  ];
  
  return unknownPatterns.includes(city) && unknownPatterns.includes(country);
};

// Enhanced function to check if stored location data contains unknown values
export const hasUnknownStoredLocation = (device: any): boolean => {
  const city = device.location?.city;
  const country = device.location?.country;
  
  // Check if it's a JSON string with unknown values
  if (city && city.startsWith('{') && city.endsWith('}')) {
    try {
      const parsed = JSON.parse(city);
      const hasUnknownValues = Object.values(parsed).some((value: any) => {
        if (typeof value === 'string') {
          const unknownPatterns = [
            'unknown', 'Unknown', 'UNKNOWN', 'غير محدد', 'غير معروف', 'N/A', 'n/a', 'null', 'undefined', ''
          ];
          return unknownPatterns.includes(value.trim());
        }
        return false;
      });
      if (hasUnknownValues) return true;
    } catch (error) {
      // If parsing fails, treat as unknown
      return true;
    }
  }
  
  if (country && country.startsWith('{') && country.endsWith('}')) {
    try {
      const parsed = JSON.parse(country);
      const hasUnknownValues = Object.values(parsed).some((value: any) => {
        if (typeof value === 'string') {
          const unknownPatterns = [
            'unknown', 'Unknown', 'UNKNOWN', 'غير محدد', 'غير معروف', 'N/A', 'n/a', 'null', 'undefined', ''
          ];
          return unknownPatterns.includes(value.trim());
        }
        return false;
      });
      if (hasUnknownValues) return true;
    } catch (error) {
      // If parsing fails, treat as unknown
      return true;
    }
  }
  
  // Also check using the existing isUnknownLocation function
  return isUnknownLocation({
    city: device.location?.city,
    country: device.location?.country
  });
};

// Main function to fetch location from IP with fallbacks
export const fetchLocationFromIP = async (ip: string): Promise<LocationData | null> => {
  // Check cache first
  const cached = locationCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Validate IP address
  if (!ip || ip === 'Unknown' || ip === 'unknown' || ip === 'N/A') {
    return null;
  }
  
  // Try primary service first
  let location = await fetchFromIpApi(ip);
  
  // If primary fails, try fallback services
  if (!location) {
    location = await fetchFromIpApiCom(ip);
  }
  
  if (!location) {
    location = await fetchFromIpInfo(ip);
  }
  
  // Cache the result (even if null to avoid repeated failed requests)
  if (location) {
    locationCache.set(ip, { data: location, timestamp: Date.now() });
  } else {
    // Cache null result for a shorter duration to avoid repeated failed requests
    locationCache.set(ip, { 
      data: { 
        city: 'غير محدد', 
        country: 'غير محدد', 
        source: 'failed_geolocation' 
      }, 
      timestamp: Date.now() 
    });
  }
  
  return location;
};

// Function to get location display text
export const getLocationDisplay = (location: LocationData | null): string => {
  if (!location) return 'غير محدد';
  
  // Define unknown patterns
  const unknownPatterns = [
    'unknown',
    'Unknown',
    'UNKNOWN',
    'غير محدد',
    'غير معروف',
    'N/A',
    'n/a',
    'null',
    'undefined',
    ''
  ];
  
  // Helper function to check if a value is unknown
  const isUnknownValue = (value: string | undefined): boolean => {
    if (!value) return true;
    return unknownPatterns.includes(value.trim());
  };
  
  const parts = [
    location.city,
    location.region,
    location.country_name || location.country
  ].filter(part => part && !isUnknownValue(part));
  
  return parts.length > 0 ? parts.join(', ') : 'غير محدد';
};

// Function to clear cache (useful for testing or manual refresh)
export const clearLocationCache = (): void => {
  locationCache.clear();
};

// Function to get cache statistics
export const getCacheStats = (): { size: number; entries: string[] } => {
  return {
    size: locationCache.size,
    entries: Array.from(locationCache.keys())
  };
}; 