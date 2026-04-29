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
 *  - The touch did not start inside a scrollable inner container
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
 * is tracking it. On iOS Safari, body { overflow-x: hidden } (used by some
 * themes) can cause window.scrollY to always report 0 while the actual scroll
 * is tracked on documentElement or body.
 */
function getScrollY(): number {
  return Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  );
}

/**
 * Returns true if the element or any of its ancestors (up to body) is a
 * scrollable container with actual scrollable content. Used to avoid
 * interfering with inner scroll areas like a chat message stream.
 */
function isInsideScrollableContainer(target: EventTarget | null): boolean {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    const overflowY = window.getComputedStyle(el).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

// ── State ──────────────────────────────────────────────────────────────────────

let startY     = 0;
let currentY   = 0;
let canPull    = false;  // Set true only when touchstart passes all checks
let pulling    = false;  // Set true only when a downward pull is in progress
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
  indicator.style.transform = `translateY(${Math.min(currentY / RESISTANCE, MAX_PULL)}px)`;
  indicator.style.opacity   = String(Math.min(progress, 1));
  indicator.classList.toggle('is-ready', progress >= 1);
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
  // Reset state on every new touch.
  canPull  = false;
  pulling  = false;
  startY   = 0;
  currentY = 0;

  if (refreshing) return;
  if (getScrollY() > 0) return;
  if (isInsideScrollableContainer(e.target)) return;

  // All conditions pass — this touch is eligible for PTR.
  startY  = e.touches[0].clientY;
  canPull = true;
}

function onTouchMove(e: TouchEvent): void {
  // If touchstart didn't qualify, ignore all move events for this gesture.
  if (!canPull || refreshing) return;

  const touchY = e.touches[0].clientY;
  const deltaY = touchY - startY;

  // If the page has scrolled since touchstart (shouldn't happen but safety check),
  // cancel the pull.
  if (getScrollY() > 0) {
    canPull = false;
    pulling = false;
    resetIndicator();
    return;
  }

  if (deltaY <= 0) {
    // User is scrolling up or laterally — not a pull.
    if (pulling) {
      pulling = false;
      resetIndicator();
    }
    return;
  }

  // Confirmed downward pull from the top — take over the gesture.
  pulling  = true;
  currentY = deltaY;

  // Block default scroll behaviour only while we are handling the pull.
  e.preventDefault();

  const progress = (currentY / RESISTANCE) / THRESHOLD;
  setIndicatorProgress(progress);
}

function onTouchEnd(): void {
  if (!pulling) return;

  pulling = false;
  canPull = false;

  if (currentY / RESISTANCE >= THRESHOLD) {
    refreshing = true;
    setRefreshing();
    setTimeout(() => window.location.reload(), 300);
  } else {
    resetIndicator();
  }

  currentY = 0;
}
