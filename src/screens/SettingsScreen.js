import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { authAPI, dashboardAPI, groupAPI } from '../services/api';
import {
    getResponsiveBorderRadius,
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';
import { showError, showSuccess, showConfirmation } from '../utils/errorHandler';

export default function SettingsScreen() {
  const { user, logout } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

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
    showConfirmation(
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
    showConfirmation(
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
              showSuccess('Success', 'Group deleted successfully.');
            } catch (error) {
              console.error('Error deleting group:', error);
              console.error('Error response:', error.response?.data);
              console.error('Error status:', error.response?.status);
              showError('Error', `An error occurred while deleting the group: ${error.response?.data?.message || error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      showError('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Error', 'New passwords do not match');
      return;
    }

    setChangePasswordLoading(true);
    
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      showSuccess('Success', response.data.message || 'Your password has been changed successfully.');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while changing password.';
      showError('Error', errorMessage);
    } finally {
      setChangePasswordLoading(false);
    }
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
              
              <TouchableOpacity 
                style={styles.changePasswordButton}
                onPress={() => setShowChangePasswordModal(true)}
              >
                <Ionicons name="lock-closed-outline" size={16} color="#6366F1" />
                <Text style={styles.changePasswordText}>Change Password</Text>
              </TouchableOpacity>
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

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your current password"
                placeholderTextColor="#9CA3AF"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your new password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, changePasswordLoading && styles.modalSaveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={changePasswordLoading}
              >
                <Text style={styles.modalSaveText}>
                  {changePasswordLoading ? 'Changing...' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveBorderRadius(8),
    marginTop: getResponsiveMargin(20),
  },
  changePasswordText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: getResponsiveMargin(6),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(24),
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(24),
  },
  modalInputContainer: {
    marginBottom: getResponsiveMargin(16),
  },
  modalInputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: getResponsiveMargin(6),
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: getResponsiveBorderRadius(8),
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
    fontSize: scaleFontSize(16),
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveMargin(24),
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: getResponsivePadding(12),
    borderRadius: getResponsiveBorderRadius(8),
    alignItems: 'center',
    marginRight: getResponsiveMargin(8),
  },
  modalCancelText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: getResponsivePadding(12),
    borderRadius: getResponsiveBorderRadius(8),
    alignItems: 'center',
    marginLeft: getResponsiveMargin(8),
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSaveText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: 'white',
  },
}); 