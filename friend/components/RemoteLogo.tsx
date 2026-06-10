import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRemoteLogo } from '../hooks/use-remote-logo';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Primary logo URL served from Cloudinary. */
export const REMOTE_LOGO_URL =
  'https://res.cloudinary.com/dz999gd6u/image/upload/v1781070615/icon_peco0w.png';

/** Local asset used as a fallback when the remote URL is unreachable. */
const FALLBACK_SOURCE = require('../assets/images/friends-logo.png');

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface RemoteLogoProps {
  /** Override the remote URL (defaults to REMOTE_LOGO_URL). */
  remoteUrl?: string;
  /** Style applied to the outer container View. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style applied to the <Image> itself. */
  imageStyle?: StyleProp<ImageStyle>;
  /** Color of the ActivityIndicator shown while loading (default: '#fff'). */
  loadingColor?: string;
  /** Size of the ActivityIndicator (default: 'large'). */
  loadingSize?: 'small' | 'large';
  /** How long (ms) to wait before treating the fetch as failed (default: 8000). */
  timeoutMs?: number;
  /** Image resize mode (default: 'contain'). */
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  /** Whether to show a retry button on error (default: true). */
  showRetryOnError?: boolean;
  /** Called when the image finishes loading successfully. */
  onLoad?: () => void;
  /** Called when the remote URL fails and the fallback is used. */
  onFallback?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `RemoteLogo` – renders the Friends app logo from a remote Cloudinary URL.
 *
 * Behaviour
 * ─────────
 * 1. Shows an `ActivityIndicator` while the remote URL is being fetched /
 *    prefetched into the React Native image cache.
 * 2. Renders the remote `<Image>` once it is ready.
 * 3. Falls back to the local `friends-logo.png` asset if the network request
 *    fails (no internet, CDN down, etc.).
 * 4. Optionally shows a "Retry" button on failure so the user can re-attempt
 *    without restarting the app.
 *
 * Usage
 * ─────
 * ```tsx
 * <RemoteLogo
 *   containerStyle={{ width: 180, height: 180, borderRadius: 40 }}
 *   imageStyle={{ width: '100%', height: '100%' }}
 * />
 * ```
 */
export default function RemoteLogo({
  remoteUrl = REMOTE_LOGO_URL,
  containerStyle,
  imageStyle,
  loadingColor = '#ffffff',
  loadingSize = 'large',
  timeoutMs = 8_000,
  resizeMode = 'contain',
  showRetryOnError = true,
  onLoad,
  onFallback,
}: RemoteLogoProps) {
  const { logoUrl, isLoading, isReady, hasError, retry } = useRemoteLogo(
    remoteUrl,
    timeoutMs,
  );

  // Notify parent on fallback
  React.useEffect(() => {
    if (hasError) onFallback?.();
  }, [hasError]);

  // Notify parent on success
  React.useEffect(() => {
    if (isReady) onLoad?.();
  }, [isReady]);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* ── Loading state ─────────────────────────────────────────── */}
      {isLoading && (
        <View style={styles.centeredOverlay}>
          <ActivityIndicator color={loadingColor} size={loadingSize} />
        </View>
      )}

      {/* ── Remote image (success) ────────────────────────────────── */}
      {isReady && logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
          accessibilityLabel="Friends app logo"
          accessibilityRole="image"
          // useEffect-driven prefetch already loaded this into the RN cache,
          // so this renders instantly without a second network round-trip.
        />
      )}

      {/* ── Fallback image (error) ────────────────────────────────── */}
      {hasError && (
        <View style={styles.fallbackContainer}>
          <Image
            source={FALLBACK_SOURCE}
            style={[styles.image, imageStyle]}
            resizeMode={resizeMode}
            accessibilityLabel="Friends app logo (offline)"
            accessibilityRole="image"
          />
          {showRetryOnError && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel="Retry loading logo"
            >
              <Text style={styles.retryText}>↺ Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    position: 'absolute',
    bottom: -28,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
