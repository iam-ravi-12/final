import { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LogoStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RemoteLogoState {
  /** The URL to render – either the remote URL or null while loading/errored */
  logoUrl: string | null;
  /** Current fetch/validation lifecycle */
  status: LogoStatus;
  /** True while the network prefetch is in flight */
  isLoading: boolean;
  /** True once the remote URL has been confirmed reachable */
  isReady: boolean;
  /** True when the remote URL failed and the fallback should be used */
  hasError: boolean;
  /** Manually retry fetching the remote URL */
  retry: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `useRemoteLogo` – loads a logo from a remote URL with loading / error states.
 *
 * Features
 * ────────
 * • Prefetches the remote image so it is in React Native's image cache before
 *   it is rendered – avoids a blank frame on first mount.
 * • Validates the URL with a lightweight HEAD request before committing.
 * • Returns `hasError = true` if the fetch fails so callers can fall back to a
 *   local asset.
 * • Exposes a `retry()` function to re-attempt after a failure.
 * • Aborts in-flight requests when the component unmounts.
 *
 * @param remoteUrl  The primary remote logo URL.
 * @param timeoutMs  How long to wait before treating the fetch as failed (default 8 s).
 */
export function useRemoteLogo(
  remoteUrl: string,
  timeoutMs = 8_000,
): RemoteLogoState {
  const [status, setStatus] = useState<LogoStatus>('idle');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setStatus('idle');
    setLogoUrl(null);
    setRetryCount(c => c + 1);
  }, []);

  useEffect(() => {
    if (!remoteUrl) {
      setStatus('error');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const load = async () => {
      setStatus('loading');
      setLogoUrl(null);

      try {
        // ── Step 1: HEAD-check the URL is reachable ───────────────────
        const response = await fetch(remoteUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        // ── Step 2: Prefetch into RN image cache ──────────────────────
        await Image.prefetch(remoteUrl);

        if (cancelled) return;

        setLogoUrl(remoteUrl);
        setStatus('success');
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.name : 'unknown';
        console.warn(`[useRemoteLogo] Failed to load logo (${message}):`, remoteUrl);
        setStatus('error');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [remoteUrl, retryCount, timeoutMs]);

  return {
    logoUrl,
    status,
    isLoading: status === 'idle' || status === 'loading',
    isReady: status === 'success',
    hasError: status === 'error',
    retry,
  };
}
