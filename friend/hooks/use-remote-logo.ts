import { useState, useEffect, useCallback, useRef } from 'react';
import { Image } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LogoStatus = 'loading' | 'success' | 'error';

export interface RemoteLogoState {
  /** The resolved URL to render, or null while loading / on error */
  logoUrl: string | null;
  status: LogoStatus;
  isLoading: boolean;
  isReady: boolean;
  hasError: boolean;
  retry: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useRemoteLogo – downloads and caches a remote logo URL.
 *
 * Uses React Native's `Image.prefetch` to warm the image cache.
 * Falls back gracefully on network failure so the caller can render
 * a local asset instead.
 *
 * @param remoteUrl   The Cloudinary (or any HTTPS) image URL.
 * @param timeoutMs   Milliseconds before giving up (default 8 000).
 */
export function useRemoteLogo(
  remoteUrl: string,
  timeoutMs = 8_000,
): RemoteLogoState {
  const [status, setStatus] = useState<LogoStatus>('loading');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Prevent setting state on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    setLogoUrl(null);
    setRetryKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!remoteUrl) {
      setStatus('error');
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const succeed = () => {
      if (settled || !mountedRef.current) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      setLogoUrl(remoteUrl);
      setStatus('success');
    };

    const fail = (reason: unknown) => {
      if (settled || !mountedRef.current) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      console.warn('[useRemoteLogo] Failed to prefetch logo:', reason);
      setStatus('error');
    };

    // Hard timeout — if prefetch hangs, treat as error
    timeoutId = setTimeout(() => fail('timeout'), timeoutMs);

    // Image.prefetch is the safest cross-platform way to verify + cache a URL
    Image.prefetch(remoteUrl).then(succeed).catch(fail);

    return () => {
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [remoteUrl, retryKey, timeoutMs]);

  return {
    logoUrl,
    status,
    isLoading: status === 'loading',
    isReady: status === 'success',
    hasError: status === 'error',
    retry,
  };
}
