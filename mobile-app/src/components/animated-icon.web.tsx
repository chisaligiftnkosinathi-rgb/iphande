import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, useEffect } from 'react-native-reanimated';

export default function AnimatedIcon() {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.05, { duration: 2000 }), -1, true);
    opacity.value = withRepeat(withTiming(0.7, { duration: 2000 }), -1, true);
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      {/* Pure color geometry element instead of heavy image textures */}
      <Animated.View style={[styles.glow, animatedGlow]} />
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    elevation: 20, // Clean native shadow for Android runtime layers
    shadowColor: '#2563eb', // Clean native shadow for iOS runtime layers
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
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