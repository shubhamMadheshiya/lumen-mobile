import { Alert, AlertButton, AlertOptions } from 'react-native';
import { create } from 'zustand';

export interface AlertButtonConfig {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export type AlertIconType = 'logout' | 'delete' | 'warning' | 'error' | 'success' | 'info' | 'help';

export interface CustomAlertData {
  id: number;
  title: string;
  message?: string;
  buttons?: AlertButtonConfig[];
  options?: AlertOptions;
  icon?: AlertIconType;
}

interface AlertStoreState {
  currentAlert: CustomAlertData | null;
  showAlert: (data: Omit<CustomAlertData, 'id'>) => void;
  hideAlert: () => void;
}

let alertIdCounter = 0;

export const useAlertStore = create<AlertStoreState>((set) => ({
  currentAlert: null,
  showAlert: (data) =>
    set({
      currentAlert: {
        ...data,
        id: ++alertIdCounter,
      },
    }),
  hideAlert: () => set({ currentAlert: null }),
}));

/**
 * Intelligent icon inference based on the alert title, body, and button actions.
 */
export function inferAlertIcon(
  title: string,
  message?: string,
  buttons?: AlertButtonConfig[]
): AlertIconType {
  const text = `${title || ''} ${message || ''}`.toLowerCase();
  const hasDestructive = buttons?.some((b) => b.style === 'destructive');

  if (text.includes('log out') || text.includes('logout') || text.includes('sign out')) {
    return 'logout';
  }
  if (text.includes('delete') || text.includes('trash') || text.includes('remove') || text.includes('wipe')) {
    return 'delete';
  }
  if (
    text.includes('error') ||
    text.includes('failed') ||
    text.includes('cannot') ||
    text.includes('invalid') ||
    text.includes('blocked') ||
    text.includes('wrong')
  ) {
    return 'error';
  }
  if (
    text.includes('success') ||
    text.includes('saved') ||
    text.includes('restored') ||
    text.includes('exported') ||
    text.includes('done') ||
    text.includes('completed')
  ) {
    return 'success';
  }
  if (
    hasDestructive ||
    text.includes('archive') ||
    text.includes('discard') ||
    text.includes('caution') ||
    text.includes('warning')
  ) {
    return 'warning';
  }
  if (
    text.includes('?') ||
    text.includes('confirm') ||
    text.includes('would you like') ||
    text.includes('are you sure')
  ) {
    return 'help';
  }
  return 'info';
}

export const originalNativeAlert = Alert.alert;

/**
 * Intercepts React Native's global Alert.alert so that every existing Alert.alert(...)
 * across the entire application instantly adopts Lumen's modern themed modal UI.
 */
export function installGlobalAlert() {
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    const icon = inferAlertIcon(title, message, buttons);
    useAlertStore.getState().showAlert({
      title,
      message,
      buttons: buttons as AlertButtonConfig[] | undefined,
      options,
      icon,
    });
  };
}

/**
 * Direct programmatic helper to trigger custom alerts with custom icons.
 */
export function showCustomAlert(data: Omit<CustomAlertData, 'id'>) {
  useAlertStore.getState().showAlert(data);
}
