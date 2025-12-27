/**
 * Utility functions for license key generation and management
 */

/**
 * Generates a unique license key in format: XXXX-XXXX-XXXX-XXXX
 * @returns {string} Generated license key
 */
export const generateLicenseKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  // Generate 4 segments of 4 characters each
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
};

/**
 * Validates license key format
 * @param {string} licenseKey - License key to validate
 * @returns {boolean} True if valid format
 */
export const validateLicenseKeyFormat = (licenseKey) => {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(licenseKey);
};

/**
 * Generates a unique license key with timestamp for additional uniqueness
 * @returns {string} Generated license key with timestamp component
 */
export const generateTimestampedLicenseKey = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = generateLicenseKey().replace(/-/g, '').substring(0, 12);
  
  // Combine timestamp and random parts, format as XXXX-XXXX-XXXX-XXXX
  const combined = (timestamp + randomPart).substring(0, 16);
  return combined.match(/.{1,4}/g).join('-');
};