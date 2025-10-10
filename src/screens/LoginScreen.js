import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import {
    getResponsiveBorderRadius,
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Login attempt with:', { email, password });
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, userToken should be set');
        // Login successful - AuthContext will automatically redirect to dashboard
        // No need to manually navigate as the AppNavigator will detect the userToken change
      } else {
        console.log('Login failed:', result.error);
        // Login failed, show error message
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <KeyboardAvoidingView
        style={styles.centerWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>LetSPLIT</Text>
            <Text style={styles.tagline}>Split expenses with friends</Text>
          </View>
          
          <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveMargin(isSmallDevice ? 30 : 40),
  },
  logoText: {
    fontSize: scaleFontSize(isSmallDevice ? 32 : isTablet ? 44 : 36),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: getResponsiveMargin(8),
    letterSpacing: 1,
  },
  tagline: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveBorderRadius(24),
    paddingVertical: getResponsivePadding(isSmallDevice ? 30 : 40),
    paddingHorizontal: getResponsivePadding(isSmallDevice ? 24 : 32),
    alignItems: 'center',
    width: '100%',
    maxWidth: isTablet ? 500 : 400,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice ? 24 : 28),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: '#6B7280',
    marginBottom: getResponsiveMargin(isSmallDevice ? 24 : 32),
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: getResponsiveMargin(isSmallDevice ? 16 : 20),
  },
  inputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: getResponsiveMargin(8),
  },
  input: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: getResponsiveBorderRadius(12),
    paddingVertical: getResponsivePadding(isSmallDevice ? 14 : 16),
    paddingHorizontal: getResponsivePadding(20),
    fontSize: scaleFontSize(16),
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    width: '100%',
    marginTop: getResponsiveMargin(8),
    marginBottom: getResponsiveMargin(isSmallDevice ? 20 : 24),
    borderRadius: getResponsiveBorderRadius(12),
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: getResponsivePadding(isSmallDevice ? 14 : 16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaleFontSize(18),
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    color: '#6B7280',
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    textAlign: 'center',
  },
  registerLink: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});
