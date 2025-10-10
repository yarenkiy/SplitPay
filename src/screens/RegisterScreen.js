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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await register({ name, email, password });
      
      if (result.success) {
        // Registration successful - AuthContext will automatically redirect to dashboard
        Alert.alert('Success', 'Registration completed! Welcome to LetSPLIT!');
      } else {
        // Registration failed, show error message
        Alert.alert('Registration Failed', result.error || 'An error occurred during registration');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
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
            <Text style={styles.tagline}>Join the community</Text>
          </View>
          
          <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join LetSPLIT to start splitting expenses</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              onChangeText={setName} 
              value={name}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email address"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput 
              style={styles.input} 
              onChangeText={setPassword} 
              value={password} 
              secureTextEntry
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Sign In</Text>
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
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    color: '#6B7280',
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    textAlign: 'center',
  },
  loginLink: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});
