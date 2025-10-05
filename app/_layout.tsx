import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthContext, AuthProvider } from '../src/context/AuthContext';
import { SelectedGroupProvider } from '../src/context/SelectedGroupContext';

function RootLayoutNav() {
  const { userToken, isLoading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const onIndexPage = segments[0] === 'index' || segments.length === 0;
    const onAuthPage = segments[0] === 'login' || segments[0] === 'register';
    const onProtectedPage = segments[0] === 'expense' || segments[0] === 'group' || segments[0] === 'notes';

    // Skip navigation on splash screen (index page handles its own navigation)
    if (onIndexPage) return;

    if (!userToken && (inAuthGroup || onProtectedPage)) {
      // User is not authenticated but trying to access protected route
      router.replace('/login');
    } else if (userToken && onAuthPage) {
      // User is authenticated but on auth screen, redirect to dashboard
      router.replace('/(tabs)');
    }
  }, [userToken, isLoading, segments]);
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="expense" options={{ headerShown: false }} />
      <Stack.Screen name="group" options={{ headerShown: false }} />
      <Stack.Screen name="notes" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <SelectedGroupProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SelectedGroupProvider>
    </AuthProvider>
  );
}
