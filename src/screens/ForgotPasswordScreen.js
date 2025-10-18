import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../services/api';
import {
    getResponsiveBorderRadius,
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(email);
      Alert.alert(
        'Success', 
        response.data.message || 'A verification code has been sent to your email address.',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/verify-code?email=${encodeURIComponent(email)}`)
          }
        ]
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'An error occurred while sending password reset request. Please try again.');
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a password reset link
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backContainer}>
              <Text style={styles.backText}>
                Back to Login
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
    lineHeight: 22,
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
  backContainer: {
    alignItems: 'center',
  },
  backText: {
    color: '#667eea',
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    fontWeight: '600',
  },
});
