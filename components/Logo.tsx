import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

const LOGO_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fif9nxbjvzd5vg0avyxag';

export default function Logo({ size = 191, style }: LogoProps) {
  console.log('Logo rendering with URL:', LOGO_URL);
  console.log('Logo size:', size);
  
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ 
          uri: LOGO_URL,
          cache: 'reload'
        }}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
        onLoad={() => console.log('Logo loaded successfully')}
        onError={(error) => console.error('Logo failed to load:', error.nativeEvent.error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  logo: {
    margin: 0,
    padding: 0,
  },
});