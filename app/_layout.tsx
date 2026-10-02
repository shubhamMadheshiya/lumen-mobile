import '../src/utils/uuid';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { useNotificationSync } from '../src/hooks/useNotificationSync';
import { flushQueue } from '../src/services/mediaUpload';
import { useConfigStore } from '../src/store/configStore';
import { useAuthStore } from '../src/store/authStore';
import { installGlobalAlert, CustomAlertModal } from '../src/components/alert';

// Install custom alert interceptor globally for all Alert.alert() calls
try {
  installGlobalAlert();
} catch (e) {
  console.warn('[RootLayout] installGlobalAlert error:', e);
}

// Handle OAuth redirect completion on web as early as possible
if (Platform.OS === 'web') {
  try {
    WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });
  } catch (e) {
    console.warn('[RootLayout] maybeCompleteAuthSession error:', e);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 1 },
  },
});

function AppBootstrap() {
  useNotificationSync();
  const { palette, colorScheme } = useTheme();
  const { fetchConfig } = useConfigStore();
  const initAuth = useAuthStore(s => s.initAuth);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig();
      flushQueue();
    }
  }, [isAuthenticated, fetchConfig]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      />
      <CustomAlertModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppBootstrap />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
