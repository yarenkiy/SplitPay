import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    getGridColumns,
    getResponsiveBorderRadius,
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddGroupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👥');
  const [color, setColor] = useState('#667eea');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupTypes = [
    { emoji: '🏖️', label: 'Holiday', color: '#667eea' },
    { emoji: '✈️', label: 'Trip', color: '#3B82F6' },
    { emoji: '🏠', label: 'Home', color: '#10B981' },
    { emoji: '🍽️', label: 'Food', color: '#F59E0B' },
    { emoji: '🎉', label: 'Party', color: '#EC4899' },
    { emoji: '🎓', label: 'School', color: '#8B5CF6' },
    { emoji: '💼', label: 'Work', color: '#6366F1' },
    { emoji: '👥', label: 'Friends', color: '#764ba2' },
    { emoji: '💪', label: 'Gym', color: '#EF4444' },
    { emoji: '🎮', label: 'Gaming', color: '#A855F7' },
    { emoji: '⚽', label: 'Sports', color: '#22C55E' },
    { emoji: '🎵', label: 'Music', color: '#F97316' },
  ];

  const presetColors = [
    '#667eea', '#764ba2', '#f093fb', '#6366F1', '#8B5CF6', '#EC4899', 
    '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#F97316'
  ];

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a group name');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const { groupAPI } = await import('../services/api');
      const res = await groupAPI.createGroup({ 
        name: `${selectedEmoji} ${name.trim()}`, 
        description: description.trim() || null, 
        color 
      });
      
      if (res?.data?.id && res?.data?.invite_code) {
        Alert.alert(
          'Success! 🎉',
          `Group created!\nInvite Code: ${res.data.invite_code}\n\nShare this code with friends to join the group!`,
          [
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    } catch (e) {
      console.error('Create group error:', e);
      Alert.alert('Error', 'An error occurred while creating the group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectGroupType = (type) => {
    setSelectedEmoji(type.emoji);
    setColor(type.color);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Group</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Group Type Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="apps" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Group Type</Text>
            </View>
            <View style={styles.typeGrid}>
              {groupTypes.map((type) => (
                <TouchableOpacity
                  key={type.emoji}
                  style={[
                    styles.typeCard,
                    selectedEmoji === type.emoji && styles.typeCardSelected,
                    { borderColor: selectedEmoji === type.emoji ? type.color : '#e2e8f0' }
                  ]}
                  onPress={() => selectGroupType(type)}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[
                    styles.typeLabel,
                    selectedEmoji === type.emoji && { color: type.color }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Group Name */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="text" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Group Name</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.emojiPrefix}>{selectedEmoji}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Description (Optional) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Description (Optional)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a description..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="color-palette" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Group Color</Text>
            </View>
            <View style={styles.colorGrid}>
              {presetColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorSelected
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                A unique 6-character invite code will be generated for your group. Share it with friends so they can join!
              </Text>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.createButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.createButtonText}>Create Group</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Calculate grid columns and card width based on device size
const getTypeCardColumns = () => {
  if (isSmallDevice) return 3;
  if (isTablet) return 6;
  return 4;
};

const typeCardColumns = getTypeCardColumns();
const typeCardGap = getResponsiveMargin(isSmallDevice ? 8 : 12);
const typeCardPadding = getResponsivePadding(20);

// Calculate card width in pixels: (screenWidth - 2*padding - gaps) / columns
const typeCardWidth = (SCREEN_WIDTH - (typeCardPadding * 2) - (typeCardGap * (typeCardColumns - 1))) / typeCardColumns;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: getResponsivePadding(50),
    paddingBottom: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: getResponsiveBorderRadius(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 20 : isTablet ? 26 : 22),
    fontWeight: '800',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getResponsivePadding(20),
  },
  section: {
    marginBottom: getResponsiveMargin(isSmallDevice ? 20 : 24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(12),
    gap: getResponsiveMargin(8),
  },
  sectionTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 15 : 16),
    fontWeight: '700',
    color: '#1e293b',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveMargin(isSmallDevice ? 8 : 12),
  },
  typeCard: {
    width: typeCardWidth,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: getResponsiveBorderRadius(16),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardSelected: {
    backgroundColor: '#f0f9ff',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  typeEmoji: {
    fontSize: scaleFontSize(isSmallDevice ? 24 : isTablet ? 32 : 28),
    marginBottom: getResponsiveMargin(4),
  },
  typeLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 11),
    fontWeight: '600',
    color: '#64748b',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: getResponsiveBorderRadius(16),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(4),
  },
  emojiPrefix: {
    fontSize: scaleFontSize(24),
    marginRight: getResponsiveMargin(12),
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(16),
    color: '#1e293b',
    paddingVertical: getResponsivePadding(14),
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveBorderRadius(16),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(14),
    textAlignVertical: 'top',
    minHeight: isSmallDevice ? 80 : 100,
    fontSize: scaleFontSize(16),
    color: '#1e293b',
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveMargin(12),
  },
  colorOption: {
    width: isSmallDevice ? 44 : isTablet ? 60 : 50,
    height: isSmallDevice ? 44 : isTablet ? 60 : 50,
    borderRadius: getResponsiveBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(16),
    marginBottom: getResponsiveMargin(24),
    gap: getResponsiveMargin(12),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: getResponsiveMargin(4),
  },
  infoText: {
    fontSize: scaleFontSize(13),
    color: '#075985',
    lineHeight: scaleFontSize(18),
  },
  createButton: {
    borderRadius: getResponsiveBorderRadius(16),
    overflow: 'hidden',
    marginBottom: getResponsiveMargin(20),
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(isSmallDevice ? 16 : 18),
  },
  createButtonText: {
    fontSize: scaleFontSize(18),
    fontWeight: '800',
    color: '#fff',
  },
});
