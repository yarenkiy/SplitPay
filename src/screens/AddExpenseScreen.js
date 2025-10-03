import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
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

const { width } = Dimensions.get('window');

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedGroup, setSelectedGroup] = useState(params?.preselectedGroup || null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);

  const expenseCategories = [
    { id: '1', name: 'Yemek', icon: 'restaurant', color: '#FF6B6B' },
    { id: '2', name: 'Ulaşım', icon: 'car', color: '#4ECDC4' },
    { id: '3', name: 'Eğlence', icon: 'game-controller', color: '#45B7D1' },
    { id: '4', name: 'Alışveriş', icon: 'bag', color: '#FFA726' },
    { id: '5', name: 'Sağlık', icon: 'medical', color: '#9C27B0' },
    { id: '6', name: 'Diğer', icon: 'ellipsis-horizontal', color: '#607D8B' },
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState({});

  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load groups and members
  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        const { groupAPI, dashboardAPI } = await import('../services/api');
        const groupsRes = await dashboardAPI.getUserGroups();
        if (!mounted) return;
        const normalizedGroups = (groupsRes.data?.data || groupsRes.data || []).map(g => ({
          id: g.id,
          name: g.name,
          color: g.color,
          memberCount: g.members || g.member_count || 0,
        }));
        setGroups(normalizedGroups);

        const groupToLoad = params?.preselectedGroup?.id || normalizedGroups[0]?.id;
        if (groupToLoad) {
          const memRes = await groupAPI.getGroupMembers(groupToLoad);
          if (!mounted) return;
          setMembers(memRes.data || []);
          setSelectedGroup(normalizedGroups.find(g => String(g.id) === String(groupToLoad)) || params?.preselectedGroup || null);
          // Default paidBy to current user if exists in members
          if (memRes.data && memRes.data.length > 0) {
            setPaidBy(memRes.data[0].id);
          }
        }
      } catch (e) {
        console.log('Load initial error', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadInitial();
    return () => { mounted = false; };
  }, [params?.preselectedGroup]);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedGroup) {
      newErrors.group = 'Lütfen bir grup seçin';
    }
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Lütfen geçerli bir tutar girin';
    }
    if (!description.trim()) {
      newErrors.description = 'Lütfen açıklama girin';
    }
    if (!selectedCategory) {
      newErrors.category = 'Lütfen bir kategori seçin';
    }
    if (!paidBy) {
      newErrors.paidBy = 'Ödeyen kişiyi seçin';
    }
    const participantIds = Object.keys(selectedParticipants).filter(id => selectedParticipants[id]);
    if (participantIds.length === 0) {
      newErrors.participants = 'En az bir kişi seçin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExpense = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { groupAPI } = await import('../services/api');
      const participantIds = Object.keys(selectedParticipants).filter(id => selectedParticipants[id]);
      await groupAPI.addExpense(selectedGroup.id, {
        amount: parseFloat(amount),
        description,
        paid_by: paidBy,
      });

      Alert.alert(
        'Başarılı! 🎉',
        `${selectedGroup.name} grubuna ₺${amount} tutarında harcama eklendi`,
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Reset form
              setAmount('');
              setDescription('');
              setSelectedCategory(null);
              setSelectedGroup(null);
              setPaidBy(null);
              setErrors({});
              
              // Navigate back to Dashboard
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Hata', 'Harcama eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (text) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const renderGroupOption = (group) => (
    <TouchableOpacity
      key={group.id}
      style={[
        styles.groupOption,
        selectedGroup?.id === group.id && styles.selectedGroupOption
      ]}
      onPress={() => {
        setSelectedGroup(group);
        setErrors(prev => ({ ...prev, group: null }));
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.groupColor, { backgroundColor: group.color }]} />
      <View style={styles.groupInfo}>
        <Text style={[
          styles.groupOptionText,
          selectedGroup?.id === group.id && styles.selectedGroupOptionText
        ]}>
          {group.name}
        </Text>
        <Text style={styles.groupMemberCount}>
          {group.memberCount} üye
        </Text>
      </View>
      {selectedGroup?.id === group.id && (
        <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
      )}
    </TouchableOpacity>
  );

  const renderCategoryOption = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        selectedCategory?.id === category.id && styles.selectedCategoryOption
      ]}
      onPress={() => {
        setSelectedCategory(category);
        setErrors(prev => ({ ...prev, category: null }));
      }}
      activeOpacity={0.7}
    >
      <View style={[
        styles.categoryIcon,
        { backgroundColor: category.color },
        selectedCategory?.id === category.id && styles.selectedCategoryIcon
      ]}>
        <Ionicons name={category.icon} size={20} color="white" />
      </View>
      <Text style={[
        styles.categoryText,
        selectedCategory?.id === category.id && styles.selectedCategoryText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderMemberOption = (member) => (
    <TouchableOpacity
      key={member.id || member}
      style={[
        styles.memberOption,
        paidBy === (member.id || member) && styles.selectedMemberOption
      ]}
      onPress={() => setPaidBy(member.id || member)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.memberAvatar,
        paidBy === (member.id || member) && styles.selectedMemberAvatar
      ]}>
        <Text style={[
          styles.memberInitial,
          paidBy === (member.id || member) && styles.selectedMemberInitial
        ]}>
          {(member.name || String(member)).charAt(0)}
        </Text>
      </View>
      <Text style={[
        styles.memberText,
        paidBy === (member.id || member) && styles.selectedMemberText
      ]}>
        {member.name || String(member)}
      </Text>
      {paidBy === (member.id || member) && (
        <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
      )}
    </TouchableOpacity>
  );

  const toggleParticipant = (userId) => {
    setSelectedParticipants(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Harcama</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>
            {/* Group Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grup Seçin</Text>
              <View style={styles.groupOptions}>
                {groups.map(g => renderGroupOption(g))}
              </View>
              {errors.group && (
                <Text style={styles.errorText}>{errors.group}</Text>
              )}
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tutar</Text>
              <View style={[
                styles.amountInput,
                errors.amount && styles.errorInput
              ]}>
                <Text style={styles.currencySymbol}>₺</Text>
                <TextInput
                  style={styles.amountTextInput}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(formatAmount(text));
                    setErrors(prev => ({ ...prev, amount: null }));
                  }}
                  keyboardType="numeric"
                  fontSize={24}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <TextInput
                style={[
                  styles.descriptionInput,
                  errors.description && styles.errorInput
                ]}
                placeholder="Harcama açıklaması..."
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setErrors(prev => ({ ...prev, description: null }));
                }}
                multiline
                placeholderTextColor="#9CA3AF"
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kategori</Text>
              <View style={styles.categoryGrid}>
                {expenseCategories.map(renderCategoryOption)}
              </View>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
            </View>

            {/* Paid By Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kim Ödedi?</Text>
              <View style={styles.memberOptions}>
                {members.map(renderMemberOption)}
              </View>
              {errors.paidBy && (
                <Text style={styles.errorText}>{errors.paidBy}</Text>
              )}
            </View>

            {/* Who owes selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kimler paylaşacak?</Text>
              <View style={styles.memberOptions}>
                {members.map(m => (
                  <TouchableOpacity
                    key={`p-${m.id}`}
                    style={[
                      styles.memberOption,
                      selectedParticipants[m.id] && styles.selectedMemberOption
                    ]}
                    onPress={() => toggleParticipant(m.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.memberAvatar,
                      selectedParticipants[m.id] && styles.selectedMemberAvatar
                    ]}>
                      <Text style={[
                        styles.memberInitial,
                        selectedParticipants[m.id] && styles.selectedMemberInitial
                      ]}>
                        {m.name?.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.memberText,
                      selectedParticipants[m.id] && styles.selectedMemberText
                    ]}>
                      {m.name}
                    </Text>
                    {selectedParticipants[m.id] && (
                      <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.participants && (
                <Text style={styles.errorText}>{errors.participants}</Text>
              )}
            </View>

            {/* Add Button */}
            <TouchableOpacity 
              style={[
                styles.addButton,
                (isSubmitting || isLoading) && styles.addButtonDisabled
              ]} 
              onPress={handleAddExpense}
              disabled={isSubmitting || isLoading}
              activeOpacity={0.8}
            >
              {(isSubmitting || isLoading) ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner} />
                  <Text style={styles.addButtonText}>Ekleniyor...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="white" />
                  <Text style={styles.addButtonText}>Harcama Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  groupOptions: {
    gap: 12,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGroupOption: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
  },
  groupColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  selectedGroupOptionText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  groupMemberCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
    marginRight: 12,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (width - 64) / 3,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryOption: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedCategoryIcon: {
    backgroundColor: '#6366F1',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  memberOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedMemberOption: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedMemberAvatar: {
    backgroundColor: '#6366F1',
  },
  memberInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedMemberInitial: {
    color: 'white',
  },
  memberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  selectedMemberText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 40,
    marginBottom: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
    marginRight: 8,
    animation: 'spin 1s linear infinite',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginLeft: 4,
  },
}); 