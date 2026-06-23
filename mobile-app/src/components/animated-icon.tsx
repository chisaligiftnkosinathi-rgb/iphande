import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

const DURATION = 2000;

// Pure CSS keyframes for a pulsing neon glow effect (No image assets required)
const pulseKeyframe = new Keyframe({
  0: { opacity: 0.3, transform: [{ scale: 0.95 }] },
  50: { opacity: 0.6, transform: [{ scale: 1.05 }] },
  100: { opacity: 0.3, transform: [{ scale: 0.95 }] },
});

export default function AnimatedIconWeb() {
  return (
    <View style={styles.iconContainer}>
      {/* Structural Ambient Glow Effect using CSS Shadow Masking */}
      <Animated.View
        entering={pulseKeyframe.duration(DURATION).loop()}
        style={styles.glow}
      />

      {/* Central Vector Placeholder for Logo Core */}
      <View style={styles.coreElement} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb', // Matches your primary branding blue
    // Native Web box-shadow to simulate image-glow dynamically
    // @ts-ignore
    boxShadow: '0 0 40px 20px rgba(37, 99, 235, 0.4)',
    filter: 'blur(20px)',
  },
  coreElement: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
});