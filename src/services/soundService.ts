/**
 * Sound Service for Lumen Reminders & Alarms.
 * Manages in-app sound playback and preview for custom alarm tones using expo-av.
 */
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export interface SoundOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'gentle' | 'energetic' | 'classic' | 'system';
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'default',
    label: 'Device Default',
    description: 'System standard alarm & notification tone',
    icon: '🔔',
    category: 'system',
  },
  {
    id: 'chime',
    label: 'Sparkle Chime',
    description: 'Bright harmonic chime (C5 & G5 melody)',
    icon: '✨',
    category: 'gentle',
  },
  {
    id: 'gentle_bell',
    label: 'Gentle Bell',
    description: 'Calming Tibetan singing bowl resonance (528Hz)',
    icon: '🎐',
    category: 'gentle',
  },
  {
    id: 'digital_alarm',
    label: 'Digital Beeps',
    description: 'Crisp rhythmic electronic pulse alarm',
    icon: '⏰',
    category: 'energetic',
  },
  {
    id: 'zen_gong',
    label: 'Zen Gong',
    description: 'Deep grounding resonant gong with rich undertones',
    icon: '🧘',
    category: 'gentle',
  },
  {
    id: 'radar',
    label: 'Radar Ping',
    description: 'Modern upward sonar chirp alert',
    icon: '📡',
    category: 'energetic',
  },
];

const SOUND_ASSETS: Record<string, any> = {
  chime: require('../../assets/sounds/chime.wav'),
  gentle_bell: require('../../assets/sounds/gentle_bell.wav'),
  digital_alarm: require('../../assets/sounds/digital_alarm.wav'),
  zen_gong: require('../../assets/sounds/zen_gong.wav'),
  radar: require('../../assets/sounds/radar.wav'),
};

let currentSound: Audio.Sound | null = null;
let currentPlayingId: string | null = null;

/**
 * Configure audio mode to ensure sounds play reliably even in silent/DND mode.
 */
async function configureAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  } catch (err) {
    console.warn('[SoundService] Failed to set audio mode:', err);
  }
}

/**
 * Stop and unload any currently playing preview or alarm sound.
 */
export async function stopSound(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Ignore unload errors
    } finally {
      currentSound = null;
      currentPlayingId = null;
    }
  }
}

/**
 * Returns the currently playing sound ID (if any).
 */
export function getCurrentlyPlayingSoundId(): string | null {
  return currentPlayingId;
}

/**
 * Play a preview tone once (for sound picker selection).
 */
export async function previewSound(
  soundId: string,
  onFinish?: () => void
): Promise<void> {
  await stopSound();

  if (soundId === 'default' || !SOUND_ASSETS[soundId]) {
    // For default, trigger haptic confirmation
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFinish?.();
    return;
  }

  await configureAudioMode();

  try {
    const asset = SOUND_ASSETS[soundId];
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, isLooping: false, volume: 1.0 },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          stopSound().catch(() => {});
          onFinish?.();
        }
      }
    );

    currentSound = sound;
    currentPlayingId = soundId;
  } catch (err) {
    console.warn(`[SoundService] Failed to preview sound "${soundId}":`, err);
    onFinish?.();
  }
}

/**
 * Start an alarm sound in continuous loop (used on the Alarm screen).
 */
export async function startAlarmSound(soundId: string = 'default'): Promise<void> {
  await stopSound();

  // If default, native notification channel handles the tone
  if (soundId === 'default' || !SOUND_ASSETS[soundId]) {
    return;
  }

  await configureAudioMode();

  try {
    const asset = SOUND_ASSETS[soundId];
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );

    currentSound = sound;
    currentPlayingId = soundId;
  } catch (err) {
    console.warn(`[SoundService] Failed to start alarm sound "${soundId}":`, err);
  }
}

/**
 * Helper to get metadata for a given sound ID.
 */
export function getSoundOption(soundId: string = 'default'): SoundOption {
  return SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];
}
