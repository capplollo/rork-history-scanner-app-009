import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

export default function Logo({ size = 120, style }: LogoProps) {
  return (
    <Image
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/287zxp45qduhgqwf1zmhl' }}
      style={[styles.logo, { width: size, height: size * 0.4 }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    // Image will maintain aspect ratio with resizeMode="contain"
  },
});