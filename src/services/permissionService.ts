/**
 * Centralized Permission Service for Lumen.
 * Handles:
 * 1. Initial first-time installation permissions walkthrough (Notifications, Location, Camera).
 * 2. Just-In-Time (JIT) contextual checks when specific features are activated (Walking, Reminders, Photo logging).
 * 3. Deep-linking to device Settings if permissions are permanently denied (canAskAgain: false).
 */
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Safe require for expo-notifications
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {}

const PERMISSIONS_ONBOARDED_KEY = '@lumen:permissions_onboarded_v2';

export type PermissionType = 'notifications' | 'location' | 'camera' | 'mediaLibrary';

export interface PermissionCheckResult {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface PermissionMetadata {
  type: PermissionType;
  title: string;
  shortName: string;
  iconName: string;
  description: string;
  benefit: string;
  settingsTip: string;
}

export const PERMISSION_METADATA: Record<PermissionType, PermissionMetadata> = {
  notifications: {
    type: 'notifications',
    title: 'Enable Notifications',
    shortName: 'Notifications',
    iconName: 'Bell',
    description: 'Lumen needs notification permissions to sound alarms and deliver your health reminders on time.',
    benefit: 'Medication alerts, hydration check-ins, bedtime cues, and symptom prompts.',
    settingsTip: 'Tap Permissions > Notifications > Allow Notifications',
  },
  location: {
    type: 'location',
    title: 'Enable Location Access',
    shortName: 'Location',
    iconName: 'MapPin',
    description: 'Lumen needs location access to track your walking route, calculate distance, and monitor your pace.',
    benefit: 'GPS distance, outdoor path tracking, active pace calculation, and route review.',
    settingsTip: 'Tap Permissions > Location > Allow only while using the app',
  },
  camera: {
    type: 'camera',
    title: 'Enable Camera Access',
    shortName: 'Camera',
    iconName: 'Camera',
    description: 'Lumen needs camera access to let you capture photos for your health logs.',
    benefit: 'Photo attachments for rashes, swelling, stool monitoring, and meal logs.',
    settingsTip: 'Tap Permissions > Camera > Allow',
  },
  mediaLibrary: {
    type: 'mediaLibrary',
    title: 'Enable Photo Library Access',
    shortName: 'Photo Library',
    iconName: 'Image',
    description: 'Lumen needs photo library access to attach existing health photos to your logs.',
    benefit: 'Select photos from your gallery for symptom logs and clinical documentation.',
    settingsTip: 'Tap Permissions > Photos > Allow access to all photos',
  },
};

class PermissionService {
  /**
   * Has the user already seen the initial first-launch permission walkthrough?
   */
  async hasSeenInitialPrimer(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(PERMISSIONS_ONBOARDED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark that the initial first-launch permission walkthrough was completed or dismissed.
   */
  async markInitialPrimerCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSIONS_ONBOARDED_KEY, 'true');
    } catch (e) {
      console.warn('[PermissionService] Failed to save primer status:', e);
    }
  }

  /**
   * Check current status for a given permission.
   */
  async checkPermission(type: PermissionType): Promise<PermissionCheckResult> {
    try {
      switch (type) {
        case 'notifications': {
          if (!Notifications) return { granted: false, canAskAgain: false, status: 'denied' };
          const res = await Notifications.getPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }

        case 'location': {
          const res = await Location.getForegroundPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }

        case 'camera': {
          const res = await ImagePicker.getCameraPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }

        case 'mediaLibrary': {
          const res = await ImagePicker.getMediaLibraryPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }
      }
    } catch (e) {
      console.warn(`[PermissionService] checkPermission error for ${type}:`, e);
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }
  }

  /**
   * Request a specific permission from the OS.
   */
  async requestPermission(type: PermissionType): Promise<PermissionCheckResult> {
    try {
      switch (type) {
        case 'notifications': {
          if (!Notifications) return { granted: false, canAskAgain: false, status: 'denied' };
          const res = await Notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
          });
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }

        case 'location': {
          const res = await Location.requestForegroundPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }

        case 'camera': {
          const res = await ImagePicker.requestCameraPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }

        case 'mediaLibrary': {
          const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
          return {
            granted: res.status === 'granted' || res.granted === true,
            canAskAgain: res.canAskAgain ?? true,
            status: res.status as any,
          };
        }
      }
    } catch (e) {
      console.warn(`[PermissionService] requestPermission error for ${type}:`, e);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  /**
   * Opens the app settings page in the phone's native Settings app.
   */
  async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (e) {
      console.warn('[PermissionService] Failed to open app settings:', e);
    }
  }

  /**
   * Requests initial core permissions sequentially during first-time launch.
   */
  async requestAllInitialPermissions(): Promise<Record<PermissionType, boolean>> {
    const results: Record<PermissionType, boolean> = {
      notifications: false,
      location: false,
      camera: false,
      mediaLibrary: false,
    };

    // 1. Notifications
    const notifRes = await this.requestPermission('notifications');
    results.notifications = notifRes.granted;

    // 2. Location
    const locRes = await this.requestPermission('location');
    results.location = locRes.granted;

    // 3. Camera
    const camRes = await this.requestPermission('camera');
    results.camera = camRes.granted;

    await this.markInitialPrimerCompleted();
    return results;
  }
}

export const permissionService = new PermissionService();
