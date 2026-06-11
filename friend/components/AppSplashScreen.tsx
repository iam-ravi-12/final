import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import RemoteLogo from './RemoteLogo';

const { width, height } = Dimensions.get('window');

interface AppSplashScreenProps {
  onFinish: () => void;
  ready: boolean;
}

export default function AppSplashScreen({ onFinish, ready }: AppSplashScreenProps) {
  // ── Animations ────────────────────────────────────────────────────────────
  const logoScale     = useRef(new Animated.Value(0.6)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const dotOpacity    = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  // ── Exit gates (all three must be true) ──────────────────────────────────
  const timerDone   = useRef(false);
  const authReady   = useRef(false);
  const logoReady   = useRef(false);
  const exitStarted = useRef(false);

  // ── Stable exit function (no stale closure risk) ─────────────────────────
  const tryExit = useCallback(() => {
    if (
      timerDone.current &&
      authReady.current &&
      logoReady.current &&
      !exitStarted.current
    ) {
      exitStarted.current = true;
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }
  }, [onFinish, screenOpacity]);

  // Sync auth prop
  useEffect(() => {
    authReady.current = ready;
    tryExit();
  }, [ready, tryExit]);

  // Logo resolved (success or error)
  const handleLogoResolved = useCallback(() => {
    if (logoReady.current) return;
    logoReady.current = true;

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

    tryExit();
  }, [logoScale, logoOpacity, textOpacity, tryExit]);

  // Mount: pulsing dots + 2-second minimum timer
  useEffect(() => {
    const pulseDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      );

    const anims = [
      pulseDot(dotOpacity[0], 0),
      pulseDot(dotOpacity[1], 200),
      pulseDot(dotOpacity[2], 400),
    ];
    anims.forEach(a => a.start());

    const timer = setTimeout(() => {
      timerDone.current = true;
      tryExit();
    }, 2000);

    return () => {
      clearTimeout(timer);
      anims.forEach(a => a.stop());
    };
  }, [tryExit]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />
      <View style={[styles.circle, styles.circleLarge]} />
      <View style={[styles.circle, styles.circleMedium]} />
      <View style={[styles.circle, styles.circleSmall]} />

      {/* Logo – loaded from Cloudinary, falls back to local asset */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <RemoteLogo
          containerStyle={styles.logoInner}
          imageStyle={styles.logoImage}
          loadingColor="rgba(255,255,255,0.8)"
          loadingSize="large"
          timeoutMs={6000}
          resizeMode="contain"
          showRetryOnError={false}
          onLoad={handleLogoResolved}
          onFallback={handleLogoResolved}
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.tagline}>Connect · Share · Belong</Text>
      </Animated.View>

      {/* Pulsing dots */}
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
  gradientTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.55,
    backgroundColor: BLUE_MID,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    opacity: 0.5,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
  logoInner:  { width: '100%', height: '100%' },
  logoImage:  { width: '100%', height: '100%' },
  tagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 40,
    textAlign: 'center',
  },
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
