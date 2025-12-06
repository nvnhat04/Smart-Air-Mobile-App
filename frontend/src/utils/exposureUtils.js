/**
 * Get exposure multiplier based on mode
 * @param {string} mode - Exposure mode ('outdoor', 'indoor', 'indoor_purifier')
 * @returns {number} Multiplier value
 */
export const getExposureMultiplier = (mode) => {
  switch (mode) {
    case 'outdoor':
      return 1.0;
    case 'indoor':
      return 0.5;
    case 'indoor_purifier':
      return 0.1;
    default:
      return 1.0;
  }
};

/**
 * Get exposure mode label
 * @param {string} mode - Exposure mode
 * @returns {string} Mode label
 */
export const getExposureModeLabel = (mode) => {
  switch (mode) {
    case 'outdoor':
      return 'Ngoài trời';
    case 'indoor':
      return 'Trong nhà';
    case 'indoor_purifier':
      return 'Có máy lọc';
    default:
      return 'Ngoài trời';
  }
};

/**
 * Get exposure mode icon name
 * @param {string} mode - Exposure mode
 * @returns {string} Feather icon name
 */
export const getExposureModeIcon = (mode) => {
  switch (mode) {
    case 'outdoor':
      return 'sun';
    case 'indoor':
      return 'home';
    case 'indoor_purifier':
      return 'wind';
    default:
      return 'sun';
  }
};

/**
 * Get exposure multiplier label
 * @param {string} mode - Exposure mode
 * @returns {string} Multiplier label
 */
export const getExposureMultiplierLabel = (mode) => {
  const multiplier = getExposureMultiplier(mode);
  return `${multiplier.toFixed(1)}x`;
};
