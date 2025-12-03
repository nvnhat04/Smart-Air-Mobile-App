// API service helper for SmartAir backend
// Location tracking only

// Backend URL resolution strategy (works across all developers' machines):
// 1. Try environment variable REACT_APP_API_URL first (highest priority - set in .env.local)
// 2. Try app.json extra.backendUrl (built into app bundle at build time)
// 3. Try auto-detection from Expo manifest (if available on physical device)
// 4. Try localhost fallback for web/emulator development
import Constants from 'expo-constants';

// PRIORITY 1: Environment variable (from .env.local - highest priority for development)
const ENV_BASE = process.env.REACT_APP_API_URL;

// PRIORITY 2: app.json config (embedded in app bundle)
let CONFIG_BASE = Constants.expoConfig?.extra?.backendUrl || Constants.manifest?.extra?.backendUrl;
if (CONFIG_BASE === 'AUTO_DISCOVER' || CONFIG_BASE === '') {
  CONFIG_BASE = null;
}

// Auth server URL from app.json (separate from backend URL)
let CONFIG_AUTH_BASE = Constants.expoConfig?.extra?.authServerUrl || Constants.manifest?.extra?.authServerUrl;
if (CONFIG_AUTH_BASE === 'AUTO_DISCOVER' || CONFIG_AUTH_BASE === '') {
  CONFIG_AUTH_BASE = null;
}

// Try to detect the packager host (which runs on the same machine as the backend)
// Expo Go sets debuggerHost automatically when connecting to the development server
let detectedBackendUrl = null;
let detectedHost = null;
try {
  // Expo Go provides debuggerHost in the manifest
  const manifest = Constants.manifest || Constants.expoConfig || {};
  const expoConfig = Constants.expoConfig || {};
  
  // Log available properties for debugging
  console.warn('[api.js] Expo Constants available:');
  if (manifest.debuggerHost) console.warn(`  manifest.debuggerHost: ${manifest.debuggerHost}`);
  if (manifest.packagerPort) console.warn(`  manifest.packagerPort: ${manifest.packagerPort}`);
  if (manifest.extra?.debuggerHost) console.warn(`  manifest.extra.debuggerHost: ${manifest.extra.debuggerHost}`);
  if (expoConfig.extra?.debuggerHost) console.warn(`  expoConfig.extra.debuggerHost: ${expoConfig.extra.debuggerHost}`);
  
  // Try multiple sources for debuggerHost
  let debuggerHost = 
    manifest.debuggerHost || 
    manifest.packagerPort || 
    manifest.extra?.debuggerHost ||
    expoConfig.extra?.debuggerHost ||
    Constants.expoGoConfig?.debuggerHost ||
    null;
  
  // Also try the connection info from expo-constants
  if (!debuggerHost && Constants.executionEnvironment === 'standalone') {
    // In standalone builds, try other methods
    debuggerHost = Constants.manifest2?.extra?.expoGo?.debuggerHost;
  }
  
  if (debuggerHost) {
    // Extract the host part (remove port if present)
    // debuggerHost format: "192.168.1.2:8081" or "hostname:8081" or just "192.168.1.2"
    let hostPart = debuggerHost.includes(':') ? debuggerHost.split(':')[0] : debuggerHost;
    
    // Skip localhost/127.0.0.1 - these won't work on physical devices
    if (hostPart && hostPart !== 'localhost' && hostPart !== '127.0.0.1' && !hostPart.startsWith('127.')) {
      detectedHost = hostPart;
      detectedBackendUrl = `http://${hostPart}:4000`;
      console.warn(`[api.js] ✓ Auto-detected backend URL: ${detectedBackendUrl}`);
    } else {
      console.warn(`[api.js] ⚠ debuggerHost is localhost (${hostPart}), skipping auto-detection`);
    }
  } else {
    console.warn('[api.js] ✗ Could not auto-detect backend - no debuggerHost found');
    console.warn('[api.js] Available Constants:', {
      manifest: !!manifest,
      expoConfig: !!expoConfig,
      executionEnvironment: Constants.executionEnvironment
    });
  }
} catch (e) {
  console.warn('[api.js] Failed to auto-detect packager host:', e.message);
}

// Resolve BASE_URL with priority: env > detected > config > localhost
// Auto-detection (detected) is preferred over hardcoded config for network flexibility
let BASE_URL = ENV_BASE || detectedBackendUrl || CONFIG_BASE || 'http://localhost:4000';

console.warn(`[api.js] Initializing BASE_URL: ${BASE_URL}`);
console.warn(`  priority: env=${ENV_BASE || 'not set'} > detected=${detectedBackendUrl || 'not set'} > config=${CONFIG_BASE || 'not set'} > localhost`);

