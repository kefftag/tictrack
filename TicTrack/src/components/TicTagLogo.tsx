import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../utils/colors';

interface TicTagLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const TicTagLogo: React.FC<TicTagLogoProps> = ({ size = 'large' }) => {
  const sizeStyles = {
    small: { fontSize: 24, iconSize: 32 },
    medium: { fontSize: 36, iconSize: 48 },
    large: { fontSize: 56, iconSize: 64 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/tictag_mark_red.png')}
          style={[styles.logoImage, { width: currentSize.iconSize, height: currentSize.iconSize }]}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { fontSize: currentSize.fontSize }]}>
          Tic<Text style={styles.logoTextAccent}>Track</Text>
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
  logoImage: {
    tintColor: COLORS.primary,
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
