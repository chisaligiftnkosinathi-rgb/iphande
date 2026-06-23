import { TextStyle, ViewStyle } from 'react-native';

const theme = {
    colors: {
        humanSpace: {
            background: '#f9fafb',
            surface: '#ffffff',
        },
        structural: {
            charcoal: '#22223b',
            charcoalLight: '#4a4e69',
            slate: '#6c757d',
            slateMuted: '#adb5bd',
            border: '#dee2e6',
            borderSoft: '#f1f3f5',
        },
        stewardship: {
            bg: '#e0f2f1',
            border: '#26a69a',
            text: '#16a34a',
            textDeep: '#065f46',
        },
        reality: {
            bg: '#f0f0f0',
            border: '#bdbdbd',
            text: '#333333',
            textDeep: '#212121',
        },
        evidence: {
            bg: '#fffbe6',
            border: '#ffe58f',
            textDeep: '#ad6800',
        },
        resolution: {
            textDeep: '#b91c1c',
            bg: '#fef2f2',
            border: '#fca5a5',
        },
        wisdom: {
            bg: '#e0e7ff',
            border: '#6366f1',
            text: '#3730a3',
            textDeep: '#312e81',
        },
    },
    layout: {
        spacing: {
            xs: 4,
            sm: 8,
            md: 12,
            lg: 16,
            xl: 24,
            xxl: 32,
            xxxl: 48,
            huge: 64,
        },
        radii: {
            sm: 4,
            md: 8,
            lg: 16,
            xl: 24,
            pill: 999,
        },
        cards: {
            padding: 16,
            radius: 8,
            gap: 12,
            base: {
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: '#dee2e6',
            } as ViewStyle,
        },
    },
    typography: {
        body: {
            fontSize: 16,
            color: '#22223b',
        } as TextStyle,
        bodyStrong: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#22223b',
        } as TextStyle,
        caption: {
            fontSize: 12,
            color: '#6c757d',
        } as TextStyle,
        heading: {
            fontSize: 18,
            fontWeight: '600',
            color: '#22223b',
        } as TextStyle,
        eyebrow: {
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: '#adb5bd',
        } as TextStyle,
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#22223b',
        } as TextStyle,
        display: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#22223b',
        } as TextStyle,
    },
} as const;

export default theme;
