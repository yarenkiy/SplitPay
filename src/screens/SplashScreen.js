import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if user is already logged in and redirect accordingly
    const checkAuthAndRedirect = async () => {
      const token = await AsyncStorage.getItem('userToken');
      
      return setTimeout(() => {
        if (token) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }, 4000);
    };

    let timer;
    checkAuthAndRedirect().then((t) => {
      timer = t;
    });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  const handlePress = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* App Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💸</Text>
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>LetSPLIT</Text>

          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>Split expenses fairly</Text>
            <Text style={styles.tagline}>with friends</Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Track trips, dinners & shared costs effortlessly
          </Text>

          {/* Tap to continue hint */}
          <Animated.View
            style={[
              styles.tapHint,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.tapHintText}>Tap anywhere to continue</Text>
          </Animated.View>
        </Animated.View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 56,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    marginBottom: 24,
    letterSpacing: -2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  taglineContainer: {
    marginBottom: 16,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.95,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    marginTop: 12,
  },
  tapHint: {
    marginTop: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tapHintText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Decorative circles
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '40%',
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
