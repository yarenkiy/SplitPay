import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SummaryScreen() {
  const summaryData = {
    totalDebt: 1250,
    totalCredit: 890,
    balance: -360,
    totalExpenses: 5400,
    totalGroups: 4,
    totalMembers: 12,
  };

  const monthlyData = [
    { month: 'Ocak', expenses: 1200, color: '#FF6B6B' },
    { month: 'Şubat', expenses: 800, color: '#4ECDC4' },
    { month: 'Mart', expenses: 1400, color: '#45B7D1' },
    { month: 'Nisan', expenses: 1000, color: '#FFA726' },
    { month: 'Mayıs', expenses: 1600, color: '#9C27B0' },
    { month: 'Haziran', expenses: 900, color: '#607D8B' },
  ];

  const categoryData = [
    { name: 'Yemek', amount: 2400, percentage: 44, color: '#FF6B6B' },
    { name: 'Ulaşım', amount: 1200, percentage: 22, color: '#4ECDC4' },
    { name: 'Eğlence', amount: 900, percentage: 17, color: '#45B7D1' },
    { name: 'Alışveriş', amount: 600, percentage: 11, color: '#FFA726' },
    { name: 'Diğer', amount: 300, percentage: 6, color: '#9C27B0' },
  ];

  const topDebtors = [
    { name: 'Yaren', amount: 450, group: 'Antalya Tatili' },
    { name: 'Ahmet', amount: 320, group: 'Ev Arkadaşları' },
    { name: 'Selen', amount: 280, group: 'Market Gideri' },
    { name: 'Mehmet', amount: 200, group: 'Sinema Gecesi' },
  ];

  const renderStatCard = (title, value, subtitle, icon, color) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderMonthlyBar = (data, index) => (
    <View key={index} style={styles.monthlyBarContainer}>
      <View style={styles.monthlyBarWrapper}>
        <View
          style={[
            styles.monthlyBar,
            {
              height: (data.expenses / 1600) * 100,
              backgroundColor: data.color,
            },
          ]}
        />
      </View>
      <Text style={styles.monthlyLabel}>{data.month}</Text>
      <Text style={styles.monthlyAmount}>₺{data.expenses}</Text>
    </View>
  );

  const renderCategoryItem = (category) => (
    <View key={category.name} style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
        <View style={styles.categoryDetails}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryAmount}>₺{category.amount}</Text>
        </View>
      </View>
      <View style={styles.categoryPercentage}>
        <View style={styles.percentageBar}>
          <View
            style={[
              styles.percentageFill,
              {
                width: `${category.percentage}%`,
                backgroundColor: category.color,
              },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{category.percentage}%</Text>
      </View>
    </View>
  );

  const renderDebtorItem = (debtor, index) => (
    <View key={debtor.name} style={styles.debtorItem}>
      <View style={styles.debtorRank}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <View style={styles.debtorInfo}>
        <Text style={styles.debtorName}>{debtor.name}</Text>
        <Text style={styles.debtorGroup}>{debtor.group}</Text>
      </View>
      <View style={styles.debtorAmount}>
        <Text style={styles.debtorAmountText}>₺{debtor.amount}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finansal Özet</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Stats */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Toplam Borç',
            `₺${summaryData.totalDebt}`,
            'Senin başkalarına borcun',
            'arrow-down',
            '#FF6B6B'
          )}
          {renderStatCard(
            'Toplam Alacak',
            `₺${summaryData.totalCredit}`,
            'Başkalarının sana borcu',
            'arrow-up',
            '#4ECDC4'
          )}
          {renderStatCard(
            'Bakiye',
            `₺${summaryData.balance}`,
            'Alacak - Borç',
            'wallet',
            summaryData.balance >= 0 ? '#4ECDC4' : '#FF6B6B'
          )}
          {renderStatCard(
            'Toplam Harcama',
            `₺${summaryData.totalExpenses}`,
            'Tüm gruplarda',
            'stats-chart',
            '#6366F1'
          )}
        </View>

        {/* Monthly Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aylık Harcamalar</Text>
          <View style={styles.monthlyChart}>
            {monthlyData.map(renderMonthlyBar)}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>
          <View style={styles.categoryList}>
            {categoryData.map(renderCategoryItem)}
          </View>
        </View>

        {/* Top Debtors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En Çok Borçlu Olanlar</Text>
          <View style={styles.debtorsList}>
            {topDebtors.map(renderDebtorItem)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="download" size={20} color="#6366F1" />
            <Text style={styles.quickActionText}>PDF İndir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="mail" size={20} color="#4ECDC4" />
            <Text style={styles.quickActionText}>E-posta Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="print" size={20} color="#FF6B6B" />
            <Text style={styles.quickActionText}>Yazdır</Text>
          </TouchableOpacity>
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
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthlyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthlyBarWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  monthlyBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  monthlyLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  monthlyAmount: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  categoryList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryItem: {
    marginBottom: 15,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginRight: 10,
  },
  percentageFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 30,
  },
  debtorsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  debtorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  debtorRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  debtorInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  debtorGroup: {
    fontSize: 12,
    color: '#6B7280',
  },
  debtorAmount: {
    alignItems: 'flex-end',
  },
  debtorAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 50,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 4,
  },
}); 