/**
 * Manages localStorage flags that track install prompt state.
 *
 * Keys:
 *   pwa.visited          — set on first page load
 *   pwa.banner.dismissed — set when user taps × on the banner (permanent)
 *   pwa.sheet.seen       — set when the bottom sheet has been shown once
 *   pwa.installed        — set when the user accepts the install prompt
 */

const VISITED           = 'pwa.visited';
const BANNER_DISMISSED  = 'pwa.banner.dismissed';
const SHEET_SEEN        = 'pwa.sheet.seen';
const INSTALLED         = 'pwa.installed';

function get(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function set(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // localStorage unavailable — fail silently.
  }
}

export function isFirstVisit(): boolean {
  return !get(VISITED);
}

export function isSecondVisit(): boolean {
  return get(VISITED) && !get(SHEET_SEEN);
}

export function markVisited(): void {
  set(VISITED);
}

export function isBannerDismissed(): boolean {
  return get(BANNER_DISMISSED);
}

export function dismissBanner(): void {
  set(BANNER_DISMISSED);
}

export function isSheetSeen(): boolean {
  return get(SHEET_SEEN);
}

export function markSheetSeen(): void {
  set(SHEET_SEEN);
}

export function isInstalled(): boolean {
  return get(INSTALLED);
}

export function markInstalled(): void {
  set(INSTALLED);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    !!(navigator as any).standalone ||
    document.referrer.startsWith('android-app://')
  );
}

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPhone / iPod
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Macintosh with touch support
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

export function isSafari(): boolean {
  return (
    /Safari/.test(navigator.userAgent) &&
    !/Chrome|CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)
  );
}
