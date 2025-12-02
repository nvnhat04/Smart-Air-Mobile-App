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

// Try to detect the packager host (which runs on the same machine as the backend)
// Expo Go sets debuggerHost automatically when connecting to the development server
let detectedBackendUrl = null;
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
  
  // Try debuggerHost first (format: "192.168.1.2:8081" or "hostname:8081")
  let debuggerHost = manifest.debuggerHost || manifest.packagerPort || null;
  
  // Also try expo-constants documented properties
  if (!debuggerHost && manifest.extra?.debuggerHost) {
    debuggerHost = manifest.extra.debuggerHost;
  }
  if (!debuggerHost && expoConfig.extra?.debuggerHost) {
    debuggerHost = expoConfig.extra.debuggerHost;
  }
  
  if (debuggerHost) {
    // Extract the host part (remove port if present)
    let hostPart = debuggerHost.includes(':') ? debuggerHost.split(':')[0] : debuggerHost;
    
    // Backend always runs on port 4000 on the same machine as the packager
    detectedBackendUrl = `http://${hostPart}:4000`;
    console.warn(`[api.js] ✓ Auto-detected backend URL: ${detectedBackendUrl}`);
  } else {
    console.warn('[api.js] ✗ Could not auto-detect backend - no debuggerHost found');
    console.warn('[api.js] Please set REACT_APP_API_URL or app.json backendUrl manually');
  }
} catch (e) {
  console.warn('[api.js] Failed to auto-detect packager host:', e.message);
}

// Resolve BASE_URL with priority: config > env > detected > localhost
// config (app.json) is preferred because it's baked into the app at build time
let BASE_URL = CONFIG_BASE || ENV_BASE || detectedBackendUrl || 'http://localhost:4000';

console.warn(`[api.js] Initializing BASE_URL: ${BASE_URL}`);
console.warn(`  priority: config=${CONFIG_BASE || 'not set'} > env=${ENV_BASE || 'not set'} > detected=${detectedBackendUrl || 'not set'} > localhost`);

const api = {
  BASE_URL,
  // Determine auth server URL — same host as BASE_URL but port 8000
  get AUTH_BASE() {
    try {
      // Basic parsing: remove protocol and port
      const b = BASE_URL.replace(/^https?:\/\//, '');
      const host = b.includes(':') ? b.split(':')[0] : b;
      return `http://${host}:8000`;
    } catch (e) {
      return 'http://localhost:8000';
    }
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
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, profile })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  },

  login: async (email, password) => {
    const url = `${api.AUTH_BASE}/login`;
    console.warn(`[api.js] auth.login -> POST ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }
};

export default api;
