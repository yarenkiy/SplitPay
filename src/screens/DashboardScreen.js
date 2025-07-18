import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useState } from 'react';
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
  const navigation = useNavigation();
  const { logout, user } = useContext(AuthContext);
  
  // Debug navigation object
  console.log('Navigation object:', navigation);
  console.log('Navigation methods:', Object.keys(navigation || {}));
  console.log('Navigation type:', navigation?.getState?.()?.type);
  console.log('Current route:', navigation?.getCurrentRoute?.());
  
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalDebt: 0,
    totalCredit: 0,
    balance: 0,
  });
  const [groups, setGroups] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const navigateToTab = (tabName) => {
    try {
      console.log('Attempting to navigate to:', tabName);
      
      // Navigate to Yeni Harcama tab
      if (tabName === 'Harcama') {
        if (navigation && navigation.navigate) {
          console.log('Navigating to Yeni Harcama tab');
          navigation.navigate('Yeni Harcama');
        } else {
          console.log('Navigation not available');
        }
      } else {
        // For other tabs, use regular navigation
        if (navigation && navigation.navigate) {
          console.log('Navigating to tab:', tabName);
          navigation.navigate(tabName);
        } else {
          console.log('Navigation not available');
        }
      }
    } catch (error) {
      console.log('Navigation error:', error);
      console.log('Navigation object:', navigation);
    }
  };


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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#F472B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>SplitPay</Text>
            <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'User'}!</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            {renderSummaryCard(
              'Total Debt',
              summaryData.totalDebt,
              'You owe to others',
              '#FF6B6B',
              'arrow-down'
            )}
            {renderSummaryCard(
              'Total Credit',
              summaryData.totalCredit,
              'Others owe you',
              '#4ECDC4',
              'arrow-up'
            )}
            {renderSummaryCard(
              'Balance',
              summaryData.balance,
              'Credit - Debt',
              summaryData.balance >= 0 ? '#4ECDC4' : '#FF6B6B',
              'wallet'
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('New Expense', 'add-circle', '#6366F1', () => navigateToTab('Harcama'))}
            {renderQuickAction('New Group', 'people', '#F472B6', () => navigateToTab('Gruplar'))}
            {renderQuickAction('Share Debt', 'share', '#4ECDC4', () => {
              // TODO: Implement debt sharing functionality
              console.log('Debt sharing feature not yet implemented');
            })}
            {renderQuickAction('View Summary', 'stats-chart', '#FF6B6B', () => navigateToTab('Özet'))}
          </View>
        </View>

        {/* Groups */}
        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          {groups.map(renderGroupCard)}
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentActivities.map(renderActivityItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 25,
    marginBottom: 15,
  },
  summarySection: {
    marginTop: -20,
  },
  summaryGrid: {
    gap: 15,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quickActionsSection: {
    marginTop: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  quickAction: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  groupsSection: {
    marginTop: 10,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  groupBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginRight: 5,
  },
  activitiesSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityGroup: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
}); 