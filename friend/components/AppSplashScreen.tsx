import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface AppSplashScreenProps {
  /** Called once the 2-second minimum has elapsed */
  onFinish: () => void;
  /** Pass true once your async work (auth check, etc.) is done */
  ready: boolean;
}

/**
 * In-app splash / loading screen that shows the Friends logo.
 *
 * Rules:
 *  - Always visible for at least 2 000 ms (branding beat)
 *  - Stays visible until `ready` is also true
 *  - Fades out smoothly, then calls `onFinish`
 */
export default function AppSplashScreen({ onFinish, ready }: AppSplashScreenProps) {
  // Animation values
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity  = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Track whether the 2-second minimum has passed
  const timerDoneRef = useRef(false);
  const readyRef     = useRef(false);
  const exitStarted  = useRef(false);

  const tryExit = () => {
    if (timerDoneRef.current && readyRef.current && !exitStarted.current) {
      exitStarted.current = true;
      // Fade the entire screen out
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => onFinish());
    }
  };

  // Keep `readyRef` in sync with prop
  useEffect(() => {
    readyRef.current = ready;
    tryExit();
  }, [ready]);

  useEffect(() => {
    // ── Entrance animations ──────────────────────────────────────
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    // ── Pulsing dots ─────────────────────────────────────────────
    const pulseDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );

    const d0 = pulseDot(dotOpacity[0], 0);
    const d1 = pulseDot(dotOpacity[1], 200);
    const d2 = pulseDot(dotOpacity[2], 400);
    d0.start();
    d1.start();
    d2.start();

    // ── 2-second minimum timer ───────────────────────────────────
    const timer = setTimeout(() => {
      timerDoneRef.current = true;
      tryExit();
    }, 2000);

    return () => {
      clearTimeout(timer);
      d0.stop();
      d1.stop();
      d2.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background gradient layers */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleLarge]} />
      <View style={[styles.circle, styles.circleMedium]} />
      <View style={[styles.circle, styles.circleSmall]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require('../assets/images/friends-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.tagline}>Connect · Share · Belong</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: textOpacity }]}>
        {dotOpacity.map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const BLUE_DARK  = '#0a2d8f';
const BLUE_MID   = '#1a55e0';
const BLUE_LIGHT = '#3b82f6';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BLUE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  // ── Background decorations ───────────────────────────────────────
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: BLUE_MID,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    opacity: 0.5,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#061a5e',
    borderTopLeftRadius: width * 0.8,
    borderTopRightRadius: width * 0.8,
    opacity: 0.6,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: BLUE_LIGHT,
    opacity: 0.08,
  },
  circleLarge:  { width: 420, height: 420, top: -100, right: -120 },
  circleMedium: { width: 260, height: 260, bottom: 60, left: -80 },
  circleSmall:  { width: 140, height: 140, top: height * 0.45, right: -40 },

  // ── Logo ─────────────────────────────────────────────────────────
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    marginBottom: 28,
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  // ── Text ─────────────────────────────────────────────────────────
  tagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 40,
    textAlign: 'center',
  },

  // ── Loading dots ─────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 44,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
