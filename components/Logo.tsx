import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

export default function Logo({ size = 191, style }: LogoProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/q2vrur5wrhwyf2vbtsen2' }}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  logo: {
    margin: 0,
    padding: 0,
  },
});