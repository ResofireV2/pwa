import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Page from 'flarum/common/components/Page';
import Notices from 'flarum/forum/components/Notices';
import { openDB } from 'idb';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import InstallBanner from './components/InstallBanner';
import InstallSheet from './components/InstallSheet';
import ApplePrompt from './components/ApplePrompt';
import {
  isStandalone,
  isIOS,
  isSafari,
  isFirstVisit,
  isSecondVisit,
  markVisited,
  isBannerDismissed,
  isInstalled,
} from './utils/install-state';

const DB_NAME    = 'keyval-store';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

// Captured beforeinstallprompt event — holds the deferred install prompt.
let deferredPrompt: any = null;

// Whether the banner/sheet should be showing right now.
let showBanner = false;
let showSheet  = false;

app.initializers.add('resofire-pwa', () => {

  // ── Capture the browser's install prompt (Android Chrome/Edge only) ──────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Re-evaluate visibility now that we have a prompt.
    evaluatePrompts();
    m.redraw();
  });

  // ── Extend Page.oninit for SW registration and first-visit tracking ──────
  extend(Page.prototype, 'oninit', function () {
    const basePath = (app.forum.attribute<string>('basePath') || '').replace(/\/$/, '');
    registerServiceWorker(basePath);
    evaluatePrompts();
  });

  // ── Track page visits for the offline page recent list ──────────────────
  extend(Page.prototype, 'oncreate', function () {
    notifyPageVisit();
  });

  // ── Inject install banner into Notices ───────────────────────────────────
  extend(Notices.prototype, 'items', function (items: ItemList<Mithril.Children>) {
    if (!showBanner) return;

    items.add(
      'pwa-install-banner',
      <InstallBanner
        deferredPrompt={deferredPrompt}
        onInstall={onInstallAccepted}
        onDismiss={onBannerDismissed}
      />,
      -100  // low priority = renders below other notices
    );
  });

});

// ── Prompt evaluation ─────────────────────────────────────────────────────────

function evaluatePrompts(): void {
  // Suppress everything when already installed or running standalone.
  if (isStandalone() || isInstalled()) {
    showBanner = false;
    showSheet  = false;
    return;
  }

  // iOS: handle separately with the Apple prompt, not the banner/sheet.
  if (isIOS()) {
    if (isSafari() && !isBannerDismissed()) {
      mountApplePrompt();
    }
    return;
  }

  // Android / desktop: requires deferredPrompt to have fired.
  if (!deferredPrompt) return;

  const bannerEnabled = app.forum.attribute<boolean>('resofire-pwa.androidBannerEnabled') ?? true;
  const sheetEnabled  = app.forum.attribute<boolean>('resofire-pwa.androidSheetEnabled')  ?? true;

  if (isBannerDismissed()) {
    showBanner = false;
    showSheet  = false;
    return;
  }

  if (!bannerEnabled) return;

  // Banner shows from first visit onwards (until dismissed or installed).
  showBanner = true;

  // Sheet shows on second visit, once.
  if (sheetEnabled && isSecondVisit()) {
    showSheet = true;
    mountInstallSheet();
  }

  markVisited();
}

// ── Install event handlers ────────────────────────────────────────────────────

function onInstallAccepted(): void {
  showBanner = false;
  showSheet  = false;
  m.redraw();
}

function onBannerDismissed(): void {
  showBanner = false;
  showSheet  = false;
  m.redraw();
}

function onSheetDismissed(): void {
  // Sheet dismissed with "Not now" — banner persists.
  showSheet = false;
  m.redraw();
}

// ── Mount overlay components ──────────────────────────────────────────────────

function mountInstallSheet(): void {
  if (!deferredPrompt) return;

  const container = document.createElement('div');
  container.id = 'pwa-install-sheet';
  document.body.appendChild(container);

  m.mount(container, {
    view: () => m(InstallSheet, {
      deferredPrompt,
      onInstall:  onInstallAccepted,
      onDismiss:  () => {
        onSheetDismissed();
        // Unmount and remove the container when done.
        m.mount(container, null);
        container.remove();
      },
    }),
  });
}

function mountApplePrompt(): void {
  // Only mount once.
  if (document.getElementById('pwa-apple-prompt')) return;

  const container = document.createElement('div');
  container.id = 'pwa-apple-prompt';
  document.body.appendChild(container);

  m.mount(container, {
    view: () => m(ApplePrompt, {
      onDismiss: () => {
        m.mount(container, null);
        container.remove();
      },
    }),
  });
}

// ── Service worker registration ───────────────────────────────────────────────

async function registerServiceWorker(basePath: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    await writeForumPayload();

    await navigator.serviceWorker.register(
      basePath + '/sw',
      { scope: basePath + '/' }
    );

    await navigator.serviceWorker.ready;

    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({
        type:    'FORUM_PAYLOAD',
        payload: app.forum.data.attributes,
      });
    }
  } catch {
    // SW registration failure should never break the forum.
  }
}

// ── IDB helpers ───────────────────────────────────────────────────────────────

async function writeForumPayload(): Promise<void> {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });

    await db.put(STORE_NAME, app.forum.data.attributes, 'flarum.forumPayload');
  } catch {
    // IDB write failure should never break the forum.
  }
}

// ── Page visit tracking ───────────────────────────────────────────────────────

function notifyPageVisit(): void {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return;

  const title = document.title;
  const url   = window.location.href;

  if (!title || !url) return;

  controller.postMessage({ type: 'PAGE_VISIT', url, title });
}
