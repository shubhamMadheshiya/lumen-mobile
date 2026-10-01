import { Stack } from 'expo-router';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function CustomizeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.primary,
        headerTitleStyle: { ...typography.h4, color: palette.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    />
  );
}
