import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

interface CachedUrl {
  url: string;
  expiresAt: number;
}

// 50 minutes cache TTL (signed S3 download URLs expire in 60 minutes)
const CACHE_TTL_MS = 50 * 60 * 1000;
const mediaUrlCache = new Map<string, CachedUrl>();
const inFlightPromises = new Map<string, Promise<string>>();

/**
 * Checks whether a given string is a permanent or local displayable URI
 * (e.g. https://, http://, file://, content://, data:image/...).
 */
export function isDirectDisplayableUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  return (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('data:')
  );
}

/**
 * Checks if a string matches a MongoDB ObjectId (24 hex characters)
 * or a standard UUID.
 */
export function isMediaId(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const hex24 = /^[0-9a-fA-F]{24}$/;
  const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return hex24.test(str) || uuid.test(str);
}

/**
 * Resolves a mediaId (MongoDB ObjectId / UUID) into a pre-signed S3 download URL.
 * If the string is already a displayable URI, it is returned unchanged.
 */
export async function resolveMediaUrl(idOrUri: string): Promise<string> {
  if (!idOrUri || typeof idOrUri !== 'string') return '';
  const trimmed = idOrUri.trim();
  if (!trimmed) return '';

  // Already a direct image URI (https://, http://, file://, etc.)
  if (isDirectDisplayableUri(trimmed)) {
    return trimmed;
  }

  // Check in-memory cache
  const cached = mediaUrlCache.get(trimmed);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.url;
  }

  // Deduplicate concurrent requests for the same mediaId
  const inFlight = inFlightPromises.get(trimmed);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      const res = await api.get<any>(`/media/${trimmed}/url`);
      const url: string =
        res?.data?.url ||
        res?.url ||
        res?.data?.downloadUrl ||
        res?.downloadUrl ||
        '';

      if (url) {
        mediaUrlCache.set(trimmed, {
          url,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return url;
      }
      return trimmed;
    } catch (err) {
      console.warn(`[mediaService] Failed to resolve media URL for ID ${trimmed}:`, err);
      return trimmed;
    } finally {
      inFlightPromises.delete(trimmed);
    }
  })();

  inFlightPromises.set(trimmed, promise);
  return promise;
}

/**
 * Resolves an array of media IDs or URIs into displayable URLs concurrently.
 */
export async function resolveMediaUrls(idsOrUris: string[]): Promise<string[]> {
  if (!Array.isArray(idsOrUris) || idsOrUris.length === 0) return [];
  return Promise.all(idsOrUris.map((item) => resolveMediaUrl(item)));
}

/**
 * React hook that takes raw URIs / mediaIds and resolves them into displayable URLs.
 */
export function useResolvedMediaUrls(rawUris?: string[] | string | null): {
  urls: string[];
  isLoading: boolean;
  error: string | null;
} {
  const uriList: string[] = Array.isArray(rawUris)
    ? rawUris.filter(Boolean).map(String)
    : typeof rawUris === 'string' && rawUris.trim().length > 0
    ? [rawUris.trim()]
    : [];

  const key = uriList.join('|');
  const [urls, setUrls] = useState<string[]>(() => {
    // Synchronously resolve any that are already direct URIs or in cache
    return uriList.map((item) => {
      if (isDirectDisplayableUri(item)) return item;
      const cached = mediaUrlCache.get(item);
      return cached && Date.now() < cached.expiresAt ? cached.url : '';
    });
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If any item is not yet a direct URI and not in cache, we need to load
    return uriList.some((item) => {
      if (isDirectDisplayableUri(item)) return false;
      const cached = mediaUrlCache.get(item);
      return !cached || Date.now() >= cached.expiresAt;
    });
  });

  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (uriList.length === 0) {
      setUrls([]);
      setIsLoading(false);
      return;
    }

    let isStale = false;
    const needsResolution = uriList.some((item) => {
      if (isDirectDisplayableUri(item)) return false;
      const cached = mediaUrlCache.get(item);
      return !cached || Date.now() >= cached.expiresAt;
    });

    if (!needsResolution) {
      const resolved = uriList.map((item) => {
        if (isDirectDisplayableUri(item)) return item;
        return mediaUrlCache.get(item)?.url || item;
      });
      setUrls(resolved);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    resolveMediaUrls(uriList)
      .then((resolved) => {
        if (isStale || !isMountedRef.current) return;
        setUrls(resolved);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isStale || !isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to resolve images');
        setIsLoading(false);
      });

    return () => {
      isStale = true;
      isMountedRef.current = false;
    };
  }, [key]);

  return { urls, isLoading, error };
}
