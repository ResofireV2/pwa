import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Page from 'flarum/common/components/Page';
import Notices from 'flarum/forum/components/Notices';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import InstallBanner from './components/InstallBanner';
import InstallSheet from './components/InstallSheet';
import ApplePrompt from './components/ApplePrompt';
import PushModal, { subscribeUserToPush } from './components/PushModal';
import { initPullToRefresh } from './utils/pull-to-refresh';
import {
  isStandalone,
  isIOS,
  isMobile,
  isSafari,
  isFirstVisit,
  isSecondVisit,
  markVisited,
  isBannerDismissed,
  isInstalled,
} from './utils/install-state';

const PUSH_PROMPTED_KEY = 'pwa.push.prompted';

// Captured beforeinstallprompt event.
let deferredPrompt: any = null;

// Banner/sheet visibility.
let showBanner = false;
let showSheet  = false;

app.initializers.add('resofire-pwa', () => {

  // ── Pull to refresh (iOS standalone only) ────────────────────────────────
  initPullToRefresh();

  // ── beforeinstallprompt ──────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    evaluatePrompts();
    m.redraw();
  });

  // ── Page lifecycle ───────────────────────────────────────────────────────
  extend(Page.prototype, 'oninit', function () {
    const basePath = (app.forum.attribute<string>('basePath') || '').replace(/\/$/, '');
    registerServiceWorker(basePath);
    evaluatePrompts();

    // Re-subscribe to push if permission was previously granted.
    if (app.session.user && 'Notification' in window && Notification.permission === 'granted') {
      if (app.forum.attribute<string>('resofire-pwa.vapidPublicKey')) {
        subscribeUserToPush().catch(() => {});
      }
    }
  });

  extend(Page.prototype, 'oncreate', function () {
    // Show push modal on first standalone launch only.
    if (isStandalone()) {
      maybeShowPushModal();
    }
  });

  // ── Install banner in Notices ────────────────────────────────────────────
  extend(Notices.prototype, 'items', function (items: ItemList<Mithril.Children>) {
    if (!showBanner) return;

    items.add(
      'pwa-install-banner',
      <InstallBanner
        deferredPrompt={deferredPrompt}
        onInstall={onInstallAccepted}
        onDismiss={onBannerDismissed}
      />,
      -100
    );
  });

  // ── Push notification column in NotificationGrid ─────────────────────────
  // Use the string path form — NotificationGrid is not in flarum.reg directly
  // but is resolvable via flarum.reg.onLoad when SettingsPage loads it.
  extend('flarum/forum/components/NotificationGrid', 'notificationMethods', function (items: ItemList<any>) {
    if (!app.forum.attribute<string>('resofire-pwa.vapidPublicKey')) return;

    items.add('push', {
      name:  'push',
      icon:  'fas fa-mobile-alt',
      label: app.translator.trans('resofire-pwa.forum.push.notification_column'),
    });
  });

});

// ── Push modal ────────────────────────────────────────────────────────────────

function isPushPrompted(): boolean {
  try { return localStorage.getItem(PUSH_PROMPTED_KEY) === '1'; } catch { return false; }
}

function markPushPrompted(): void {
  try { localStorage.setItem(PUSH_PROMPTED_KEY, '1'); } catch {}
}

function maybeShowPushModal(): void {
  if (!app.session.user) return;
  if (isPushPrompted()) return;
  if (!app.forum.attribute<string>('resofire-pwa.vapidPublicKey')) return;
  if (!app.forum.attribute<boolean>('resofire-pwa.pushPromptEnabled')) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'default') return;

  const delay = app.forum.attribute<number>('resofire-pwa.pushPromptDelay') ?? 2000;

  setTimeout(() => {
    if (!document.getElementById('pwa-push-modal')) {
      const container = document.createElement('div');
      container.id = 'pwa-push-modal';
      document.body.appendChild(container);

      const unmount = () => {
        m.mount(container, null);
        container.remove();
      };

      m.mount(container, {
        view: () => m(PushModal, {
          onAccept:  () => { markPushPrompted(); unmount(); m.redraw(); },
          onDecline: () => { markPushPrompted(); unmount(); },
        }),
      });
    }
  }, delay);
}

// ── Prompt evaluation ─────────────────────────────────────────────────────────

function evaluatePrompts(): void {
  if (isStandalone() || isInstalled()) {
    showBanner = false;
    showSheet  = false;
    return;
  }

  if (isIOS()) {
    if (isSafari() && !isBannerDismissed()) {
      mountApplePrompt();
    }
    return;
  }

  // Banner and sheet are for mobile Android only.
  // Desktop users have the browser's own install button in the address bar.
  if (!isMobile()) return;

  if (!deferredPrompt) return;

  const bannerEnabled = app.forum.attribute<boolean>('resofire-pwa.androidBannerEnabled') ?? true;
  const sheetEnabled  = app.forum.attribute<boolean>('resofire-pwa.androidSheetEnabled')  ?? true;

  if (isBannerDismissed()) {
    showBanner = false;
    showSheet  = false;
    return;
  }

  if (!bannerEnabled) return;

  showBanner = true;

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
      onInstall: onInstallAccepted,
      onDismiss: () => {
        onSheetDismissed();
        m.mount(container, null);
        container.remove();
      },
    }),
  });
}

function mountApplePrompt(): void {
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
    await navigator.serviceWorker.register(
      basePath + '/sw',
      { scope: basePath + '/' }
    );

    await navigator.serviceWorker.ready;

    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({
        type:    'FORUM_PAYLOAD',
        payload: {
          ...app.forum.data.attributes,
          isStandalone: isStandalone(),
        },
      });
    }
  } catch {
    // SW registration failure should never break the forum.
  }
}


