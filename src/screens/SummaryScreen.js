import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelectedGroup } from '../context/SelectedGroupContext';
import { dashboardAPI, groupAPI } from '../services/api';
import {
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';

export default function SummaryScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAllExpensesModal, setShowAllExpensesModal] = useState(false);
  const { selectedGroupId, setSelectedGroupId } = useSelectedGroup();

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  // When selectedGroupId changes from context, auto-select that group
  useEffect(() => {
    if (selectedGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        handleGroupSelect(group);
        // Clear the selected ID after handling
        setSelectedGroupId(null);
      }
    }
  }, [selectedGroupId, groups]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getUserGroups();
      if (response.data && response.data.success) {
        setGroups(response.data.data || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Fetch groups error:', error);
      setGroups([]);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      setLoadingDetails(true);
      const response = await groupAPI.getGroupDetails(groupId);
      if (response.data.success) {
        setGroupDetails(response.data.data);
      }
    } catch (error) {
      console.error('Fetch group details error:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
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
              await groupAPI.deleteExpense(expenseId);
              // Refresh the group details to show updated expenses
              if (selectedGroup) {
                fetchGroupDetails(selectedGroup.id);
              }
            } catch (error) {
              console.error('Delete expense error:', error);
              const message = error.response?.data?.message || 'Failed to delete expense';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    fetchGroupDetails(group.id);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setGroupDetails(null);
  };

  const renderGroupCard = (group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupCard}
      onPress={() => handleGroupSelect(group)}
    >
      <View style={styles.groupCardHeader}>
        <View style={[styles.groupColor, { backgroundColor: group.color }]} />
        <View style={styles.groupCardInfo}>
          <Text style={styles.groupCardName}>{group.name}</Text>
          <Text style={styles.groupCardMembers}>
            {group.members} member{group.members !== 1 ? 's' : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#64748b" />
      </View>
    </TouchableOpacity>
  );

  const renderGroupsList = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>My Groups</Text>
        <Text style={styles.headerSubtitle}>Select a group to view details</Text>
      </LinearGradient>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#cbd5e1" />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create or join a group to get started</Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map(renderGroupCard)}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderGroupDetails = () => {
    if (loadingDetails) {
      return (
        <View style={styles.container}>
          <View style={styles.detailsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToGroups}>
              <Ionicons name="arrow-back" size={24} color="#667eea" />
            </TouchableOpacity>
            <Text style={styles.detailsHeaderTitle}>{selectedGroup.name}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        </View>
      );
    }

    if (!groupDetails) return null;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[selectedGroup.color || '#667eea', '#764ba2']}
            style={styles.detailsHeaderGradient}
          >
            <View style={styles.detailsHeader}>
              <TouchableOpacity style={styles.backButtonWhite} onPress={handleBackToGroups}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.detailsHeaderInfo}>
                <Text style={styles.detailsHeaderTitle}>{groupDetails.group.name}</Text>
                {groupDetails.group.description && (
                  <Text style={styles.detailsHeaderSubtitle}>{groupDetails.group.description}</Text>
                )}
              </View>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.inviteCodeBox}>
              <Ionicons name="key" size={20} color="#fff" />
              <View style={styles.inviteCodeInfo}>
                <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                <Text style={styles.inviteCodeValue}>{groupDetails.group.inviteCode}</Text>
              </View>
            </View>
          </LinearGradient>

        <View style={styles.content}>
          {/* Summary Stats */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="arrow-up-circle" size={24} color="#10b981" />
                <Text style={styles.summaryLabel}>My Expenses</Text>
              </View>
              {groupDetails.summary.incomesByCurrency && Object.keys(groupDetails.summary.incomesByCurrency).length > 0 ? (
                Object.entries(groupDetails.summary.incomesByCurrency).map(([currency, data]) => (
                  <Text key={currency} style={[styles.summaryValue, { color: '#10b981', fontSize: 22, marginBottom: 4 }]}>
                    {data.symbol}{data.total.toLocaleString()} {currency}
                  </Text>
                ))
              ) : (
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  ₺0
                </Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="arrow-down-circle" size={24} color="#ef4444" />
                <Text style={styles.summaryLabel}>Total Expenses</Text>
              </View>
              {groupDetails.summary.expensesByCurrency && Object.keys(groupDetails.summary.expensesByCurrency).length > 0 ? (
                Object.entries(groupDetails.summary.expensesByCurrency).map(([currency, data]) => (
                  <Text key={currency} style={[styles.summaryValue, { color: '#ef4444', fontSize: 22, marginBottom: 4 }]}>
                    {data.symbol}{data.total.toLocaleString()} {currency}
                  </Text>
                ))
              ) : (
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  ₺0
                </Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="people" size={24} color="#3b82f6" />
                <Text style={styles.summaryLabel}>Members</Text>
              </View>
              <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>
                {groupDetails.summary.memberCount}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="receipt" size={24} color="#8b5cf6" />
                <Text style={styles.summaryLabel}>Expenses</Text>
              </View>
              <Text style={[styles.summaryValue, { color: '#8b5cf6' }]}>
                {groupDetails.summary.expenseCount}
              </Text>
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Members</Text>
            </View>
            <View style={styles.card}>
              {groupDetails.members.map((member, index) => (
                <View key={member.id} style={[
                  styles.memberItem,
                  index !== groupDetails.members.length - 1 && styles.memberItemBorder
                ]}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.memberBalance}>
                    <Text style={styles.memberBalanceLabel}>
                      {member.balance > 0 ? 'owes' : member.balance < 0 ? 'gets back' : 'settled'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Who Owes Whom Section */}
          {groupDetails.balances.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="git-compare" size={20} color="#667eea" />
                <Text style={styles.sectionTitle}>Who Owes Whom</Text>
              </View>
              <View style={styles.card}>
                {groupDetails.balances.map((balance, index) => (
                  <View key={index} style={[
                    styles.balanceItem,
                    index !== groupDetails.balances.length - 1 && styles.memberItemBorder
                  ]}>
                    <View style={styles.balanceFlow}>
                      <Text style={styles.balanceFromName}>{balance.from}</Text>
                      <Ionicons name="arrow-forward" size={20} color="#667eea" />
                      <Text style={styles.balanceToName}>{balance.to}</Text>
                    </View>
                    <View style={styles.balanceAmountBox}>
                      <Text style={styles.balanceAmount}>
                        {balance.currencySymbol || '₺'}{balance.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent Expenses Section */}
          {groupDetails.recentExpenses.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt" size={20} color="#667eea" />
                <Text style={styles.sectionTitle}>Recent Expenses</Text>
              </View>
              <View style={styles.card}>
                {groupDetails.recentExpenses.slice(0, 5).map((expense, index) => (
                  <View key={expense.id} style={[
                    styles.expenseItem,
                    index !== Math.min(4, groupDetails.recentExpenses.length - 1) && styles.memberItemBorder
                  ]}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseDetail}>
                        Paid by {expense.paidByName}
                      </Text>
                      <Text style={styles.expenseDate}>
                        {new Date(expense.createdAt).toLocaleDateString()} • {expense.participants} {expense.participants > 1 ? 'people' : 'person'}
                      </Text>
                    </View>
                    <View style={styles.expenseActions}>
                      <Text style={styles.expenseAmount}>
                        {expense.currencySymbol || '₺'}{Math.abs(expense.amount).toLocaleString()}
                      </Text>
                      <TouchableOpacity 
                        style={styles.deleteExpenseButton}
                        onPress={() => handleDeleteExpense(expense.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {groupDetails.recentExpenses.length > 5 && (
                  <TouchableOpacity 
                    style={styles.seeAllButton}
                    onPress={() => setShowAllExpensesModal(true)}
                  >
                    <Text style={styles.seeAllText}>See all {groupDetails.recentExpenses.length} expenses</Text>
                    <Ionicons name="chevron-forward" size={16} color="#667eea" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
        </ScrollView>
      </View>
    );
  };

  // Render all expenses modal
  const renderAllExpensesModal = () => (
    <Modal
      visible={showAllExpensesModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAllExpensesModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Expenses</Text>
            <TouchableOpacity onPress={() => setShowAllExpensesModal(false)}>
              <Ionicons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {groupDetails && groupDetails.recentExpenses.map((expense, index) => (
              <View key={expense.id} style={[
                styles.expenseItem,
                index !== groupDetails.recentExpenses.length - 1 && styles.memberItemBorder
              ]}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseDetail}>
                    Paid by {expense.paidByName}
                  </Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.createdAt).toLocaleDateString()} • {expense.participants} {expense.participants > 1 ? 'people' : 'person'}
                  </Text>
                </View>
                <View style={styles.expenseActions}>
                  <Text style={styles.expenseAmount}>
                    {expense.currencySymbol || '₺'}{Math.abs(expense.amount).toLocaleString()}
                  </Text>
                  <TouchableOpacity 
                    style={styles.deleteExpenseButton}
                    onPress={() => {
                      handleDeleteExpense(expense.id);
                      // If this was the last expense in modal, close it
                      if (groupDetails.recentExpenses.length <= 1) {
                        setShowAllExpensesModal(false);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {selectedGroup ? renderGroupDetails() : renderGroupsList()}
      {renderAllExpensesModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: getResponsivePadding(isSmallDevice ? 50 : 60),
    paddingBottom: getResponsivePadding(30),
    paddingHorizontal: getResponsivePadding(24),
  },
  headerTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 28 : isTablet ? 40 : 32),
    fontWeight: '800',
    color: '#fff',
    marginBottom: getResponsiveMargin(8),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  content: {
    padding: getResponsivePadding(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(60),
  },
  loadingText: {
    marginTop: getResponsiveMargin(16),
    fontSize: scaleFontSize(16),
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  groupsList: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  groupCardInfo: {
    flex: 1,
  },
  groupCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  groupCardMembers: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  groupCardFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCardLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  groupCardBalance: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailsHeaderGradient: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonWhite: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  detailsHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  detailsHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    gap: 12,
  },
  inviteCodeInfo: {
    flex: 1,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  inviteCodeValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  memberBalance: {
    alignItems: 'flex-end',
  },
  memberBalanceText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  memberBalanceLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  balanceItem: {
    paddingVertical: 16,
  },
  balanceFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  balanceFromName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  balanceToName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  balanceAmountBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 8,
    alignSelf: 'flex-start',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#667eea',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  expenseDetail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  expenseActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    color: '#667eea',
  },
  deleteExpenseButton: {
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalContent: {
    padding: 20,
  },
});
