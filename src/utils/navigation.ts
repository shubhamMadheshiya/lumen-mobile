import { router, Href } from 'expo-router';

/**
 * Safely navigates back if there is a route in the stack history.
 * Otherwise, falls back to replacing the current route with the fallback route
 * (defaults to '/(tabs)/today') to prevent the warning:
 * "The action 'GO_BACK' was not handled by any navigator."
 */
export function safeGoBack(fallback: Href = '/(tabs)/today') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
