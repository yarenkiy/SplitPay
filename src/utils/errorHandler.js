import { Alert } from 'react-native';

// Production modunda mıyız kontrol et
const isProduction = process.env.NODE_ENV === 'production' || !__DEV__;

/**
 * Hata mesajlarını sadece loglarda gösterir, UI'da göstermez
 * @param {string} title - Hata başlığı
 * @param {string} message - Hata mesajı
 */
export const showError = (title, message) => {
  // Her zaman console'a yaz
  console.error(`${title}: ${message}`);
  
  // Production'da UI'da gösterme
  if (!isProduction) {
    Alert.alert(title, message);
  }
};

/**
 * Başarı mesajlarını gösterir (production'da da gösterilir)
 * @param {string} title - Başarı başlığı
 * @param {string} message - Başarı mesajı
 * @param {Array} buttons - Alert butonları (opsiyonel)
 */
export const showSuccess = (title, message, buttons) => {
  console.log(`${title}: ${message}`);
  Alert.alert(title, message, buttons);
};

/**
 * Onay mesajları için (production'da da gösterilir)
 * @param {string} title - Onay başlığı
 * @param {string} message - Onay mesajı
 * @param {Array} buttons - Alert butonları
 */
export const showConfirmation = (title, message, buttons) => {
  Alert.alert(title, message, buttons);
};

/**
 * Bilgi mesajları için (production'da da gösterilir)
 * @param {string} title - Bilgi başlığı
 * @param {string} message - Bilgi mesajı
 * @param {Array} buttons - Alert butonları (opsiyonel)
 */
export const showInfo = (title, message, buttons) => {
  console.log(`${title}: ${message}`);
  Alert.alert(title, message, buttons);
};

/**
 * Axios hatasını parse edip sadece console'a loglar
 * @param {Error} error - Axios hatası
 * @param {string} context - Hata bağlamı (örn: 'Login', 'Fetch Groups')
 * @returns {string} - Hata mesajı
 */
export const handleAxiosError = (error, context = '') => {
  const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
  console.error(`${context} Error:`, {
    message: errorMessage,
    status: error.response?.status,
    data: error.response?.data,
  });
  
  return errorMessage;
};

