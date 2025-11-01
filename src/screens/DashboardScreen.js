import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CurrencyConverter from '../../components/CurrencyConverter';
import { AuthContext } from '../context/AuthContext';
import { useSelectedGroup } from '../context/SelectedGroupContext';
import { dashboardAPI, groupAPI } from '../services/api';
import {
  getCardWidth,
  getResponsiveBorderRadius,
  getResponsiveMargin,
  getResponsivePadding,
  isSmallDevice,
  isTablet,
  scaleFontSize
} from '../utils/responsive';
import { showError, showSuccess, showConfirmation, showInfo } from '../utils/errorHandler';

export default function DashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { logout, user } = useContext(AuthContext);
  const { setSelectedGroupId } = useSelectedGroup();
  
  console.log('DashboardScreen mounted');
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalDebt: 0,
    totalCredit: 0,
    balance: 0,
  });
  const [groups, setGroups] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);

  // Ekran her göründüğünde verileri yenile
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getDashboardData();
      
      if (response.data.success) {
        const { summary, groups: userGroups, activities } = response.data.data;
        setSummaryData(summary);
        setGroups(userGroups);
        setRecentActivities(activities);
      } else {
        showError('Error', 'Dashboard data could not be loaded');
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      showError('Error', 'An error occurred while loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await dashboardAPI.getDashboardData();
      
      if (response.data.success) {
        const { summary, groups: userGroups, activities } = response.data.data;
        setSummaryData(summary);
        setGroups(userGroups);
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJoinGroup = async () => {
    if (!inviteCode || inviteCode.trim().length !== 6) {
      showError('Invalid Code', 'Please enter a valid 6-character invite code');
      return;
    }

    try {
      setIsJoining(true);
      const response = await groupAPI.joinGroupByCode(inviteCode.trim().toUpperCase());
      
      if (response.data.success) {
        showSuccess('Success! 🎉', response.data.message);
        setJoinModalVisible(false);
        setInviteCode('');
        // Refresh dashboard data to show new group
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Join group error:', error);
      const message = error.response?.data?.message || 'Failed to join group';
      showError('Error', message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 🔹 Navigasyon helper
  const navigateToTab = (tabName) => {
    try {
      if (tabName === 'Yeni Harcama') {
        router.push('/expense');
      } else if (tabName === 'Yeni Grup') {
        router.push('/group');
      }
    } catch (error) {
      console.log('Navigation error:', error);
      showError('Error', 'Navigation failed');
    }
  };

  // --- UI Helpers ---
  const copyInviteCode = (code) => {
    Clipboard.setString(code);
    showInfo('Copied! 📋', `Invite code ${code} copied to clipboard`);
  };

  const handleGroupPress = (group) => {
    // Set selected group and navigate to My Groups tab
    setSelectedGroupId(group.id);
    // Navigate to My Groups tab using Expo Router
    router.push('/(tabs)/summary');
  };

  const renderGroupCard = (group) => (
    <TouchableOpacity 
      style={styles.groupCard} 
      key={group.id}
      onPress={() => handleGroupPress(group)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={[styles.groupColor, { backgroundColor: group.color }]} />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMembers}>{group.members} members</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </View>
      
      <View style={styles.groupFooter}>
        <View style={styles.inviteCodeContainer}>
          <Ionicons name="key" size={14} color="#64748b" />
          <Text style={styles.inviteCodeLabel}>Code:</Text>
          <Text style={styles.inviteCode}>{group.inviteCode}</Text>
        </View>
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={(e) => {
            e.stopPropagation();
            copyInviteCode(group.inviteCode);
          }}
        >
          <Ionicons name="copy" size={16} color="#667eea" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleDeleteActivity = async (activityId) => {
    showConfirmation(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupAPI.deleteExpense(activityId);
              // Refresh the dashboard data to show updated activities
              fetchDashboardData();
            } catch (error) {
              console.error('Delete activity error:', error);
              const message = error.response?.data?.message || 'Failed to delete activity';
              showError('Error', message);
            }
          },
        },
      ]
    );
  };

  const renderActivityItem = (activity) => (
    <View style={styles.activityItem} key={activity.id}>
      <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
        <Ionicons name={activity.icon} size={20} color="white" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityMessage}>{activity.message}</Text>
        {activity.detail && <Text style={styles.activityDetail}>{activity.detail}</Text>}
        <Text style={styles.activityGroup}>{activity.group}</Text>
      </View>
      <View style={styles.activityActions}>
        <Text style={styles.activityTime}>{activity.time}</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteActivity(activity.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuickAction = (title, icon, color, onPress) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  // --- Loading State ---
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </View>
    );
  }

  // --- Main UI ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.appName}>LetSPLIT</Text>
              <Text style={styles.greetingText}>Hi, {user?.name || 'User'}! 👋</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="exit-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea', '#764ba2', '#f093fb']}
            tintColor="#667eea"
            title="Loading..."
            titleColor="#667eea"
          />
        }
      >
        
        {/* Groups - Horizontal Scroll */}
        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupsScrollContent}
          >
            {groups.map(renderGroupCard)}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('New Expense', 'add-circle', '#6366F1', () => navigateToTab('Yeni Harcama'))}
            {renderQuickAction('New Group', 'people', '#F472B6', () => navigateToTab('Yeni Grup'))}
            {renderQuickAction('Join Group', 'enter', '#4ECDC4', () => setJoinModalVisible(true))}
            {renderQuickAction('Notes', 'list', '#10B981', () => router.push('/notes'))}
          </View>
          <View style={styles.currencyActionContainer}>
            <TouchableOpacity 
              style={styles.currencyQuickAction} 
              onPress={() => setShowCurrencyConverter(true)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#667eea' }]}>
                <Ionicons name="swap-horizontal" size={24} color="white" />
              </View>
              <Text style={styles.quickActionText}>Currency Converter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentActivities.map(renderActivityItem)}
        </View>
      </ScrollView>

      {/* Join Group Modal */}
      <Modal
        visible={joinModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Group</Text>
              <TouchableOpacity 
                onPress={() => {
                  setJoinModalVisible(false);
                  setInviteCode('');
                }}
              >
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the 6-character invite code shared by your friend
            </Text>

            <TextInput
              style={styles.codeInput}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="#94a3b8"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={handleJoinGroup}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="enter" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.joinButtonText}>Join Group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Converter Modal */}
      <CurrencyConverter
        visible={showCurrencyConverter}
        onClose={() => setShowCurrencyConverter(false)}
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { 
    marginTop: getResponsiveMargin(16), 
    fontSize: scaleFontSize(16), 
    color: '#667eea', 
    fontWeight: '600' 
  },
  headerGradient: { 
    paddingHorizontal: getResponsivePadding(24),
    paddingBottom: getResponsivePadding(24),
    paddingTop: getResponsivePadding(12),
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingTop: getResponsivePadding(8),
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: scaleFontSize(isSmallDevice ? 28 : isTablet ? 40 : 32),
    fontWeight: '800',
    color: 'white',
    marginBottom: getResponsiveMargin(6),
    letterSpacing: -1,
  },
  greetingText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: 'white',
    opacity: 0.95,
    fontWeight: '500',
  },
  logoutButton: { 
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveMargin(4),
  },
  content: { flex: 1 },
  sectionTitle: { 
    fontSize: scaleFontSize(isSmallDevice ? 18 : 20), 
    fontWeight: '700', 
    color: '#1F2937', 
    marginTop: getResponsiveMargin(20), 
    marginBottom: getResponsiveMargin(14), 
    letterSpacing: -0.5, 
    paddingHorizontal: getResponsivePadding(20) 
  },
  quickActionsSection: { 
    marginTop: getResponsiveMargin(20), 
    paddingHorizontal: getResponsivePadding(20) 
  },
  quickActionsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: getResponsiveMargin(isSmallDevice ? 8 : 12),
    marginBottom: getResponsiveMargin(12),
  },
  quickAction: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(18),
    padding: getResponsivePadding(isSmallDevice ? 14 : 18),
    alignItems: 'center',
    width: isTablet ? '23%' : '47%',
    shadowColor: '#7A5FD8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(192, 111, 187, 0.1)',
  },
  quickActionIcon: {
    width: isSmallDevice ? 46 : isTablet ? 60 : 52,
    height: isSmallDevice ? 46 : isTablet ? 60 : 52,
    borderRadius: getResponsiveBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveMargin(10),
  },
  quickActionText: { 
    fontSize: scaleFontSize(isSmallDevice ? 12 : 13), 
    fontWeight: '700', 
    color: '#374151', 
    textAlign: 'center', 
    letterSpacing: -0.3 
  },
  groupsSection: { marginTop: getResponsiveMargin(8) },
  groupsScrollContent: { 
    paddingHorizontal: getResponsivePadding(20),
    gap: getResponsiveMargin(14),
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(20),
    padding: getResponsivePadding(isSmallDevice ? 16 : 18),
    width: getCardWidth(isTablet ? 2.5 : 1.3),
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.08)',
  },
  groupHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: getResponsiveMargin(12) 
  },
  groupColor: { 
    width: isSmallDevice ? 12 : 14, 
    height: isSmallDevice ? 12 : 14, 
    borderRadius: isSmallDevice ? 6 : 7, 
    marginRight: getResponsiveMargin(14) 
  },
  groupInfo: { flex: 1 },
  groupName: { 
    fontSize: scaleFontSize(isSmallDevice ? 15 : 17), 
    fontWeight: '700', 
    color: '#1F2937', 
    marginBottom: getResponsiveMargin(4), 
    letterSpacing: -0.3 
  },
  groupMembers: { 
    fontSize: scaleFontSize(isSmallDevice ? 12 : 13), 
    color: '#6B7280', 
    fontWeight: '500' 
  },
  groupBalance: { alignItems: 'flex-end' },
  groupBalanceText: { 
    fontSize: scaleFontSize(17), 
    fontWeight: '800', 
    letterSpacing: -0.5 
  },
  groupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: getResponsivePadding(12),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: getResponsiveMargin(8),
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: getResponsivePadding(10),
    paddingVertical: getResponsivePadding(6),
    borderRadius: getResponsiveBorderRadius(8),
    gap: getResponsiveMargin(6),
  },
  inviteCodeLabel: { 
    fontSize: scaleFontSize(12), 
    color: '#64748b', 
    fontWeight: '600' 
  },
  inviteCode: { 
    fontSize: scaleFontSize(13), 
    fontWeight: '800', 
    color: '#667eea', 
    letterSpacing: 1 
  },
  copyButton: {
    backgroundColor: '#e9e7fd',
    padding: getResponsivePadding(8),
    borderRadius: getResponsiveBorderRadius(8),
  },
  activitiesSection: { 
    marginTop: getResponsiveMargin(12), 
    marginBottom: getResponsiveMargin(24), 
    paddingHorizontal: getResponsivePadding(20) 
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(isSmallDevice ? 14 : 16),
    marginBottom: getResponsiveMargin(12),
    shadowColor: '#7A5FD8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(122, 95, 216, 0.06)',
  },
  activityIcon: { 
    width: isSmallDevice ? 40 : 44, 
    height: isSmallDevice ? 40 : 44, 
    borderRadius: getResponsiveBorderRadius(14), 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: getResponsiveMargin(14) 
  },
  activityContent: { flex: 1 },
  activityMessage: { 
    fontSize: scaleFontSize(isSmallDevice ? 13 : 14), 
    fontWeight: '600', 
    color: '#1F2937', 
    marginBottom: getResponsiveMargin(2), 
    letterSpacing: -0.2 
  },
  activityDetail: { 
    fontSize: scaleFontSize(12), 
    color: '#667eea', 
    fontWeight: '500', 
    marginBottom: getResponsiveMargin(2) 
  },
  activityGroup: { 
    fontSize: scaleFontSize(12), 
    color: '#6B7280', 
    fontWeight: '500' 
  },
  activityActions: { 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    height: isSmallDevice ? 40 : 44 
  },
  activityTime: { 
    fontSize: scaleFontSize(11), 
    color: '#9CA3AF', 
    fontWeight: '600', 
    marginBottom: getResponsiveMargin(4) 
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    padding: getResponsivePadding(6),
    borderRadius: getResponsiveBorderRadius(8),
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    borderRadius: getResponsiveBorderRadius(24), 
    padding: getResponsivePadding(isSmallDevice ? 24 : 28), 
    width: isTablet ? '60%' : '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: getResponsiveMargin(16) 
  },
  modalTitle: { 
    fontSize: scaleFontSize(isSmallDevice ? 20 : 24), 
    fontWeight: '800', 
    color: '#1F2937' 
  },
  modalDescription: { 
    fontSize: scaleFontSize(15), 
    color: '#64748b', 
    marginBottom: getResponsiveMargin(24), 
    lineHeight: scaleFontSize(22) 
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(18),
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(24),
    backgroundColor: '#f8fafc',
  },
  joinButton: {
    backgroundColor: '#667eea',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: { backgroundColor: '#94a3b8', opacity: 0.7 },
  joinButtonText: { 
    fontSize: scaleFontSize(16), 
    fontWeight: '700', 
    color: '#fff' 
  },
  // Currency Converter Card styles
  currencyConverterSection: {
    marginTop: getResponsiveMargin(16),
    paddingHorizontal: getResponsivePadding(20),
  },
  currencyConverterCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(16),
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  currencyConverterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsivePadding(16),
    justifyContent: 'space-between',
  },
  currencyConverterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyConverterIcon: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: getResponsiveBorderRadius(12),
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveMargin(12),
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  currencyConverterText: {
    flex: 1,
  },
  currencyConverterTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 15),
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: getResponsiveMargin(2),
    letterSpacing: -0.2,
  },
  currencyConverterSubtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 12),
    color: '#64748b',
    fontWeight: '500',
  },
  currencyConverterRight: {
    paddingLeft: getResponsivePadding(8),
  },
  currencyActionContainer: {
    marginTop: getResponsiveMargin(8),
  },
  currencyQuickAction: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(18),
    padding: getResponsivePadding(isSmallDevice ? 14 : 18),
    alignItems: 'center',
    width: '100%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
});
