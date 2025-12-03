/**
 * App Configuration
 * Store API keys and environment-specific settings here
 */

export const config = {
  // Open-Meteo API (Free, no API key required)
  OPENMETEO_API_URL: 'https://api.open-meteo.com/v1/forecast',
  
  // Backend API
  API_BASE_URL: {
    android: 'http://10.0.2.2:8000',
    ios: 'http://localhost:8000',
    web: 'http://localhost:8000',
  },
  
  // Nominatim (OpenStreetMap)
  NOMINATIM_ENDPOINT: 'https://nominatim.openstreetmap.org',
  
  // CEM (Center for Environmental Monitoring) API
  CEM_API_BASE: 'https://tedp.vn/api',
};
