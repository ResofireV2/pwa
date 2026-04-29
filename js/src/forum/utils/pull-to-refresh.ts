/**
 * Pull-to-refresh for iOS standalone PWA mode.
 *
 * iOS Safari disables the native pull-to-refresh gesture in standalone mode.
 * This module implements it manually using touch events. It is intentionally
 * iOS-only since Android already provides native PTR in standalone mode.
 *
 * Only activates when:
 *  - Running as an installed PWA (standalone display mode)
 *  - On an iOS device
 *  - The page is already scrolled to the very top (scrollY === 0)
 *  - The user pulls downward
 */

import { isIOS, isStandalone } from './install-state';

// ── Constants ──────────────────────────────────────────────────────────────────

/** How far (px) the user must pull before release triggers a reload. */
const THRESHOLD = 80;

/** Maximum visual distance the indicator travels before capping. */
const MAX_PULL = 120;

/** Resistance factor — makes the pull feel springy rather than 1:1. */
const RESISTANCE = 2.5;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the current vertical scroll position regardless of which element
 * is actually tracking the scroll. On iOS Safari, body { overflow-x: hidden }
 * (used by some themes) causes window.scrollY to always report 0 while the
 * actual scroll is tracked on document.documentElement or document.body.
 * Checking all three covers this edge case.
 */
function getScrollY(): number {
  return Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  );
}

// ── State ──────────────────────────────────────────────────────────────────────

let startY     = 0;
let currentY   = 0;
let pulling    = false;
let refreshing = false;
let indicator  : HTMLElement | null = null;

// ── Public API ─────────────────────────────────────────────────────────────────

export function initPullToRefresh(): void {
  if (!isStandalone() || !isIOS()) return;

  createIndicator();

  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove',  onTouchMove,  { passive: false });
  document.addEventListener('touchend',   onTouchEnd,   { passive: true });
}

// ── Indicator ─────────────────────────────────────────────────────────────────

function createIndicator(): void {
  indicator = document.createElement('div');
  indicator.id        = 'pwa-ptr-indicator';
  indicator.className = 'PWA-ptr-indicator';
  indicator.innerHTML = '<div class="PWA-ptr-spinner"></div>';
  document.body.appendChild(indicator);
}

function setIndicatorProgress(progress: number): void {
  if (!indicator) return;
  const clampedProgress = Math.min(progress, 1);
  indicator.style.transform  = `translateY(${Math.min(currentY / RESISTANCE, MAX_PULL)}px)`;
  indicator.style.opacity    = String(clampedProgress);
  indicator.classList.toggle('is-ready', clampedProgress >= 1);
}

function setRefreshing(): void {
  if (!indicator) return;
  indicator.classList.add('is-refreshing');
  indicator.style.transform = `translateY(${THRESHOLD}px)`;
  indicator.style.opacity   = '1';
}

function resetIndicator(): void {
  if (!indicator) return;
  indicator.classList.remove('is-ready', 'is-refreshing');
  indicator.style.transform = '';
  indicator.style.opacity   = '0';
}

// ── Touch handlers ─────────────────────────────────────────────────────────────

function onTouchStart(e: TouchEvent): void {
  if (refreshing) return;
  if (getScrollY() > 0) return;

  startY   = e.touches[0].clientY;
  currentY = 0;
  pulling  = false;
}

function onTouchMove(e: TouchEvent): void {
  if (refreshing) return;

  const touchY = e.touches[0].clientY;
  const deltaY = touchY - startY;

  // Only handle pull gesture when at the very top of the page.
  if (getScrollY() > 0) {
    // User has scrolled down — cancel any active pull and allow normal scrolling.
    if (pulling) {
      pulling = false;
      resetIndicator();
    }
    return;
  }

  if (deltaY <= 0) {
    // Scrolling up or no movement — cancel pull and allow normal scroll.
    if (pulling) {
      pulling = false;
      resetIndicator();
    }
    return;
  }

  // We are at the top and pulling downward — take over the gesture.
  pulling  = true;
  currentY = deltaY;

  // Only preventDefault when we are actively handling the pull.
  // This allows normal upward scrolling to work when not pulling.
  e.preventDefault();

  const progress = Math.min(currentY / RESISTANCE / THRESHOLD, 1);
  setIndicatorProgress(progress);
}

function onTouchEnd(): void {
  if (!pulling) return;

  pulling = false;

  if (currentY / RESISTANCE >= THRESHOLD) {
    // Pull was far enough — trigger a reload.
    refreshing = true;
    setRefreshing();
    // Small delay so the refreshing animation is visible before reload.
    setTimeout(() => window.location.reload(), 300);
  } else {
    // Not far enough — snap back.
    resetIndicator();
  }

  currentY = 0;
}
