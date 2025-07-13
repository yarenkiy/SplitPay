import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#6366F1', '#F472B6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={styles.centerWrapper}>
        <View style={styles.card}>
         
          <View style={styles.logoCircle}>
            <Image source={require('../../assets/images/friends.png')} style={styles.logo} />
          </View>
          <Text style={styles.title}>Welcome to SplitPay</Text>
          <Text style={styles.subtitle}>
            Effortlessly split group expenses, track debts, and keep it fair for everyone.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#6366F1',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
 
  logoCircle: {
    backgroundColor: '#F3F4F6',
    borderRadius: 100,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#111827',
    marginBottom: 36,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.85,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 18,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 15,
    paddingHorizontal: 38,
    borderRadius: 12,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOpacity: 0.13,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 120,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#F472B6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
