/**
 * Accessibility helpers.
 * Provides consistent accessibilityLabel generation and a11y prop sets
 * for common interactive patterns.
 */
import { AccessibilityProps } from 'react-native';

/** Standard props for a selectable chip/radio option. */
export function radioProps(label: string, selected: boolean): AccessibilityProps {
  return {
    accessibilityRole: 'radio',
    accessibilityLabel: label,
    accessibilityState: { selected },
  };
}

/** Standard props for a checkbox toggle. */
export function checkboxProps(label: string, checked: boolean): AccessibilityProps {
  return {
    accessibilityRole: 'checkbox',
    accessibilityLabel: label,
    accessibilityState: { checked },
  };
}

/** Standard props for a button. */
export function buttonProps(label: string, disabled = false): AccessibilityProps {
  return {
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityState: { disabled },
  };
}

/** Props for a list item that navigates somewhere. */
export function navItemProps(label: string): AccessibilityProps {
  return {
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: 'Double-tap to open',
  };
}

/** Announce a value change to screen readers (e.g. a slider). */
export function sliderProps(label: string, value: number, min: number, max: number): AccessibilityProps {
  return {
    accessibilityRole: 'adjustable',
    accessibilityLabel: label,
    accessibilityValue: { min, max, now: value, text: `${value}` },
  };
}

/** Make a decorative element invisible to screen readers. */
export const decorativeProps: AccessibilityProps = {
  accessible: false,
  importantForAccessibility: 'no',
};

/** Minimum touch-target size (48 × 48 dp per WCAG / Material). */
export const MIN_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
