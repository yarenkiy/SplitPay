import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    getResponsiveBorderRadius,
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';

export default function GroupsScreen() {
  const navigation = useNavigation();
  const groups = [
    {
      id: '1',
      name: 'Antalya Tatili',
      debt: 120,
      members: ['Yaren', 'Selen', 'Ahmet', 'Sen'],
      color: '#FF6B6B',
      totalExpenses: 2400,
    },
    {
      id: '2',
      name: 'Ev Arkadaşları',
      debt: -50,
      members: ['Selen', 'Mehmet', 'Sen'],
      color: '#4ECDC4',
      totalExpenses: 1800,
    },
    {
      id: '3',
      name: 'Market Gideri',
      debt: 0,
      members: ['Sen', 'Yaren'],
      color: '#45B7D1',
      totalExpenses: 500,
    },
    {
      id: '4',
      name: 'Sinema Gecesi',
      debt: 25,
      members: ['Ahmet', 'Selen', 'Sen'],
      color: '#FFA726',
      totalExpenses: 300,
    },
  ];

  const renderGroupCard = (group) => (
    <TouchableOpacity style={styles.groupCard} key={group.id}>
      <View style={styles.groupHeader}>
        <View style={[styles.groupColor, { backgroundColor: group.color }]} />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMembers}>{group.members.length} members</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </View>
      <View style={styles.groupActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          try {
            const tabNav = navigation.getParent?.();
            tabNav?.navigate?.('Ana Sayfa', { screen: 'Yeni Harcama' });
          } catch (_) {}
        }}>
          <Ionicons name="eye" size={16} color="#6366F1" />
          <Text style={styles.actionText}>Detay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            try {
              const tabNav = navigation.getParent?.();
              tabNav?.navigate?.('Ana Sayfa', {
                screen: 'Yeni Harcama',
                params: { preselectedGroup: group },
              });
            } catch (e) {}
          }}
        >
          <Ionicons name="add-circle" size={16} color="#4ECDC4" />
          <Text style={styles.actionText}>Harcama</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={16} color="#FF6B6B" />
          <Text style={styles.actionText}>Paylaş</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gruplarım</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          try {
            const tabNav = navigation.getParent?.();
            tabNav?.navigate?.('Ana Sayfa', { screen: 'Yeni Grup' });
          } catch (_) {}
        }}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{groups.length}</Text>
            <Text style={styles.statLabel}>Toplam Grup</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {groups.reduce((sum, group) => sum + group.members.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Toplam Üye</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              ₺{groups.reduce((sum, group) => sum + group.totalExpenses, 0)}
            </Text>
            <Text style={styles.statLabel}>Toplam Harcama</Text>
          </View>
        </View>

        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Aktif Gruplar</Text>
          {groups.map(renderGroupCard)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#6366F1',
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(20),
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveMargin(20),
    marginBottom: getResponsiveMargin(25),
    gap: getResponsiveMargin(isSmallDevice ? 8 : 10),
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(12),
    padding: getResponsivePadding(isSmallDevice ? 12 : 15),
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: getResponsiveMargin(5),
  },
  statLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 12),
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 20),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(15),
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsivePadding(isSmallDevice ? 16 : 20),
    marginBottom: getResponsiveMargin(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(15),
  },
  groupColor: {
    width: isSmallDevice ? 10 : 12,
    height: isSmallDevice ? 10 : 12,
    borderRadius: isSmallDevice ? 5 : 6,
    marginRight: getResponsiveMargin(12),
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: scaleFontSize(isSmallDevice ? 15 : 16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(2),
  },
  groupMembers: {
    fontSize: scaleFontSize(12),
    color: '#6B7280',
    marginBottom: getResponsiveMargin(2),
  },
  groupTotal: {
    fontSize: scaleFontSize(12),
    color: '#9CA3AF',
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  groupBalanceText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginBottom: getResponsiveMargin(2),
  },
  balanceLabel: {
    fontSize: scaleFontSize(10),
    color: '#9CA3AF',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: getResponsivePadding(15),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(8),
    paddingHorizontal: getResponsivePadding(isSmallDevice ? 8 : 12),
  },
  actionText: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 12),
    fontWeight: '500',
    color: '#374151',
    marginLeft: getResponsiveMargin(4),
  },
}); 