import React, { useContext, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Hata', 'Tüm alanlar gerekli');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({ name, email, password });
      if (result.success) {
        Alert.alert('Başarılı', 'Kayıt tamamlandı ve giriş yapıldı!');
      } else {
        Alert.alert('Hata', result.error);
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      <Text>Ad Soyad</Text>
      <TextInput 
        style={styles.input} 
        onChangeText={setName} 
        value={name}
        placeholder="Adınızı ve soyadınızı girin"
      />
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Email adresinizi girin"
      />
      <Text>Şifre</Text>
      <TextInput 
        style={styles.input} 
        onChangeText={setPassword} 
        value={password} 
        secureTextEntry
        placeholder="Şifrenizi girin"
      />
      <Button 
        title={isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"} 
        onPress={handleRegister}
        disabled={isLoading}
      />
      <Text onPress={() => navigation.navigate('Login')} style={styles.link}>
        Zaten hesabınız var mı? Giriş yapın
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 16, 
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd',
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 8,
    backgroundColor: 'white'
  },
  link: { 
    marginTop: 16, 
    color: 'blue',
    textAlign: 'center'
  },
});
