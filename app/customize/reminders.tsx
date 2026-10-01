import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy route redirect.
 * All reminder management has moved to the unified /reminders hub.
 */
export default function CustomizeRemindersRedirect() {
  return <Redirect href="/reminders" />;
}
