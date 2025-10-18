const CURRENCY_API_KEY = '25ebb415a475d7795df3d781'; // ExchangeRate-API key - https://exchangerate-api.com/ adresinden alın
const CURRENCY_API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

class CurrencyService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 dakika cache
  }

  // Desteklenen para birimleri
  getSupportedCurrencies() {
    return [
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    ];
  }

  // Cache'den kur verisi al
  getCachedRates(baseCurrency) {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    return null;
  }

  // Cache'e kur verisi kaydet
  setCachedRates(baseCurrency, data) {
    const cacheKey = `rates_${baseCurrency}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Anlık kur verilerini al
  async getExchangeRates(baseCurrency = 'USD') {
    try {
      // Önce cache'den kontrol et
      const cached = this.getCachedRates(baseCurrency);
      if (cached) {
        return cached;
      }

      const response = await fetch(`${CURRENCY_API_BASE_URL}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache'e kaydet
      this.setCachedRates(baseCurrency, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Fallback olarak sabit kurlar döndür (güncel olmayabilir)
      return this.getFallbackRates(baseCurrency);
    }
  }

  // Fallback kurlar (internet bağlantısı yoksa)
  getFallbackRates(baseCurrency = 'USD') {
    const fallbackRates = {
      USD: {
        base: 'USD',
        date: new Date().toISOString().split('T')[0],
        rates: {
          TRY: 32.5,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.0,
          CAD: 1.25,
          AUD: 1.35,
          CHF: 0.92,
          CNY: 6.45,
          INR: 74.0,
          BRL: 5.2,
          RUB: 75.0,
          KRW: 1180.0,
          MXN: 20.0,
          SGD: 1.35,
        }
      },
      TRY: {
        base: 'TRY',
        date: new Date().toISOString().split('T')[0],
        rates: {
          USD: 0.031,
          EUR: 0.026,
          GBP: 0.022,
          JPY: 3.38,
          CAD: 0.038,
          AUD: 0.042,
          CHF: 0.028,
          CNY: 0.198,
          INR: 2.28,
          BRL: 0.16,
          RUB: 2.31,
          KRW: 36.31,
          MXN: 0.62,
          SGD: 0.042,
        }
      }
    };

    return fallbackRates[baseCurrency] || fallbackRates.USD;
  }

  // Para birimi çevir
  convertCurrency(amount, fromCurrency, toCurrency, rates) {
    if (!rates || !rates.rates) {
      return null;
    }

    // Aynı para birimiyse direkt döndür
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // USD bazlı çevirme
    if (fromCurrency === rates.base) {
      const rate = rates.rates[toCurrency];
      return rate ? amount * rate : null;
    }

    // USD'ye çevir, sonra hedef para birimine çevir
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];
    
    if (!fromRate || !toRate) {
      return null;
    }

    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  // Para birimi formatla
  formatCurrency(amount, currencyCode, locale = 'tr-TR') {
    const currencies = this.getSupportedCurrencies();
    const currency = currencies.find(c => c.code === currencyCode);
    
    if (!currency) {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback format
      return `${currency.symbol}${amount.toFixed(2)} ${currencyCode}`;
    }
  }

  // Çoklu para birimi çevirme
  async convertMultipleCurrencies(amount, fromCurrency, targetCurrencies) {
    try {
      const rates = await this.getExchangeRates(fromCurrency);
      const results = {};

      targetCurrencies.forEach(targetCurrency => {
        const convertedAmount = this.convertCurrency(amount, fromCurrency, targetCurrency, rates);
        if (convertedAmount !== null) {
          results[targetCurrency] = {
            amount: convertedAmount,
            formatted: this.formatCurrency(convertedAmount, targetCurrency)
          };
        }
      });

      return results;
    } catch (error) {
      console.error('Error converting multiple currencies:', error);
      return {};
    }
  }
}

export default new CurrencyService();
