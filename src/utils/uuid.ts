import * as Crypto from 'expo-crypto';

// Polyfill crypto.getRandomValues for uuid and third-party packages in React Native / Expo
if (typeof globalThis.crypto !== 'object') {
  (globalThis as any).crypto = {};
}

if (typeof globalThis.crypto.getRandomValues !== 'function') {
  (globalThis.crypto as any).getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (array) {
      Crypto.getRandomValues(array as any);
    }
    return array;
  };
}

/**
 * Generate a cryptographically secure RFC4122 v4 UUID using expo-crypto.
 */
export function uuidv4(): string {
  return Crypto.randomUUID();
}

export const v4 = uuidv4;
