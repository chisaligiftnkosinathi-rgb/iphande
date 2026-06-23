import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink } from '@/components/external-link';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function WebBadge() {
  const theme = useTheme();

  // Guard clause to protect mobile execution layouts completely
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <ExternalLink href="https://expo.dev" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.badge,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1
            }
          ]}
        >
          <Text style={[styles.textLabel, { color: theme.textSecondary }]}>
            Made with
          </Text>
          <Text style={[styles.textBrand, { color: theme.text }]}>
            Expo Platform
          </Text>
        </Pressable>
      </ExternalLink>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    width: '100%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  textLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  textBrand: {
    fontSize: 11,
    fontWeight: '700',
  },
});