// Warn if using localhost on a physical device
if (BASE_URL.includes('localhost') && Constants.executionEnvironment !== 'bare') {
  console.warn('[api.js] ⚠ WARNING: Using localhost - this will NOT work on a physical device!');
  console.warn('[api.js] Please ensure Expo is running with --lan flag or set REACT_APP_API_URL environment variable');
}

// Calculate AUTH_BASE once - use same host as backend but port 8000
let AUTH_BASE_URL;
if (CONFIG_AUTH_BASE && CONFIG_AUTH_BASE !== 'AUTO_DISCOVER') {
  // Explicit auth server URL provided
  AUTH_BASE_URL = `${CONFIG_AUTH_BASE}/auth`;
} else {
  // Auto-detect: use same host as backend but port 8000
  try {
    // Use detected host if available, otherwise extract from BASE_URL
    let hostForAuth;
    if (detectedHost) {
      // Use the detected host directly
      hostForAuth = detectedHost;
    } else if (detectedBackendUrl) {
      const b = detectedBackendUrl.replace(/^https?:\/\//, '');
      hostForAuth = b.includes(':') ? b.split(':')[0] : b;
    } else {
      const b = BASE_URL.replace(/^https?:\/\//, '');
      hostForAuth = b.includes(':') ? b.split(':')[0] : b;
      // Don't use localhost on physical devices
      if (hostForAuth === 'localhost' || hostForAuth === '127.0.0.1') {
        console.warn('[api.js] ⚠ Warning: Using localhost for auth server - this may not work on physical devices');
      }
    }
    AUTH_BASE_URL = `http://${hostForAuth}:8000/auth`;
  } catch (e) {
    AUTH_BASE_URL = 'http://localhost:8000/auth';
    console.warn('[api.js] ⚠ Error calculating AUTH_BASE, using localhost fallback');
  }
}
console.warn(`[api.js] AUTH_BASE: ${AUTH_BASE_URL}`);
console.warn(`  config=${CONFIG_AUTH_BASE || 'not set'} > auto-detected from ${detectedHost ? 'debuggerHost' : (detectedBackendUrl ? 'BASE_URL' : 'fallback')}`);

const api = {
  BASE_URL,
  // Auth now lives on the FastAPI server (port 8000), under /auth/*
  get AUTH_BASE() {
    return AUTH_BASE_URL;
  },

  // POST /api/location
  // Records user's current position when they open the app
  saveLocation: async (userId, lat, lng, aqi, address) => {
    const url = `${BASE_URL}/api/location`;
    console.warn(`[api.js] saveLocation: POST to ${url}`);
    console.warn(`  userId=${userId}, lat=${lat}, lng=${lng}`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lat, lng, aqi, address })
      });
      console.warn(`[api.js] saveLocation: Response status ${res.status}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      console.warn(`[api.js] saveLocation: Success`, data);
      return data;
    } catch (err) {
      console.error(`[api.js] saveLocation: Error: ${err.message}`);
      throw err;
    }
  },

  // GET /api/location/history?userId=..
  // Retrieves user's location history for analytics
  getLocationHistory: async (userId) => {
    const url = `${BASE_URL}/api/location/history?userId=${encodeURIComponent(userId)}`;
    console.warn(`[api.js] getLocationHistory: GET from ${url}`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.warn(`[api.js] getLocationHistory: Success`, data);
      return data;
    } catch (err) {
      console.error(`[api.js] getLocationHistory: Error: ${err.message}`);
      throw err;
    }
  }
};

// Auth helpers
api.auth = {
  register: async (email, password, displayName, profile) => {
    const url = `${api.AUTH_BASE}/register`;
    console.warn(`[api.js] auth.register -> POST ${url}`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, profile })
      });
      if (!res.ok) {
        const text = await res.text();
        let errorMsg = text || `HTTP ${res.status}`;
        try {
          const json = JSON.parse(text);
          errorMsg = json.detail || json.message || errorMsg;
        } catch (e) {
          // Not JSON, use text as-is
        }
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('Network request failed')) {
        throw new Error(`Cannot reach server at ${url}. Make sure the FastAPI server is running on port 8000.`);
      }
      throw err;
    }
  },

  login: async (email, password) => {
    const url = `${api.AUTH_BASE}/login`;
    console.warn(`[api.js] auth.login -> POST ${url}`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const text = await res.text();
        let errorMsg = text || `HTTP ${res.status}`;
        try {
          const json = JSON.parse(text);
          errorMsg = json.detail || json.message || errorMsg;
        } catch (e) {
          // Not JSON, use text as-is
        }
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('Network request failed')) {
        throw new Error(`Cannot reach server at ${url}. Make sure the FastAPI server is running on port 8000.`);
      }
      throw err;
    }
  }
};

export default api;
