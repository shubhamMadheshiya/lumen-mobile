// app.config.js — replaces app.json, reads .env vars explicitly at build time
const IS_DEV = process.env.NODE_ENV !== 'production';

module.exports = {
  expo: {
    name: 'Lumen',
    slug: 'lumen',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFF8F0',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.aifalabs.lumen',
      infoPlist: {
        NSCameraUsageDescription: 'Lumen uses the camera to capture photos of symptoms or body output for tracking purposes.',
        NSPhotoLibraryUsageDescription: 'Lumen accesses your photo library to attach images to log entries.',
        NSFaceIDUsageDescription: 'Lumen uses Face ID to protect your health data.',
        NSLocationWhenInUseUsageDescription: 'Lumen uses your location to provide hyper-local weather reports and assess autoimmune flare triggers like barometric pressure and UV levels.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFF8F0',
      },
      package: 'com.aifalabs.lumen',
      permissions: [
        'CAMERA',
        'READ_MEDIA_IMAGES',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'POST_NOTIFICATIONS',
        'SCHEDULE_EXACT_ALARM',
        'USE_EXACT_ALARM',
        'USE_FULL_SCREEN_INTENT',
        'WAKE_LOCK',
        'SYSTEM_ALERT_WINDOW',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FF6B35',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'Lumen uses Face ID to protect your health data.',
        },
      ],
    ],
    scheme: 'lumen',
    extra: {
      apiUrl:            process.env.EXPO_PUBLIC_API_URL            ?? 'http://localhost:3000/api/v1',
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
      eas: { projectId: '08e8f5ec-be22-413f-9bdb-348811301173' },
    },
  },
};
