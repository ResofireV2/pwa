import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Page from 'flarum/common/components/Page';
import { openDB } from 'idb';

const DB_NAME    = 'keyval-store';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

app.initializers.add('resofire-pwa', () => {

  extend(Page.prototype, 'oninit', function () {
    const basePath = (app.forum.attribute<string>('basePath') || '').replace(/\/$/, '');

    registerServiceWorker(basePath);
  });

  extend(Page.prototype, 'oncreate', function () {
    notifyPageVisit();
  });

});

// ── Service worker registration ───────────────────────────────────────────────

async function registerServiceWorker(basePath: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Write the forum payload to IDB so the SW can read it.
    await writeForumPayload();

    const registration = await navigator.serviceWorker.register(
      basePath + '/sw',
      { scope: basePath + '/' }
    );

    await navigator.serviceWorker.ready;

    // Send the payload directly to the active SW via postMessage as well,
    // so an already-running SW picks up changes without a reinstall.
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({
        type: 'FORUM_PAYLOAD',
        payload: app.forum.data.attributes,
      });
    }
  } catch (e) {
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
  } catch (e) {
    // IDB write failure should never break the forum.
  }
}

// ── Page visit tracking ───────────────────────────────────────────────────────

function notifyPageVisit(): void {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return;

  const title = document.title;
  const url   = window.location.href;

  // Only track forum discussion and tag pages — skip admin, login, etc.
  if (!title || !url) return;

  controller.postMessage({
    type:  'PAGE_VISIT',
    url:   url,
    title: title,
  });
}
