/**
 * Emoji utility for validating and extracting emojis from user keyboard input.
 * Supports Unicode 15+, ZWJ sequences, skin-tone modifiers, flags, and keycaps.
 *
 * NOTE: Uses explicit surrogate and code point ranges rather than \p{Extended_Pictographic}
 * to prevent Hermes SyntaxError crashes on Android release builds.
 */

// Base emoji definitions using explicit Unicode code points and surrogate pairs (Hermes-safe)
const EMOJI_BASE_RANGE =
  '(?:[\\uD83C][\\uDDE6-\\uDDFF]){2}|' + // Regional indicator pairs (flags, e.g. 🇺🇸, 🇮🇳)
  '[' +
  '\\u231A-\\u231B' + // Watch, hourglass
  '\\u23E9-\\u23EC' + // Fast-forward, rewind
  '\\u23F0' +         // Alarm clock
  '\\u23F3' +         // Hourglass flowing
  '\\u25FD-\\u25FE' + // Small black/white squares
  '\\u2600-\\u27BF' + // Miscellaneous symbols & Dingbats (☀️, ☕, ✨, ⚡, ⛺, etc.)
  '\\u2B1B-\\u2B1C' + // Black/white large square
  '\\u2B50' +         // Star
  '\\u2B55' +         // Heavy large circle
  ']|' +
  '[\\uD83C-\\uD83E][\\uDC00-\\uDFFF]|' + // Supplementary Multilingual Plane (all modern emoji surrogate pairs)
  '[0-9#*][\\uFE0E\\uFE0F]?\\u20E3';     // Keycaps (e.g. 1️⃣)

// Full emoji pattern allowing skin tones, variation selectors, and ZWJ compound chains
const EMOJI_TOKEN_PATTERN =
  '(?:' +
  '(?:' + EMOJI_BASE_RANGE + ')' +
  '(?:[\\uFE0E\\uFE0F]|[\\uD83C][\\uDFFB-\\uDFFF])?' +
  '(?:\\u200D(?:' +
  '(?:' + EMOJI_BASE_RANGE + ')' +
  '(?:[\\uFE0E\\uFE0F]|[\\uD83C][\\uDFFB-\\uDFFF])?' +
  '))*' +
  ')';

let SINGLE_EMOJI_REGEX: RegExp;
let ALL_EMOJIS_REGEX: RegExp;

try {
  SINGLE_EMOJI_REGEX = new RegExp(`^${EMOJI_TOKEN_PATTERN}$`);
  ALL_EMOJIS_REGEX = new RegExp(EMOJI_TOKEN_PATTERN, 'g');
} catch {
  // Ultra-resilient fallback
  SINGLE_EMOJI_REGEX = /./;
  ALL_EMOJIS_REGEX = /./g;
}

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
