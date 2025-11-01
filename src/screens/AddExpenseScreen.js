import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    scaleFontSize
} from '../utils/responsive';
import { showError, showSuccess } from '../utils/errorHandler';

const CURRENCIES = [
  // Major Currencies
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  
  // European Currencies
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  
  // Asian Currencies
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
  
  // Middle East & Africa
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
  
  // Americas
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
  { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano' },
  { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolivar' },
  
  // Other Major Currencies
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'UZS', symbol: 'лв', name: 'Uzbekistani Som' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
  { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
];

const CATEGORIES = [
  { id: '1', name: 'Food', icon: 'restaurant-outline', color: '#FF6B6B' },
  { id: '2', name: 'Transport', icon: 'car-outline', color: '#4ECDC4' },
  { id: '3', name: 'Entertainment', icon: 'game-controller-outline', color: '#45B7D1' },
  { id: '4', name: 'Shopping', icon: 'bag-outline', color: '#FFA726' },
  { id: '5', name: 'Health', icon: 'medical-outline', color: '#9C27B0' },
  { id: '6', name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#607D8B' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  
  // Form states
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(CURRENCIES);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [customAmounts, setCustomAmounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (currencySearchQuery.trim() === '') {
      setFilteredCurrencies(CURRENCIES);
    } else {
      const filtered = CURRENCIES.filter(currency =>
        currency.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
        currency.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
        currency.symbol.toLowerCase().includes(currencySearchQuery.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    }
  }, [currencySearchQuery]);

  const loadGroups = async () => {
      try {
        setIsLoading(true);
      const { dashboardAPI } = await import('../services/api');
      const response = await dashboardAPI.getUserGroups();
      const groupsData = response.data?.data || response.data || [];
      setGroups(groupsData);
      setFilteredGroups(groupsData);
    } catch (error) {
      console.error('Load groups error:', error);
      showError('Error', 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupMembers = async (groupId) => {
    try {
      const { groupAPI } = await import('../services/api');
      const response = await groupAPI.getGroupMembers(groupId);
      const membersData = response.data || [];
      setMembers(membersData);
      if (membersData.length > 0) {
        setPaidBy(membersData[0].id);
        // Select all members by default
        const allSelected = {};
        membersData.forEach(m => allSelected[m.id] = true);
        setSelectedParticipants(allSelected);
      }
    } catch (error) {
      console.error('Load members error:', error);
    }
  };

  const toggleParticipant = (memberId) => {
    setSelectedParticipants(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedGroup) {
      showError('Error', 'Please select a group');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showError('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedCategory) {
      showError('Error', 'Please select a category');
      return;
    }
    if (selectedCategory.id === '6' && !customCategory.trim()) {
      showError('Error', 'Please enter custom category name');
      return;
    }

    const participantCount = Object.values(selectedParticipants).filter(Boolean).length;
    if (participantCount === 0) {
      showError('Error', 'Please select at least one participant');
      return;
    }

    // Validate custom amounts if custom split is selected
    if (splitType === 'custom') {
      const selectedIds = Object.keys(selectedParticipants).filter(id => selectedParticipants[id]);
      let totalCustomAmount = 0;
      
      for (const id of selectedIds) {
        const customAmount = parseFloat(customAmounts[id] || 0);
        if (!customAmounts[id] || customAmount <= 0) {
          showError('Error', 'Please enter valid amounts for all participants');
      return;
        }
        totalCustomAmount += customAmount;
      }
      
      // Check if custom amounts total matches the main amount
      if (Math.abs(totalCustomAmount - parseFloat(amount)) > 0.01) {
        showError(
          'Amount Mismatch',
          `Total custom amounts (${selectedCurrency.symbol}${totalCustomAmount.toFixed(2)}) must equal the expense amount (${selectedCurrency.symbol}${parseFloat(amount).toFixed(2)})`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { groupAPI } = await import('../services/api');
      const categoryName = selectedCategory.id === '6' ? customCategory : selectedCategory.name;
      const participantIds = Object.keys(selectedParticipants).filter(id => selectedParticipants[id]);
      
      // Prepare payload
      const payload = {
        amount: parseFloat(amount),
        description: description || categoryName,
        paid_by: paidBy,
        participants: participantIds,
        split_type: splitType,
        currency: selectedCurrency.code,
        currency_symbol: selectedCurrency.symbol,
      };

      // Add custom amounts if custom split
      if (splitType === 'custom') {
        const customAmountsData = {};
        participantIds.forEach(id => {
          customAmountsData[id] = parseFloat(customAmounts[id]);
        });
        payload.custom_amounts = customAmountsData;
      }
      
      await groupAPI.addExpense(selectedGroup.id, payload);

      showSuccess(
        'Success! 🎉',
        `${selectedCurrency.symbol}${amount} expense added to ${selectedGroup.name}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Add expense error:', error);
      showError('Error', 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupSelector = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people" size={22} color="#667eea" />
        <Text style={styles.sectionTitle}>Select Group</Text>
      </View>
      
      {groups.length > 4 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
        {filteredGroups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupCard,
              selectedGroup?.id === group.id && styles.groupCardSelected,
            ]}
            onPress={() => setSelectedGroup(group)}
          >
            <View style={[styles.groupColorBadge, { backgroundColor: group.color }]}>
              <Ionicons name="people" size={20} color="white" />
            </View>
            <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
            <Text style={styles.groupMembers}>{group.members} members</Text>
            {selectedGroup?.id === group.id && (
              <View style={styles.selectedCheck}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAmountSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="cash" size={22} color="#667eea" />
        <Text style={styles.sectionTitle}>Amount</Text>
      </View>
      
      {/* Currency Selection */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search currencies..."
          placeholderTextColor="#9CA3AF"
          value={currencySearchQuery}
          onChangeText={setCurrencySearchQuery}
        />
        {currencySearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setCurrencySearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.currencyScrollView}
        contentContainerStyle={styles.currencyRow}
      >
        {filteredCurrencies.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyChip,
              selectedCurrency.code === currency.code && styles.currencyChipSelected,
            ]}
            onPress={() => setSelectedCurrency(currency)}
          >
            <Text style={[
              styles.currencyChipText,
              selectedCurrency.code === currency.code && styles.currencyChipTextSelected,
            ]}>
              {currency.symbol} {currency.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Amount Input */}
      <View style={styles.amountCard}>
        <Text style={styles.currencySymbolLarge}>{selectedCurrency.symbol}</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#D1D5DB"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) => {
            // Allow numbers, comma, and dot
            const cleaned = text.replace(/[^0-9.,]/g, '');
            setAmount(cleaned);
          }}
        />
      </View>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="grid" size={22} color="#667eea" />
        <Text style={styles.sectionTitle}>Category</Text>
      </View>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory?.id === category.id;
          return (
    <TouchableOpacity
      key={category.id}
      style={[
                styles.categoryCard,
                isSelected && { borderColor: category.color, backgroundColor: category.color + '15' },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
                <Ionicons
                  name={category.icon}
                  size={24}
                  color={category.color}
                />
      </View>
      <Text style={[
                styles.categoryName,
                isSelected && { color: category.color, fontWeight: '700' },
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
        })}
      </View>

      {selectedCategory?.id === '6' && (
        <TextInput
          style={styles.customInput}
          placeholder="Enter custom category name"
          placeholderTextColor="#9CA3AF"
          value={customCategory}
          onChangeText={setCustomCategory}
        />
      )}
    </View>
  );

  const renderPaidBySection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="wallet" size={22} color="#667eea" />
        <Text style={styles.sectionTitle}>Paid By</Text>
      </View>
      <View style={styles.membersList}>
        {members.map((member) => (
    <TouchableOpacity
            key={member.id}
      style={[
              styles.memberChip,
              paidBy === member.id && styles.memberChipSelected,
      ]}
            onPress={() => setPaidBy(member.id)}
    >
      <View style={[
              styles.memberChipAvatar,
              paidBy === member.id && styles.memberChipAvatarSelected,
            ]}>
              <Text style={styles.memberChipInitial}>{member.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={[
              styles.memberChipName,
              paidBy === member.id && styles.memberChipNameSelected,
      ]}>
              {member.name}
      </Text>
    </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSplitBetweenSection = () => {
    const selectedCount = Object.values(selectedParticipants).filter(Boolean).length;
    const perPersonAmount = amount && selectedCount > 0 ? (parseFloat(amount) / selectedCount).toFixed(2) : '0.00';

  return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-network" size={22} color="#667eea" />
          <Text style={styles.sectionTitle}>Split Between</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Select who will share this expense</Text>
        
        {/* Split Type Toggle */}
        <View style={styles.splitTypeContainer}>
          <TouchableOpacity
            style={[styles.splitTypeButton, splitType === 'equal' && styles.splitTypeButtonActive]}
            onPress={() => setSplitType('equal')}
          >
            <Ionicons 
              name="pie-chart" 
              size={20} 
              color={splitType === 'equal' ? '#667eea' : '#9CA3AF'} 
            />
            <Text style={[
              styles.splitTypeText,
              splitType === 'equal' && styles.splitTypeTextActive
            ]}>
              Equal Split
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.splitTypeButton, splitType === 'custom' && styles.splitTypeButtonActive]}
            onPress={() => setSplitType('custom')}
          >
            <Ionicons 
              name="create" 
              size={20} 
              color={splitType === 'custom' ? '#667eea' : '#9CA3AF'} 
            />
            <Text style={[
              styles.splitTypeText,
              splitType === 'custom' && styles.splitTypeTextActive
            ]}>
              Custom Split
            </Text>
          </TouchableOpacity>
        </View>

        {/* Participants Selection */}
        <View style={styles.participantsList}>
          {members.map((member) => {
            const isSelected = selectedParticipants[member.id];
            return (
              <View key={member.id} style={styles.participantWrapper}>
                <TouchableOpacity
                  style={[
                    styles.participantCard,
                    isSelected && styles.participantCardSelected,
                  ]}
                  onPress={() => toggleParticipant(member.id)}
                >
                  <View style={[
                    styles.participantAvatar,
                    isSelected && styles.participantAvatarSelected,
                  ]}>
                    <Text style={styles.participantInitial}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
                  <Text style={[
                    styles.participantName,
                    isSelected && styles.participantNameSelected,
                  ]} numberOfLines={1}>
                    {member.name}
                  </Text>
              <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                </TouchableOpacity>

                {/* Show amount for equal split or input for custom split */}
                {isSelected && (
                  <View style={styles.amountRow}>
                    {splitType === 'equal' ? (
                      <View style={styles.perPersonAmount}>
                        <Text style={styles.perPersonLabel}>Per person:</Text>
                        <Text style={styles.perPersonValue}>
                          {selectedCurrency.symbol}{perPersonAmount}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.customAmountInput}>
                        <Text style={styles.customAmountLabel}>{selectedCurrency.symbol}</Text>
                <TextInput
                          style={styles.customAmountField}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                          keyboardType="decimal-pad"
                          value={customAmounts[member.id] || ''}
                          onChangeText={(text) => {
                            // Allow numbers, comma, and dot
                            const cleaned = text.replace(/[^0-9.,]/g, '');
                            setCustomAmounts(prev => ({
                              ...prev,
                              [member.id]: cleaned
                            }));
                          }}
                />
              </View>
              )}
            </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDescriptionInput = () => (
            <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text" size={22} color="#667eea" />
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.optionalLabel}>(Optional)</Text>
      </View>
              <TextInput
        style={styles.descriptionInput}
        placeholder="Add a note..."
        placeholderTextColor="#9CA3AF"
                value={description}
        onChangeText={setDescription}
                multiline
        numberOfLines={3}
              />
            </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading groups...</Text>
              </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>New Expense</Text>
              <Text style={styles.headerSubtitle}>Split bills with your group</Text>
              </View>
            <View style={styles.headerSpacer} />
            </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {renderGroupSelector()}
          {selectedGroup && renderAmountSection()}
          {selectedGroup && renderCategorySelector()}
          {selectedGroup && members.length > 0 && renderPaidBySection()}
          {selectedGroup && members.length > 0 && renderSplitBetweenSection()}
          {selectedGroup && renderDescriptionInput()}

          {selectedGroup && (
            <View style={styles.submitContainer}>
                  <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text style={styles.submitText}>
                    {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
                      </Text>
                </LinearGradient>
                  </TouchableOpacity>
              </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: scaleFontSize(16),
    color: '#6B7280',
    marginTop: getResponsiveMargin(12),
  },
  headerGradient: {
    paddingBottom: getResponsivePadding(24),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(12),
  },
  backButton: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 20 : 24),
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: scaleFontSize(14),
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: getResponsiveMargin(2),
  },
  headerSpacer: {
    width: isSmallDevice ? 36 : 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getResponsivePadding(100),
  },
  section: {
    padding: getResponsivePadding(isSmallDevice ? 16 : 20),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(16),
  },
  sectionTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: getResponsiveMargin(10),
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(14),
    color: '#6B7280',
    marginBottom: getResponsiveMargin(12),
  },
  optionalLabel: {
    fontSize: scaleFontSize(12),
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  groupScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  groupCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  groupColorBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  currencyChip: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  currencyChipSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  currencyChipTextSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  currencySymbolLarge: {
    fontSize: 36,
    fontWeight: '800',
    color: '#667eea',
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48.5%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  customInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  memberChipSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  memberChipAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  memberChipAvatarSelected: {
    backgroundColor: '#667eea',
  },
  memberChipInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  memberChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  memberChipNameSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  splitTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  splitTypeButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  splitTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  splitTypeTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  participantWrapper: {
    width: '47.5%',
  },
  participantCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  participantCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  participantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  participantAvatarSelected: {
    backgroundColor: '#667eea',
  },
  participantInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B7280',
  },
  participantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  participantNameSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  amountRow: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  perPersonAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perPersonLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  perPersonValue: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '700',
  },
  customAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customAmountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginRight: 8,
  },
  customAmountField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  currencyScrollView: {
    marginTop: 10,
  },
}); 
