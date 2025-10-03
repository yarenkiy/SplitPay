import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddGroupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState({});
  const [searching, setSearching] = useState(false);

  const presetColors = ['#6366F1', '#F472B6', '#4ECDC4', '#FF6B6B', '#FFA726', '#45B7D1'];

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Grup adı zorunludur';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { groupAPI } = await import('../services/api');
      const memberIds = Object.keys(selectedUserIds).filter(id => selectedUserIds[id]).map(id => Number(id));
      const res = await groupAPI.createGroup({ name: name.trim(), description: description.trim() || null, color, members: memberIds });
      if (res?.data?.id) {
        Alert.alert('Başarılı', 'Grup oluşturuldu', [
          {
            text: 'Tamam',
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert('Hata', 'Grup oluşturulamadı');
      }
    } catch (e) {
      Alert.alert('Hata', 'Grup oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      const q = query.trim();
      if (!q) {
        if (active) setResults([]);
        return;
      }
      try {
        setSearching(true);
        const { groupAPI } = await import('../services/api');
        const res = await groupAPI.searchUsers(q);
        if (!active) return;
        setResults(res.data || []);
      } catch (_) {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  const toggleSelect = (userId) => {
    setSelectedUserIds(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366F1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Grup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Grup Adı</Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (t) setErrors((prev) => ({ ...prev, name: null }));
            }}
            style={[styles.input, errors.name && styles.errorInput]}
            placeholder="Örn: Ev arkadaşları"
            placeholderTextColor="#9CA3AF"
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Üye ara (isim ya da email)</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            placeholder="kullanıcı adı veya email"
            placeholderTextColor="#9CA3AF"
          />
          {!!results.length && (
            <View style={{ marginTop: 12 }}>
              {results.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userRow, selectedUserIds[u.id] && styles.userRowSelected]}
                  onPress={() => toggleSelect(u.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, selectedUserIds[u.id] && styles.avatarSelected]}>
                    <Text style={[styles.avatarInitial, selectedUserIds[u.id] && styles.avatarInitialSelected]}>
                      {(u.name || u.email).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name || 'İsimsiz'}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  {selectedUserIds[u.id] && <Ionicons name="checkmark-circle" size={20} color="#6366F1" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Açıklama (opsiyonel)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={styles.textarea}
            placeholder="Kısa açıklama..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Renk</Text>
          <View style={styles.colorRow}>
            {presetColors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                onPress={() => setColor(c)}
                activeOpacity={0.7}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="people" size={20} color="white" />
          <Text style={styles.createButtonText}>{isSubmitting ? 'Oluşturuluyor...' : 'Grup Oluştur'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginTop: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  textarea: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginLeft: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  colorDotSelected: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 40,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  userRowSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarSelected: {
    backgroundColor: '#6366F1',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  avatarInitialSelected: {
    color: 'white',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
});


