import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

interface TicTagLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const TicTagLogo: React.FC<TicTagLogoProps> = ({ size = 'large' }) => {
  const sizeStyles = {
    small: { fontSize: 24, iconSize: 28 },
    medium: { fontSize: 36, iconSize: 42 },
    large: { fontSize: 56, iconSize: 64 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Placeholder for TicTag logo - replace with actual logo */}
        <View style={[styles.iconCircle, { width: currentSize.iconSize, height: currentSize.iconSize }]}>
          <Text style={[styles.icon, { fontSize: currentSize.iconSize * 0.6 }]}>🏷️</Text>
        </View>
        <Text style={[styles.logoText, { fontSize: currentSize.fontSize }]}>
          Tic<Text style={styles.logoTextAccent}>Tag</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  icon: {
    color: COLORS.text,
  },
  logoText: {
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: -1,
  },
  logoTextAccent: {
    color: COLORS.primary,
  },
});
