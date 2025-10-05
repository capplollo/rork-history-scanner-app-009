import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CornerBracketsProps {
  size?: number;
  thickness?: number;
  color?: string;
  opacity?: number;
  inset?: number;
}

export default function CornerBrackets({
  size = 44,
  thickness = 6,
  color = '#FFFFFF',
  opacity = 0.95,
  inset = 12,
}: CornerBracketsProps) {
  return (
    <>
      <View
        style={[
          styles.corner,
          styles.topLeft,
          {
            top: inset,
            left: inset,
            width: size,
            height: size,
            borderTopWidth: thickness,
            borderLeftWidth: thickness,
            borderColor: color,
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.topRight,
          {
            top: inset,
            right: inset,
            width: size,
            height: size,
            borderTopWidth: thickness,
            borderRightWidth: thickness,
            borderColor: color,
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.bottomLeft,
          {
            bottom: inset,
            left: inset,
            width: size,
            height: size,
            borderBottomWidth: thickness,
            borderLeftWidth: thickness,
            borderColor: color,
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.bottomRight,
          {
            bottom: inset,
            right: inset,
            width: size,
            height: size,
            borderBottomWidth: thickness,
            borderRightWidth: thickness,
            borderColor: color,
            opacity,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
  },
  topLeft: {
    borderTopLeftRadius: 4,
  },
  topRight: {
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    borderBottomRightRadius: 4,
  },
});
