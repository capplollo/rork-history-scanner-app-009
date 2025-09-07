import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

export default function Logo({ size = 120, style }: LogoProps) {
  const columnWidth = size * 0.15;
  const columnHeight = size * 0.8;
  const baseHeight = size * 0.12;
  const capitalHeight = size * 0.08;
  const bridgeHeight = size * 0.08;
  const bridgeWidth = size * 0.4;
  
  return (
    <View style={[styles.logoContainer, { width: size, height: size }, style]}>
      {/* Left Column */}
      <View style={styles.column}>
        {/* Capital */}
        <View style={[
          styles.capital,
          {
            width: columnWidth * 1.4,
            height: capitalHeight,
          }
        ]} />
        {/* Shaft */}
        <View style={[
          styles.shaft,
          {
            width: columnWidth,
            height: columnHeight - capitalHeight - baseHeight,
          }
        ]} />
        {/* Base */}
        <View style={[
          styles.base,
          {
            width: columnWidth * 1.4,
            height: baseHeight,
          }
        ]} />
      </View>
      
      {/* Bridge connecting the columns */}
      <View style={[
        styles.bridge,
        {
          width: bridgeWidth,
          height: bridgeHeight,
          top: size * 0.35,
        }
      ]} />
      
      {/* Right Column */}
      <View style={styles.column}>
        {/* Capital */}
        <View style={[
          styles.capital,
          {
            width: columnWidth * 1.4,
            height: capitalHeight,
          }
        ]} />
        {/* Shaft */}
        <View style={[
          styles.shaft,
          {
            width: columnWidth,
            height: columnHeight - capitalHeight - baseHeight,
          }
        ]} />
        {/* Base */}
        <View style={[
          styles.base,
          {
            width: columnWidth * 1.4,
            height: baseHeight,
          }
        ]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    position: 'relative',
  },
  column: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  capital: {
    backgroundColor: '#D4D4D8',
    borderRadius: 2,
  },
  shaft: {
    backgroundColor: '#E4E4E7',
    marginVertical: 1,
  },
  base: {
    backgroundColor: '#D4D4D8',
    borderRadius: 2,
  },
  bridge: {
    backgroundColor: '#E4E4E7',
    position: 'absolute',
    left: '20%',
    right: '20%',
  },
});