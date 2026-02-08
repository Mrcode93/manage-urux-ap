// Simple test file for IP geolocation functionality
// This can be run manually to test the geolocation services

import { fetchLocationFromIP, isUnknownLocation, getLocationDisplay } from './ipGeolocation';

// Test function to verify IP geolocation
export const testIpGeolocation = async () => {
  // Test known IP addresses
  const testIPs = [
    '8.8.8.8', // Google DNS
    '1.1.1.1', // Cloudflare DNS
    '208.67.222.222', // OpenDNS
    '169.224.94.21', // IP from the issue
  ];

  for (const ip of testIPs) {
    try {
      const location = await fetchLocationFromIP(ip);
      if (location) {
        console.log(`Location for ${ip}:`, location);
      } else {
        console.log(`Could not find location for ${ip}`);
      }
    } catch (error) {
      console.error(`Error fetching location for ${ip}:`, error);
    }
  }

  // Test unknown location detection
  const testLocations = [
    { city: 'Unknown', country: 'Unknown' },
    { city: 'unknown', country: 'unknown' },
    { city: 'غير محدد', country: 'غير محدد' },
    { city: 'New York', country: 'US' },
    { city: '', country: '' },
  ];

  testLocations.forEach(location => {
    const isUnknown = isUnknownLocation(location);
    console.log(`Is unknown (${location.city}, ${location.country}):`, isUnknown);
  });

  // Test location display
  const testLocationData = [
    { city: 'New York', country: 'US', region: 'NY' },
    { city: 'London', country: 'GB' },
    { city: 'Unknown', country: 'Unknown' },
    null,
  ];

  testLocationData.forEach(location => {
    const display = getLocationDisplay(location);
    console.log(`Display (${location?.city}):`, display);
  });
};

// Specific test for the problematic IP
export const testSpecificIP = async () => {
  try {
    const location = await fetchLocationFromIP('169.224.94.21');
    if (location) {
      console.log('Specific IP location:', location);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testIpGeolocation = testIpGeolocation;
  (window as any).testSpecificIP = testSpecificIP;
}