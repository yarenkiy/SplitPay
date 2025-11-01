import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../services/api';
import {
    getResponsiveBorderRadius,
    getResponsiveMargin,
    getResponsivePadding,
    isSmallDevice,
    isTablet,
    scaleFontSize
} from '../utils/responsive';
import { showError, showSuccess } from '../utils/errorHandler';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      showError('Error', 'Email address is required');
      setTimeout(() => router.replace('/forgot-password'), 2000);
    }
  }, [email]);

  const handleCodeChange = (text, index) => {
    // Only allow numbers and limit to 1 character
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newCode = verificationCode.split('');
      newCode[index] = numericText;
      setVerificationCode(newCode.join(''));

      // Auto-focus next input
      if (numericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      showError('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.verifyResetCode(email, verificationCode);
      showSuccess(
        'Success', 
        response.data.message || 'Verification code verified successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/reset-password?email=${encodeURIComponent(email)}`)
          }
        ]
      );
    } catch (error) {
      console.error('Verify code error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid or expired verification code.';
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(email);
      showSuccess('Success', 'A new verification code has been sent to your email.');
    } catch (error) {
      console.error('Resend code error:', error);
      showError('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
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
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit verification code sent to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            
            <View style={styles.codeContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.codeInput}
                  value={verificationCode[index] || ''}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backContainer}>
              <Text style={styles.backText}>
                Back to Forgot Password
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
  emailText: {
    fontWeight: '600',
    color: '#6366F1',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveMargin(isSmallDevice ? 24 : 32),
    width: '100%',
  },
  codeInput: {
    width: isSmallDevice ? 40 : 45,
    height: isSmallDevice ? 50 : 55,
    backgroundColor: '#F9FAFB',
    borderRadius: getResponsiveBorderRadius(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  button: {
    width: '100%',
    marginBottom: getResponsiveMargin(16),
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
  resendButton: {
    marginBottom: getResponsiveMargin(16),
  },
  resendText: {
    color: '#6366F1',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
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
