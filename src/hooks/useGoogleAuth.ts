import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../api/client';

if (Platform.OS === 'web') {
  try {
    WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });
  } catch {}
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  extra.googleWebClientId ||
  '';
const ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  extra.googleAndroidClientId ||
  '';
const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  extra.googleIosClientId ||
  '';

const PLACEHOLDER = 'unconfigured';

export function useGoogleAuth() {
  const { loginWithGoogle, isLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const handledRef = useRef(false);

  const effectiveAndroidId = ANDROID_CLIENT_ID || WEB_CLIENT_ID;
  const effectiveIosId     = IOS_CLIENT_ID     || WEB_CLIENT_ID;

  // useIdTokenAuthRequest requests responseType: 'id_token' on web and PKCE code exchange on native
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:        WEB_CLIENT_ID        || PLACEHOLDER,
    webClientId:     WEB_CLIENT_ID        || PLACEHOLDER,
    androidClientId: effectiveAndroidId   || PLACEHOLDER,
    iosClientId:     effectiveIosId       || PLACEHOLDER,
    scopes: ['openid', 'profile', 'email'],
  });

  const platformClientId =
    Platform.OS === 'android' ? effectiveAndroidId :
    Platform.OS === 'ios'     ? effectiveIosId     :
                                WEB_CLIENT_ID;

  const googleReady = !!request && !!platformClientId && platformClientId !== PLACEHOLDER;

  const processIdToken = async (idToken: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    setGoogleLoading(true);
    try {
      console.log('[GoogleAuth] Exchanging ID token with server...');
      await loginWithGoogle(idToken);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem('lumen_oauth_redirect_url');
      }
      router.replace('/(tabs)/today');
    } catch (err: any) {
      handledRef.current = false;
      const msg = err instanceof ApiError ? err.message : (err?.message ?? 'Google Sign-In failed');
      Alert.alert('Google Sign-In failed', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Web fallback: listen for redirect URL saved to localStorage by popup
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const checkStorage = () => {
      const redirectUrl = window.localStorage.getItem('lumen_oauth_redirect_url');
      if (redirectUrl) {
        window.localStorage.removeItem('lumen_oauth_redirect_url');
        const hash = redirectUrl.split('#')[1] ?? redirectUrl.split('?')[1] ?? '';
        const params = new URLSearchParams(hash);
        const token = params.get('id_token');
        if (token) {
          console.log('[GoogleAuth] ID token retrieved via cross-window bridge');
          processIdToken(token);
        }
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'lumen_oauth_redirect_url' && e.newValue) {
        checkStorage();
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    let interval: any = null;
    if (googleLoading) {
      interval = setInterval(checkStorage, 300);
    }

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      if (interval) clearInterval(interval);
    };
  }, [googleLoading]);

  // Handle response from expo-auth-session hook
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.authentication?.idToken ??
        (response.params as Record<string, string>)?.id_token;

      if (idToken) {
        processIdToken(idToken);
      } else {
        Alert.alert('Google Sign-In failed', 'No ID token received from Google.');
      }
    } else if (response?.type === 'error') {
      const errDetail = (response.error as any)?.message ?? (response.error as any)?.description ?? 'Authorization error.';
      Alert.alert('Google Sign-In failed', errDetail);
    }
  }, [response]);

  const signInWithGoogle = async () => {
    handledRef.current = false;
    setGoogleLoading(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem('lumen_oauth_redirect_url');
    }

    try {
      const result = await promptAsync();
      console.log('[GoogleAuth] promptAsync completed with status:', result?.type);
      if (result?.type === 'success') {
        const idToken =
          result.authentication?.idToken ??
          (result.params as Record<string, string>)?.id_token;

        if (idToken) {
          await processIdToken(idToken);
          return;
        }
      } else if (result?.type === 'error') {
        const errDetail = (result.error as any)?.message ?? (result.error as any)?.description ?? 'Authorization error.';
        Alert.alert('Google Sign-In failed', errDetail);
        setGoogleLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('[GoogleAuth] Error during promptAsync:', err);
      Alert.alert('Google Sign-In error', err?.message ?? 'Could not initiate Google Sign-In.');
    } finally {
      if (Platform.OS !== 'web') {
        setGoogleLoading(false);
      } else {
        // Allow time for popup redirect / bridge before turning off spinner
        setTimeout(() => {
          if (!handledRef.current) {
            setGoogleLoading(false);
          }
        }, 3000);
      }
    }
  };

  return {
    signInWithGoogle,
    googleReady,
    isLoading: isLoading || googleLoading,
    googleLoading,
  };
}
