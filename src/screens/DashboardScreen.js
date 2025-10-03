import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { logout, user } = useContext(AuthContext);
  
  console.log('DashboardScreen mounted');
  
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalDebt: 0,
    totalCredit: 0,
    balance: 0,
  });
  const [groups, setGroups] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 🔹 Navigasyon helper - Expo Router kullanımı
  const navigateToTab = (tabName) => {
    console.log('=== Navigation Debug ===');
    console.log('Navigating to:', tabName);
    
    try {
      if (tabName === 'Yeni Harcama') {
        router.push('/expense');
      } else if (tabName === 'Yeni Grup') {
        router.push('/group');
      } else {
        console.log('Unknown route:', tabName);
      }
    } catch (error) {
      console.log('Navigation error:', error);
      Alert.alert('Navigasyon Hatası', error.message || 'Bilinmeyen hata');
    }
  };

  // --- UI Helpers ---
  const renderSummaryCard = (title, amount, subtitle, color, icon) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={styles.summaryHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={[styles.summaryAmount, { color }]}>₺{amount.toLocaleString()}</Text>
      <Text style={styles.summarySubtitle}>{subtitle}</Text>
    </View>
  );

  const renderGroupCard = (group) => (
    <TouchableOpacity style={styles.groupCard} key={group.id}>
      <View style={styles.groupHeader}>
        <View style={[styles.groupColor, { backgroundColor: group.color }]} />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMembers}>{group.members} member</Text>
        </View>
        <View style={styles.groupBalance}>
          <Text style={[
            styles.groupBalanceText,
            { color: group.debt > 0 ? '#FF6B6B' : group.debt < 0 ? '#4ECDC4' : '#666' }
          ]}>
            {group.debt > 0 ? '+' : ''}₺{Math.abs(group.debt).toLocaleString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.detailButton}>
        <Text style={styles.detailButtonText}>Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#6366F1" />
      </TouchableOpacity>
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
        <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
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
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
      
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={['#0EA5E9', '#06B6D4', '#14B8A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.appName}>SplitPay</Text>
              <Text style={styles.greetingText}>Hi, {user?.name || 'User'}! 👋</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="exit-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            {renderSummaryCard('Total Debt', summaryData.totalDebt, 'You owe to others', '#FF6B6B', 'arrow-down')}
            {renderSummaryCard('Total Credit', summaryData.totalCredit, 'Others owe you', '#4ECDC4', 'arrow-up')}
            {renderSummaryCard('Balance', summaryData.balance, 'Credit - Debt',
              summaryData.balance >= 0 ? '#4ECDC4' : '#FF6B6B', 'wallet')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('New Expense', 'add-circle', '#6366F1', () => navigateToTab('Yeni Harcama'))}
            {renderQuickAction('New Group', 'people', '#F472B6', () => navigateToTab('Yeni Grup'))}
            {renderQuickAction('Share Debt', 'share', '#4ECDC4', () => {
              console.log('Debt sharing feature not yet implemented');
            })}
            {renderQuickAction('View Summary', 'stats-chart', '#FF6B6B', () => navigateToTab('Özet'))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentActivities.map(renderActivityItem)}
        </View>
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#0EA5E9', fontWeight: '600' },
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
  summarySection: { paddingHorizontal: 20 },
  summaryGrid: { gap: 16 },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 22,
    borderLeftWidth: 5,
    shadowColor: '#C06FBB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 10 },
  summaryAmount: { fontSize: 28, fontWeight: '800', marginBottom: 6, letterSpacing: -1 },
  summarySubtitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  quickActionsSection: { marginTop: 12, paddingHorizontal: 20 },
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
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  groupColor: { width: 14, height: 14, borderRadius: 7, marginRight: 14 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 4, letterSpacing: -0.3 },
  groupMembers: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  groupBalance: { alignItems: 'flex-end' },
  groupBalanceText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  detailButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderTopWidth: 1.5, 
    borderTopColor: 'rgba(243, 244, 246, 0.8)',
    marginTop: 4,
  },
  detailButtonText: { fontSize: 14, fontWeight: '700', color: '#C06FBB', marginRight: 6 },
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
});
