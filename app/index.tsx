/**
 * Root index — redirect to auth or today based on stored tokens.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getAccessToken } from '../src/api/client';

export default function Index() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const href = window.location.href;
      const isOAuthRedirect =
        href.includes('id_token=') ||
        href.includes('access_token=') ||
        href.includes('code=') ||
        href.includes('state=');

      if (isOAuthRedirect || window.opener) {
        try {
          WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });
          window.localStorage.setItem('lumen_oauth_redirect_url', href);
          if (window.opener) {
            setTimeout(() => {
              try { window.close(); } catch {}
            }, 300);
          }
        } catch (err) {
          console.warn('[Index] OAuth redirect handling error:', err);
        }
        return;
      }
    }

    getAccessToken().then(token => {
      if (token) {
        router.replace('/(tabs)/today');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090E' }}>
      <ActivityIndicator size="large" color="#22C55E" />
    </View>
  );
}
