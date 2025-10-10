import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { dashboardAPI, groupAPI } from '../services/api';
import {
  getResponsiveBorderRadius,
  getResponsiveMargin,
  getResponsivePadding,
  isSmallDevice,
  isTablet,
  scaleFontSize
} from '../utils/responsive';

export default function SettingsScreen() {
  const { user, logout } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch groups from database
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getUserGroups();
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch groups when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => logout()
        },
      ]
    );
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"? This action cannot be undone and all expenses related to this group will be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting group with ID:', groupId);
              const response = await groupAPI.deleteGroup(groupId);
              console.log('Delete response:', response.data);
              // Remove from local state
              setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
              Alert.alert('Success', 'Group deleted successfully.');
            } catch (error) {
              console.error('Error deleting group:', error);
              console.error('Error response:', error.response?.data);
              console.error('Error status:', error.response?.status);
              Alert.alert('Error', `An error occurred while deleting the group: ${error.response?.data?.message || error.message}`);
            }
          }
        }
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              
              <Text style={[styles.label, styles.emailLabel]}>Email</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </View>

        {/* Delete Groups Section */}
        <View style={styles.deleteGroupSection}>
          <Text style={styles.sectionTitle}>Manage Groups</Text>
          <View style={styles.groupsList}>
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading groups...</Text>
              </View>
            ) : groups.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>You don't have any groups yet</Text>
              </View>
            ) : (
              groups.map((group, index) => (
                <View 
                  key={group.id} 
                  style={[
                    styles.groupItem,
                    index === groups.length - 1 && styles.lastGroupItem
                  ]}
                >
                  <View style={styles.groupItemLeft}>
                    <View style={[styles.groupColorDot, { backgroundColor: group.color }]} />
                    <View style={styles.groupItemInfo}>
                      <Text style={styles.groupItemName}>{group.name}</Text>
                      <Text style={styles.groupItemMembers}>{group.members} members</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGroup(group.id, group.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(15),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 22 : isTablet ? 28 : 24),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(isSmallDevice ? 24 : 30),
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(isSmallDevice ? 20 : 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: isSmallDevice ? 70 : isTablet ? 100 : 80,
    height: isSmallDevice ? 70 : isTablet ? 100 : 80,
    borderRadius: isSmallDevice ? 35 : isTablet ? 50 : 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveMargin(20),
    alignSelf: 'center',
  },
  avatarText: {
    fontSize: scaleFontSize(isSmallDevice ? 28 : isTablet ? 40 : 32),
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  label: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: getResponsiveMargin(16),
    marginBottom: getResponsiveMargin(4),
  },
  emailLabel: {
    marginTop: getResponsiveMargin(12),
  },
  profileName: {
    fontSize: scaleFontSize(isSmallDevice ? 20 : isTablet ? 28 : 24),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileEmail: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: '#6B7280',
  },
  deleteGroupSection: {
    paddingHorizontal: getResponsivePadding(20),
    marginTop: getResponsiveMargin(20),
  },
  sectionTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(15),
  },
  groupsList: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: getResponsivePadding(30),
  },
  loadingText: {
    fontSize: scaleFontSize(14),
    color: '#6B7280',
    marginTop: getResponsiveMargin(12),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: getResponsivePadding(30),
  },
  emptyText: {
    fontSize: scaleFontSize(14),
    color: '#9CA3AF',
    marginTop: getResponsiveMargin(12),
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastGroupItem: {
    borderBottomWidth: 0,
  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupColorDot: {
    width: isSmallDevice ? 10 : 12,
    height: isSmallDevice ? 10 : 12,
    borderRadius: isSmallDevice ? 5 : 6,
    marginRight: getResponsiveMargin(12),
  },
  groupItemInfo: {
    flex: 1,
  },
  groupItemName: {
    fontSize: scaleFontSize(isSmallDevice ? 15 : 16),
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(2),
  },
  groupItemMembers: {
    fontSize: scaleFontSize(12),
    color: '#6B7280',
  },
  deleteButton: {
    padding: getResponsivePadding(8),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: getResponsivePadding(20),
    marginTop: getResponsiveMargin(20),
    marginBottom: getResponsiveMargin(isSmallDevice ? 40 : 50),
    paddingVertical: getResponsivePadding(isSmallDevice ? 14 : 16),
    borderRadius: getResponsiveBorderRadius(12),
    borderWidth: 1,
    borderColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#F44336',
    marginLeft: getResponsiveMargin(8),
  },
}); 