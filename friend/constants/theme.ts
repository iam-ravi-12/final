/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0A4174';
const tintColorDark = '#7BBDE8';

export const Colors = {
  light: {
    text: '#001D39',
    background: '#F4F8FA',
    tint: tintColorLight,
    icon: '#49769F',
    tabIconDefault: '#49769F',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#BDD8E9',
    background: '#001D39',
    tint: tintColorDark,
    icon: '#6EA2B3',
    tabIconDefault: '#6EA2B3',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'SF Compact Rounded',
    serif: 'serif',
    rounded: 'SF Compact Rounded',
    mono: 'monospace',
  },
  web: {
    sans: "'SF Compact Rounded', 'SF Pro Rounded', 'ui-rounded', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Compact Rounded', 'SF Pro Rounded', 'ui-rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
