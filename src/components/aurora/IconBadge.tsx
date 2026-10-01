import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

export interface IconBadgeProps {
  icon: React.ReactNode;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

/**
 * Optical Glass Badge for Lucide Icons
 * Follows Cult.fit Aurora micro-surfacing (bg-white/10 border-white/15)
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  tintColor,
  style,
  size = 42,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.38),
        },
        tintColor && {
          backgroundColor: `${tintColor}1A`, // 10% hex opacity
          borderColor: `${tintColor}33`,     // 20% hex opacity
        },
        style,
      ]}
    >
      {icon}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default IconBadge;
