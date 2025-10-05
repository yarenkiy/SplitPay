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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
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
    marginBottom: 2,
  },
  groupTotal: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  groupBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
}); 