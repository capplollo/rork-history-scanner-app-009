import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

export default function Logo({ size = 80, style }: LogoProps) {
  const bookmarkHeight = size * 1.2;
  const bookmarkWidth = size * 0.8;
  const triangleHeight = size * 0.3;
  
  return (
    <View style={[styles.bookmarkContainer, style]}>
      <View style={{
        width: bookmarkWidth,
        height: bookmarkHeight,
      }}>
        {/* Main bookmark body */}
        <View style={[
          styles.bookmarkBody,
          {
            width: bookmarkWidth,
            height: bookmarkHeight - triangleHeight,
          }
        ]}>
          {/* Logo content - replace A with actual logo */}
          <View style={styles.logoContainer}>
            <View style={[
              styles.logoCircle,
              {
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: size * 0.2,
              }
            ]}>
              <Text style={[
                styles.logoText,
                {
                  fontSize: size * 0.2,
                }
              ]}>🏛️</Text>
            </View>
          </View>
        </View>
        
        {/* Bookmark triangle bottom */}
        <View style={[
          styles.triangleContainer,
          {
            width: bookmarkWidth,
            height: triangleHeight,
          }
        ]}>
          <View style={[
            styles.triangleLeft,
            {
              borderTopWidth: triangleHeight,
              borderRightWidth: bookmarkWidth / 2,
            }
          ]} />
          <View style={[
            styles.triangleRight,
            {
              borderTopWidth: triangleHeight,
              borderLeftWidth: bookmarkWidth / 2,
            }
          ]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bookmarkContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  bookmarkBody: {
    backgroundColor: '#1D3557',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  triangleLeft: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopColor: '#1D3557',
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  triangleRight: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopColor: '#1D3557',
    borderLeftColor: 'transparent',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    textAlign: 'center',
  },
});