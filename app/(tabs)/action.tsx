import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Fallback route for the center tab button.
 * The center tab button intercepts clicks to open /log directly.
 */
export default function ActionTabScreen() {
  return <Redirect href="/log" />;
}
