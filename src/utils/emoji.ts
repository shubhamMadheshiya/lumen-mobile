/**
 * Emoji utility for validating and extracting emojis from user keyboard input.
 * Supports Unicode 15+, ZWJ sequences, skin-tone modifiers, flags, and keycaps.
 */

// Core emoji pattern:
// 1. Regional indicator pairs (flags, e.g. 🇺🇸)
// 2. Keycap sequences (e.g. 1️⃣)
// 3. Extended pictographic or standard emoji presentation, with optional variation selector and skin tone
// 4. Repeated with ZWJ (\u200D) chains for compound emojis (e.g. 👨‍👩‍👧‍👦, 👩‍⚕️, 🏃‍♂️)
const EMOJI_TOKEN_PATTERN =
  '(?:[\\u{1F1E6}-\\u{1F1FF}]{2}|[0-9#*][\\u{FE0E}\\u{FE0F}]?\\u{20E3}|(?:\\p{Extended_Pictographic}|\\p{Emoji_Presentation})(?:[\\u{FE0E}\\u{FE0F}]|[\\u{1F3FB}-\\u{1F3FF}])?)(?:\\u{200D}(?:[\\u{1F1E6}-\\u{1F1FF}]{2}|[0-9#*][\\u{FE0E}\\u{FE0F}]?\\u{20E3}|(?:\\p{Extended_Pictographic}|\\p{Emoji_Presentation})(?:[\\u{FE0E}\\u{FE0F}]|[\\u{1F3FB}-\\u{1F3FF}])?))*';

const SINGLE_EMOJI_REGEX = new RegExp(`^${EMOJI_TOKEN_PATTERN}$`, 'u');
const ALL_EMOJIS_REGEX = new RegExp(EMOJI_TOKEN_PATTERN, 'gu');

/**
 * Returns true if the string is exactly one emoji (compound emojis, flags, modifiers included).
 */
export function isSingleEmoji(text: string): boolean {
  if (!text) return false;
  return SINGLE_EMOJI_REGEX.test(text.trim());
}

/**
 * Extracts all valid emojis from any string.
 */
export function extractEmojis(text: string): string[] {
  if (!text) return [];
  const matches = text.match(ALL_EMOJIS_REGEX);
  return matches ? Array.from(matches) : [];
}

/**
 * Extracts the latest (most recently typed) emoji from the text.
 */
export function extractLatestEmoji(text: string): string | null {
  const list = extractEmojis(text);
  return list.length > 0 ? list[list.length - 1] : null;
}

/**
 * Validates keyboard input and strips out any non-emoji characters.
 * Returns the detected emoji (if any) and whether non-emoji characters were rejected.
 */
export function validateEmojiInput(input: string): {
  emoji: string | null;
  hasNonEmoji: boolean;
  rawEmojis: string[];
} {
  const emojis = extractEmojis(input);
  // Check if there are non-whitespace non-emoji characters
  const strippedOfEmojis = input.replace(ALL_EMOJIS_REGEX, '').trim();
  const hasNonEmoji = strippedOfEmojis.length > 0;

  return {
    emoji: emojis.length > 0 ? emojis[emojis.length - 1] : null,
    hasNonEmoji,
    rawEmojis: emojis,
  };
}
