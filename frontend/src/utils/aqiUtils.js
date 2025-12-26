/**
 * Get color based on AQI value
 * @param {number} aqi - Air Quality Index value
 * @returns {string} Color hex code
 */
export const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#a21caf';
  return '#7f1d1d';
};

/**
 * Get AQI category label
 * @param {number} aqi - Air Quality Index value
 * @returns {string} Category label
 */
export const getAQICategory = (aqi) => {
  if (aqi <= 50) return 'Tốt';
  if (aqi <= 100) return 'Trung bình';
  if (aqi <= 150) return 'Kém';
  if (aqi <= 200) return 'Xấu';
  return 'Rất xấu';
};

/**
 * Convert PM2.5 to cigarettes equivalent
 * @param {number} pm25 - PM2.5 value
 * @returns {string} Number of cigarettes
 */
export const pm25ToCigarettes = (pm25) => {
  return (pm25 / 22).toFixed(1);
};

/**
 * Convert AQI to PM2.5 (rough estimate)
 * @param {number} aqi - Air Quality Index value
 * @returns {number} PM2.5 value
 */
export const aqiToPm25 = (aqi) => {
  return (aqi * 0.6).toFixed(1);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format date to DD-MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return `${String(date.getDate()).padStart(2, '0')}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
};

/**
 * Format date to DD/MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export const formatDateSlash = (date) => {
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
};

/**
 * Get date key in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} Date key
 */
export const getDateKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Format date to DD/MM format (for display)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (DD/MM)
 */
export const formatDateDisplay = (date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

/**
 * Get date range string for forecast period
 * @param {number} period - Number of days
 * @returns {string} Date range string (DD/MM - DD/MM)
 */
export const getDateRangeForecast = (period) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() + 1);
  end.setDate(start.getDate() + (Number(period) - 1));
  return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
};

/**
 * Get date range string for past period
 * @param {number} period - Number of days
 * @returns {string} Date range string (DD/MM - DD/MM)
 */
export const getDateRangePast = (period) => {
  const end = new Date();
  const start = new Date();
  end.setDate(end.getDate() - 1);
  start.setDate(end.getDate() - (Number(period) - 1));
  return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
};