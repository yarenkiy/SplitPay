import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(true);

  useEffect(() => {
    if (!email) {
      setIsValidEmail(false);
      Alert.alert('Error', 'Email address is required', [
        { text: 'OK', onPress: () => router.replace('/forgot-password') }
      ]);
    }
  }, [email]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.resetPassword(email, newPassword);
      Alert.alert(
        'Success', 
        response.data.message || 'Your password has been reset successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while resetting password.';
      Alert.alert('Error', errorMessage);
      
      if (error.response?.status === 400) {
        // No verified code found
        setTimeout(() => {
          router.replace('/forgot-password');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidEmail) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Email address is required</Text>
          <TouchableOpacity onPress={() => router.replace('/forgot-password')} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Back to Forgot Password</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your new password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backContainer}>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
  },
  errorText: {
    fontSize: scaleFontSize(18),
    color: '#fff',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(20),
  },
  errorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(24),
    borderRadius: getResponsiveBorderRadius(8),
  },
  errorButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
});
