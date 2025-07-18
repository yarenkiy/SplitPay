import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const userProfile = {
    name: 'Kullanıcı',
    email: 'kullanici@example.com',
    avatar: '👤',
  };

  const settingsSections = [
    {
      title: 'Hesap',
      items: [
        {
          id: 'profile',
          title: 'Profil Bilgileri',
          subtitle: 'Ad, e-posta ve şifre',
          icon: 'person',
          color: '#6366F1',
          action: 'navigate',
        },
        {
          id: 'currency',
          title: 'Para Birimi',
          subtitle: 'TL (Türk Lirası)',
          icon: 'cash',
          color: '#4ECDC4',
          action: 'navigate',
        },
        {
          id: 'language',
          title: 'Dil',
          subtitle: 'Türkçe',
          icon: 'language',
          color: '#FF6B6B',
          action: 'navigate',
        },
      ],
    },
    {
      title: 'Bildirimler',
      items: [
        {
          id: 'notifications',
          title: 'Bildirimler',
          subtitle: 'Yeni harcama ve borç bildirimleri',
          icon: 'notifications',
          color: '#FFA726',
          action: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          id: 'reminders',
          title: 'Hatırlatmalar',
          subtitle: 'Ödeme hatırlatmaları',
          icon: 'alarm',
          color: '#9C27B0',
          action: 'navigate',
        },
      ],
    },
    {
      title: 'Güvenlik',
      items: [
        {
          id: 'biometric',
          title: 'Parmak İzi / Yüz Tanıma',
          subtitle: 'Biometric giriş',
          icon: 'finger-print',
          color: '#607D8B',
          action: 'switch',
          value: biometric,
          onValueChange: setBiometric,
        },
        {
          id: 'password',
          title: 'Şifre Değiştir',
          subtitle: 'Hesap güvenliği',
          icon: 'lock-closed',
          color: '#E91E63',
          action: 'navigate',
        },
      ],
    },
    {
      title: 'Uygulama',
      items: [
        {
          id: 'autoSync',
          title: 'Otomatik Senkronizasyon',
          subtitle: 'Verileri otomatik güncelle',
          icon: 'sync',
          color: '#4CAF50',
          action: 'switch',
          value: autoSync,
          onValueChange: setAutoSync,
        },
        {
          id: 'darkMode',
          title: 'Karanlık Mod',
          subtitle: 'Karanlık tema kullan',
          icon: 'moon',
          color: '#673AB7',
          action: 'switch',
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          id: 'export',
          title: 'Veri Dışa Aktar',
          subtitle: 'Tüm verileri yedekle',
          icon: 'download',
          color: '#FF9800',
          action: 'navigate',
        },
        {
          id: 'clear',
          title: 'Önbelleği Temizle',
          subtitle: 'Uygulama verilerini temizle',
          icon: 'trash',
          color: '#F44336',
          action: 'alert',
        },
      ],
    },
    {
      title: 'Destek',
      items: [
        {
          id: 'help',
          title: 'Yardım & SSS',
          subtitle: 'Sık sorulan sorular',
          icon: 'help-circle',
          color: '#2196F3',
          action: 'navigate',
        },
        {
          id: 'feedback',
          title: 'Geri Bildirim',
          subtitle: 'Uygulama hakkında görüş',
          icon: 'chatbubble',
          color: '#00BCD4',
          action: 'navigate',
        },
        {
          id: 'about',
          title: 'Hakkında',
          subtitle: 'Versiyon 1.0.0',
          icon: 'information-circle',
          color: '#795548',
          action: 'navigate',
        },
      ],
    },
  ];

  const handleSettingPress = (item) => {
    switch (item.action) {
      case 'navigate':
        // Navigate to specific screen
        console.log(`Navigate to ${item.id}`);
        break;
      case 'alert':
        if (item.id === 'clear') {
          Alert.alert(
            'Önbelleği Temizle',
            'Tüm uygulama verileri silinecek. Bu işlem geri alınamaz.',
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Temizle', style: 'destructive', onPress: () => {
                Alert.alert('Başarılı', 'Önbellek temizlendi');
              }},
            ]
          );
        }
        break;
      default:
        break;
    }
  };

  const renderSettingItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={() => handleSettingPress(item)}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={20} color="white" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        {item.action === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{userProfile.avatar}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Çıkış Yap',
              'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Çıkış Yap', style: 'destructive', onPress: () => {
                  // Handle logout
                  console.log('Logout pressed');
                }},
              ]
            );
          }}
        >
          <Ionicons name="log-out" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
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
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatar: {
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    padding: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingRight: {
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 50,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
}); 