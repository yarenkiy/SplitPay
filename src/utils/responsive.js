import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Determine device type
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// Base width and height for scaling (iPhone 11 Pro as baseline)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales a value based on screen width
 * @param {number} size - The size to scale
 * @returns {number} - Scaled size
 */
const horizontalScale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales a value based on screen height
 * @param {number} size - The size to scale
 * @returns {number} - Scaled size
 */
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale - scales with a factor to prevent extreme scaling
 * @param {number} size - The size to scale
 * @param {number} factor - Scaling factor (default: 0.5)
 * @returns {number} - Moderately scaled size
 */
const moderateScale = (size, factor = 0.5) => {
  return size + (horizontalScale(size) - size) * factor;
};

/**
 * Scales font size based on device
 * @param {number} size - Font size
 * @returns {number} - Scaled font size
 */
const scaleFontSize = (size) => {
  const scale = SCREEN_WIDTH / guidelineBaseWidth;
  const newSize = size * scale;
  
  if (isIOS) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Get responsive padding based on device size
 * @param {number} size - Base padding
 * @returns {number} - Responsive padding
 */
const getResponsivePadding = (size) => {
  if (isSmallDevice) return size * 0.85;
  if (isTablet) return size * 1.3;
  return size;
};

/**
 * Get responsive margin based on device size
 * @param {number} size - Base margin
 * @returns {number} - Responsive margin
 */
const getResponsiveMargin = (size) => {
  if (isSmallDevice) return size * 0.85;
  if (isTablet) return size * 1.3;
  return size;
};

/**
 * Get responsive border radius
 * @param {number} size - Base border radius
 * @returns {number} - Responsive border radius
 */
const getResponsiveBorderRadius = (size) => {
  if (isSmallDevice) return size * 0.9;
  if (isTablet) return size * 1.2;
  return size;
};

/**
 * Get responsive icon size
 * @param {number} size - Base icon size
 * @returns {number} - Responsive icon size
 */
const getResponsiveIconSize = (size) => {
  if (isSmallDevice) return size * 0.9;
  if (isTablet) return size * 1.2;
  return size;
};

/**
 * Get responsive width percentage
 * @param {number} percentage - Width percentage (0-100)
 * @returns {number} - Actual width in pixels
 */
const wp = (percentage) => {
  return (percentage * SCREEN_WIDTH) / 100;
};

/**
 * Get responsive height percentage
 * @param {number} percentage - Height percentage (0-100)
 * @returns {number} - Actual height in pixels
 */
const hp = (percentage) => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

/**
 * Get number of columns for grid layout
 * @param {number} itemWidth - Minimum item width
 * @param {number} gap - Gap between items
 * @returns {number} - Number of columns
 */
const getGridColumns = (itemWidth = 150, gap = 12) => {
  const availableWidth = SCREEN_WIDTH - (getResponsivePadding(20) * 2);
  const columns = Math.floor(availableWidth / (itemWidth + gap));
  return Math.max(2, columns); // Minimum 2 columns
};

/**
 * Get card width for horizontal scrolling
 * @param {number} cardPerScreen - Number of cards visible at once
 * @returns {number} - Card width
 */
const getCardWidth = (cardPerScreen = 1.2) => {
  const padding = getResponsivePadding(20) * 2;
  const gap = getResponsiveMargin(12);
  return (SCREEN_WIDTH - padding - gap) / cardPerScreen;
};

/**
 * Check if device has notch (for safe area)
 * @returns {boolean} - Has notch
 */
const hasNotch = () => {
  return (
    isIOS &&
    !Platform.isPad &&
    (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812)
  );
};

/**
 * Get safe area padding for top
 * @returns {number} - Top safe area padding
 */
const getSafeAreaTop = () => {
  if (hasNotch()) return 44;
  if (isIOS) return 20;
  return 0;
};

/**
 * Get safe area padding for bottom
 * @returns {number} - Bottom safe area padding
 */
const getSafeAreaBottom = () => {
  if (hasNotch()) return 34;
  return 0;
};

export {
    getCardWidth, getGridColumns, getResponsiveBorderRadius,
    getResponsiveIconSize, getResponsiveMargin, getResponsivePadding, getSafeAreaBottom, getSafeAreaTop, hasNotch, horizontalScale, hp, isAndroid, isIOS, isMediumDevice, isSmallDevice, isTablet, moderateScale,
    scaleFontSize, SCREEN_HEIGHT, SCREEN_WIDTH, verticalScale, wp
};

