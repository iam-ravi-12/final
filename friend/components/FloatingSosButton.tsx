import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
} from 'react-native';
import SosButton from './SosButton';

const BUTTON_SIZE = 52;
const EDGE_MARGIN = 12;
const SNAP_DURATION = 250;

// Initial position: bottom-right, above the tab bar area
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_X = SCREEN_WIDTH - BUTTON_SIZE - EDGE_MARGIN;
const INITIAL_Y = SCREEN_HEIGHT - BUTTON_SIZE - 160; // above tab bar

export default function FloatingSosButton() {
  const [showSosModal, setShowSosModal] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: INITIAL_X, y: INITIAL_Y })).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const currentPos = useRef({ x: INITIAL_X, y: INITIAL_Y });

  // Keep screen dimensions up-to-date on rotation / resize
  const screenDims = useRef({ w: SCREEN_WIDTH, h: SCREEN_HEIGHT });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      screenDims.current = { w: window.width, h: window.height };
    });
    return () => sub?.remove();
  }, []);

  // Track pan offset so we always know the current position
  useEffect(() => {
    const id = pan.addListener((value) => {
      currentPos.current = { x: value.x, y: value.y };
    });
    return () => pan.removeListener(id);
  }, []);

  // Subtle pulsing glow
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,

      onPanResponderGrant: () => {
        isDragging.current = false;
        // Flatten current offset so deltas apply from current position
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gesture);
      },

      onPanResponderRelease: () => {
        pan.flattenOffset();

        const { w, h } = screenDims.current;
        const { x, y } = currentPos.current;

        // Clamp Y within screen bounds
        const clampedY = Math.max(
          EDGE_MARGIN + 40, // below status bar
          Math.min(y, h - BUTTON_SIZE - EDGE_MARGIN),
        );

        // Snap to nearest horizontal edge
        const snapX =
          x + BUTTON_SIZE / 2 < w / 2
            ? EDGE_MARGIN
            : w - BUTTON_SIZE - EDGE_MARGIN;

        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
          tension: 80,
        }).start();

        // If it was a tap (not a drag), open the SOS modal
        if (!isDragging.current) {
          setShowSosModal(true);
        }
      },
    }),
  ).current;

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
      >
        {/* Pulsing glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({
                inputRange: [1, 1.12],
                outputRange: [0.4, 0.15],
              }),
            },
          ]}
        />
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => {
            if (!isDragging.current) {
              setShowSosModal(true);
            }
          }}
        >
          <Text style={styles.label}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Reuse existing SOS modal */}
      <SosButton
        showModal={showSosModal}
        onClose={() => setShowSosModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 99999,
    elevation: 99999,
  },
  glowRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: BUTTON_SIZE + 12,
    height: BUTTON_SIZE + 12,
    borderRadius: (BUTTON_SIZE + 12) / 2,
    backgroundColor: '#ff0000',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
