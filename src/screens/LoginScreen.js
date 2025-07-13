import React, { useContext, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre gerekli');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        Alert.alert('Başarılı', 'Giriş yapıldı');
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
      <Text style={styles.title}>Giriş Yap</Text>
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
        title={isLoading ? "Giriş yapılıyor..." : "Giriş Yap"} 
        onPress={handleLogin}
        disabled={isLoading}
      />
      <Text onPress={() => navigation.navigate('Register')} style={styles.link}>
        Hesabınız yok mu? Kayıt olun
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
