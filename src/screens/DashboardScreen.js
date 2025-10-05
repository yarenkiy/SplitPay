import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { AuthContext } from '../context/AuthContext';
import { useSelectedGroup } from '../context/SelectedGroupContext';
import { dashboardAPI, groupAPI } from '../services/api';

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
        Alert.alert('Error', 'Dashboard data could not be loaded');
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      Alert.alert('Error', 'An error occurred while loading data');
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
      Alert.alert('Invalid Code', 'Please enter a valid 6-character invite code');
      return;
    }

    try {
      setIsJoining(true);
      const response = await groupAPI.joinGroupByCode(inviteCode.trim().toUpperCase());
      
      if (response.data.success) {
        Alert.alert('Success! 🎉', response.data.message);
        setJoinModalVisible(false);
        setInviteCode('');
        // Refresh dashboard data to show new group
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Join group error:', error);
      const message = error.response?.data?.message || 'Failed to join group';
      Alert.alert('Error', message);
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
      Alert.alert('Error', 'Navigation failed');
    }
  };

  // --- UI Helpers ---
  const copyInviteCode = (code) => {
    Clipboard.setString(code);
    Alert.alert('Copied! 📋', `Invite code ${code} copied to clipboard`);
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

  const renderActivityItem = (activity) => (
    <View style={styles.activityItem} key={activity.id}>
      <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
        <Ionicons name={activity.icon} size={20} color="white" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityMessage}>{activity.message}</Text>
        <Text style={styles.activityGroup}>{activity.group}</Text>
      </View>
      <Text style={styles.activityTime}>{activity.time}</Text>
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
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#667eea', fontWeight: '600' },
  headerGradient: { 
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -1,
  },
  greetingText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.95,
    fontWeight: '500',
  },
  logoutButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  content: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginTop: 20, marginBottom: 14, letterSpacing: -0.5, paddingHorizontal: 20 },
  quickActionsSection: { marginTop: 20, paddingHorizontal: 20 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  quickAction: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#7A5FD8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(192, 111, 187, 0.1)',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionText: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'center', letterSpacing: -0.3 },
  groupsSection: { marginTop: 8 },
  groupsScrollContent: { 
    paddingHorizontal: 20,
    gap: 14,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    width: 280,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.08)',
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupColor: { width: 14, height: 14, borderRadius: 7, marginRight: 14 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 4, letterSpacing: -0.3 },
  groupMembers: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  groupBalance: { alignItems: 'flex-end' },
  groupBalanceText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  groupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  inviteCodeLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  inviteCode: { fontSize: 13, fontWeight: '800', color: '#667eea', letterSpacing: 1 },
  copyButton: {
    backgroundColor: '#e9e7fd',
    padding: 8,
    borderRadius: 8,
  },
  activitiesSection: { marginTop: 12, marginBottom: 24, paddingHorizontal: 20 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#7A5FD8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(122, 95, 216, 0.06)',
  },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  activityContent: { flex: 1 },
  activityMessage: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4, letterSpacing: -0.2 },
  activityGroup: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  activityTime: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 28, 
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  modalDescription: { fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 22 },
  codeInput: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 24,
    backgroundColor: '#f8fafc',
  },
  joinButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
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
  joinButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
