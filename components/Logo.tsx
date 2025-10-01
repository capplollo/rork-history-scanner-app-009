import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

export default function Logo({ size = 106, style }: LogoProps) {
  return (
    <Image
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h3ve8g8jkt71sbu6jwrlr' }}
      style={[styles.logo, { width: size, height: size * 0.25 }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    margin: 0,
    padding: 0,
  },
});