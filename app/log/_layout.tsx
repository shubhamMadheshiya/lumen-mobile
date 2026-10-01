import { Stack } from 'expo-router';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function LogLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.primary,
        headerTitleStyle: { ...typography.h4, color: palette.text },
        headerShadowVisible: false,
      }}
    />
  );
}
