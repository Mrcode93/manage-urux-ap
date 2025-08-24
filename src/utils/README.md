# IP Geolocation Feature

This feature automatically resolves location information for devices when their stored location data is "Unknown, Unknown" or similar unknown values.

## Features

- **Automatic Detection**: Detects when device location is unknown
- **Multiple Fallback Services**: Uses multiple IP geolocation services for reliability
- **Caching**: Caches results to avoid repeated API calls
- **Loading States**: Shows loading indicators while fetching location data
- **Manual Refresh**: Allows manual refresh of unknown locations

## Services Used

1. **Primary**: `ipapi.co` - Free tier with good accuracy
2. **Fallback 1**: `ip-api.com` - Free tier, reliable
3. **Fallback 2**: `ipinfo.io` - Free tier with rate limits

## Usage

### Basic Usage

```typescript
import { fetchLocationFromIP, isUnknownLocation } from '../utils/ipGeolocation';

// Check if location is unknown
const isUnknown = isUnknownLocation({
  city: device.location?.city,
  country: device.location?.country
});

// Fetch location from IP
const location = await fetchLocationFromIP(device.ip);
```

### Using the Hook

```typescript
import { useUnknownLocationHandler } from '../hooks/useIpGeolocation';

function MyComponent() {
  const { ipLocations, loadingLocations, refreshLocation } = useUnknownLocationHandler(devices);
  
  // Automatically handles unknown locations
  // Provides loading states and refresh functionality
}
```

## API Reference

### `fetchLocationFromIP(ip: string): Promise<LocationData | null>`

Fetches location data for an IP address using multiple fallback services.

### `isUnknownLocation(location: any): boolean`

Checks if a location object represents an unknown location.

### `getLocationDisplay(location: LocationData | null): string`

Returns a formatted display string for location data.

### `useIpGeolocation()`

Hook that provides IP geolocation functionality with caching and loading states.

### `useUnknownLocationHandler(devices: any[])`

Hook specifically for handling unknown locations in device lists.

## Configuration

### Cache Duration

The cache duration is set to 24 hours by default. You can modify this in `ipGeolocation.ts`:

```typescript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Unknown Location Patterns

The system recognizes various "unknown" patterns:

- `'unknown'`, `'Unknown'`, `'UNKNOWN'`
- `'غير محدد'`, `'غير معروف'` (Arabic)
- `'N/A'`, `'n/a'`
- `'null'`, `'undefined'`
- Empty strings

## Testing

You can test the IP geolocation functionality by running:

```javascript
// In browser console
window.testIpGeolocation();
```

This will test:
- IP geolocation services
- Unknown location detection
- Location display formatting

## Error Handling

The system handles various error scenarios:

- Network failures
- Invalid IP addresses
- Rate limiting
- Service unavailability

Failed requests are cached for a short duration to avoid repeated failed API calls.

## Performance Considerations

- Results are cached for 24 hours
- Loading states prevent duplicate requests
- Fallback services ensure reliability
- Automatic cleanup of expired cache entries

## Browser Compatibility

This feature works in all modern browsers that support:
- `fetch()` API
- `Map` data structure
- `async/await` syntax 