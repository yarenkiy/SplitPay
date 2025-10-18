import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import CurrencyService from '../src/services/currencyService';
import {
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    scaleFontSize,
} from '../src/utils/responsive';

export default function CurrencyConverter({ 
  visible, 
  onClose, 
  initialAmount = 0, 
  initialCurrency = 'TRY' 
}) {
  const [amount, setAmount] = useState(initialAmount.toString());
  const [fromCurrency, setFromCurrency] = useState(initialCurrency);
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(null); // 'from' or 'to'
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);

  useEffect(() => {
    setSupportedCurrencies(CurrencyService.getSupportedCurrencies());
  }, []);

  useEffect(() => {
    if (visible) {
      fetchExchangeRates();
    }
  }, [visible, fromCurrency]);

  useEffect(() => {
    if (amount && exchangeRates) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const fetchExchangeRates = async () => {
    try {
      setIsLoading(true);
      const rates = await CurrencyService.getExchangeRates(fromCurrency);
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      Alert.alert('Error', 'Failed to fetch exchange rates. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const convertCurrency = () => {
    if (!amount || isNaN(parseFloat(amount)) || !exchangeRates) {
      setConvertedAmount(0);
      return;
    }

    const amountValue = parseFloat(amount);
    const converted = CurrencyService.convertCurrency(
      amountValue,
      fromCurrency,
      toCurrency,
      exchangeRates
    );

    if (converted !== null) {
      setConvertedAmount(converted);
    }
  };

  const handleAmountChange = (text) => {
    // Sadece sayı ve nokta karakterlerine izin ver
    const numericText = text.replace(/[^0-9.]/g, '');
    setAmount(numericText);
  };

  const handleCurrencySelect = (currencyCode, type) => {
    if (type === 'from') {
      setFromCurrency(currencyCode);
    } else {
      setToCurrency(currencyCode);
    }
    setShowCurrencyPicker(null);
  };

  const swapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
  };

  const renderCurrencyPicker = () => (
    <Modal
      visible={showCurrencyPicker !== null}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCurrencyPicker(null)}
    >
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              Select {showCurrencyPicker === 'from' ? 'From' : 'To'} Currency
            </Text>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(null)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerContent}>
            {supportedCurrencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={styles.currencyOption}
                onPress={() => handleCurrencySelect(currency.code, showCurrencyPicker)}
              >
                <View style={styles.currencyOptionContent}>
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  {(fromCurrency === currency.code || toCurrency === currency.code) && (
                    <Ionicons name="checkmark" size={20} color="#667eea" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Currency Converter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Amount</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Currency Conversion */}
            <View style={styles.conversionSection}>
              {/* From Currency */}
              <View style={styles.currencyRow}>
                <TouchableOpacity
                  style={styles.currencyButton}
                  onPress={() => setShowCurrencyPicker('from')}
                >
                  <View style={styles.currencyButtonContent}>
                    <Text style={styles.currencySymbol}>
                      {supportedCurrencies.find(c => c.code === fromCurrency)?.symbol || '₺'}
                    </Text>
                    <Text style={styles.currencyCode}>{fromCurrency}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.swapButton} onPress={swapCurrencies}>
                  <Ionicons name="swap-horizontal" size={24} color="#667eea" />
                </TouchableOpacity>

                {/* To Currency */}
                <TouchableOpacity
                  style={styles.currencyButton}
                  onPress={() => setShowCurrencyPicker('to')}
                >
                  <View style={styles.currencyButtonContent}>
                    <Text style={styles.currencySymbol}>
                      {supportedCurrencies.find(c => c.code === toCurrency)?.symbol || '$'}
                    </Text>
                    <Text style={styles.currencyCode}>{toCurrency}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Conversion Result */}
              <View style={styles.resultSection}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#667eea" />
                    <Text style={styles.loadingText}>Converting...</Text>
                  </View>
                ) : (
                  <View style={styles.resultContainer}>
                    <Text style={styles.resultAmount}>
                      {CurrencyService.formatCurrency(convertedAmount, toCurrency)}
                    </Text>
                    <Text style={styles.resultLabel}>
                      {amount ? `${amount} ${fromCurrency} =` : 'Enter amount to convert'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Exchange Rate Info */}
            {exchangeRates && (
              <View style={styles.rateInfo}>
                <View style={styles.rateInfoHeader}>
                  <Ionicons name="trending-up" size={16} color="#10b981" />
                  <Text style={styles.rateInfoTitle}>Exchange Rate</Text>
                </View>
                <Text style={styles.rateInfoText}>
                  1 {fromCurrency} = {exchangeRates.rates?.[toCurrency]?.toFixed(4) || 'N/A'} {toCurrency}
                </Text>
                <Text style={styles.rateInfoDate}>
                  Last updated: {new Date(exchangeRates.date).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Popular Conversions */}
            <View style={styles.popularSection}>
              <Text style={styles.sectionLabel}>Popular Conversions</Text>
              <View style={styles.popularGrid}>
                {[
                  { from: 'TRY', to: 'USD', label: 'TRY → USD' },
                  { from: 'USD', to: 'TRY', label: 'USD → TRY' },
                  { from: 'TRY', to: 'EUR', label: 'TRY → EUR' },
                  { from: 'EUR', to: 'TRY', label: 'EUR → TRY' },
                ].map((conversion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularButton}
                    onPress={() => {
                      setFromCurrency(conversion.from);
                      setToCurrency(conversion.to);
                    }}
                  >
                    <Text style={styles.popularButtonText}>{conversion.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      {renderCurrencyPicker()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(20),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: '800',
    color: '#1e293b',
  },
  closeButton: {
    padding: getResponsivePadding(4),
  },
  content: {
    padding: getResponsivePadding(20),
  },
  inputSection: {
    marginBottom: getResponsiveMargin(24),
  },
  sectionLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: getResponsiveMargin(8),
  },
  amountInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: getResponsivePadding(16),
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  conversionSection: {
    marginBottom: getResponsiveMargin(24),
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(16),
    gap: 12,
  },
  currencyButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: getResponsivePadding(16),
    backgroundColor: '#f8fafc',
  },
  currencyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: '#1e293b',
  },
  currencyCode: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#64748b',
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  resultSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: getResponsivePadding(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: scaleFontSize(14),
    color: '#64748b',
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultAmount: {
    fontSize: scaleFontSize(isSmallDevice ? 24 : 28),
    fontWeight: '800',
    color: '#667eea',
    marginBottom: getResponsiveMargin(4),
  },
  resultLabel: {
    fontSize: scaleFontSize(14),
    color: '#64748b',
    fontWeight: '500',
  },
  rateInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: getResponsivePadding(16),
    marginBottom: getResponsiveMargin(24),
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  rateInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: getResponsiveMargin(8),
  },
  rateInfoTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#166534',
  },
  rateInfoText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#166534',
    marginBottom: getResponsiveMargin(4),
  },
  rateInfoDate: {
    fontSize: scaleFontSize(12),
    color: '#65a30d',
  },
  popularSection: {
    marginBottom: getResponsiveMargin(24),
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  popularButtonText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#64748b',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(20),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#1e293b',
  },
  pickerContent: {
    padding: getResponsivePadding(20),
  },
  currencyOption: {
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  currencyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: scaleFontSize(12),
    color: '#94a3b8',
    marginTop: 2,
  },
});
