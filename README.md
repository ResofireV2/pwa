# resofire/pwa

Progressive Web App extension for Flarum 2.x. Turns your forum into an installable app with push notifications, offline support, and a native-feeling experience on Android and iOS.

## Features

- **Web app manifest** — enables installation on Android and desktop
- **Install prompts** — smart Android banner and bottom sheet, iOS Safari share-button guide
- **Push notifications** — native Web Push with VAPID, per-type user preferences, auto-enable on first install
- **Offline page** — branded fallback with recently visited discussions
- **Service worker** — asset caching in standalone mode, transparent in browser
- **Apple touch icons** — automatic `apple-touch-icon` meta tags for iOS home screen
- **Splash screen preview** — live preview in admin while you configure colors

## Requirements

- Flarum `^2.0`
- PHP `^8.3`
- HTTPS (required by browsers for service workers and push)
- `ext-gmp` recommended — improves VAPID key signing performance

## Installation

```bash
composer require resofire/pwa
php flarum migrate
php flarum cache:clear
```

Enable the extension in your Flarum admin panel.

## Configuration

All settings are in **Admin → Extensions → PWA**.

### General tab

| Setting | Description |
|---|---|
| App name | Full name shown on the splash screen and install prompt. Defaults to your forum title. |
| Short name | Label shown under the home screen icon. Keep under 12 characters. |
| Start URL | Page opened when the app launches. Use `/` for the forum home. |
| Theme color | Browser chrome color on Android. Leave empty to use your forum's primary color. |
| Background color | Splash screen background. Leave empty to use your forum's primary color. |
| Use separate logo background | Adds a rounded square behind the icon on the splash screen. |
| Logo background color | Color of the rounded square. Leave empty to use your forum's secondary color. |
| Force portrait orientation | Prevents the app from rotating to landscape. |
| Window controls overlay | Extends content into the title bar area on desktop. Experimental. |

### Icons tab

Upload a single high-resolution source image (recommended: 1024×1024 PNG). The extension automatically generates all required sizes:

| Size | Purpose |
|---|---|
| 512×512 | Manifest install icon |
| 384×384 | Android splash screen |
| 192×192 | Android home screen **(required)** |
| 180×180 | Apple touch icon **(required for iOS)** |
| 152×152 | iPad home screen |
| 144×144 | Windows tile |
| 96×96 | Notification badge |
| 48×48 | Favicon fallback |

The 192×192 and 180×180 sizes must be present for the PWA to be installable.

### Android tab

Controls the install banner and bottom sheet shown to Android users.

- **Install banner** — a slim strip at the top of the page with an Install button
- **Install sheet** — a more prominent bottom sheet shown on the second visit

Both prompts only appear on Android mobile browsers when the browser fires `beforeinstallprompt`. They are never shown on desktop.

### Apple tab

Controls the iOS install prompt, which guides Safari users through the Add to Home Screen flow manually (iOS does not support `beforeinstallprompt`).

| Setting | Description |
|---|---|
| Show install prompt | Enables the iOS share-button guide |
| Prompt text | Custom message shown in the prompt |
| Status bar style | `default`, `black`, or `black-translucent` |
| Auto-detect orientation | Rotates the share arrow to match device orientation |
| Pad content above status bar | Prevents content from appearing behind the status bar |

### Push notifications tab

#### VAPID keys

Generate VAPID keys before push notifications will work. Click **Generate VAPID keys** — this is a one-time operation. Regenerating keys invalidates all existing subscriptions.

#### First-run prompt

When enabled, the installed PWA shows a modal on first launch asking the user to enable notifications. The modal only appears in standalone (installed) mode, never in a browser tab.

When a user enables notifications, push is automatically turned on for the same notification types they already have enabled for alerts or email.

#### Notification grid

Users can fine-tune which notification types trigger a push notification in **Settings → Notifications**. The Push column appears alongside Alert and Email once VAPID keys are configured.

#### Advanced

| Setting | Description |
|---|---|
| Max push subscriptions per user | Oldest subscriptions are removed when this limit is reached. Default: 20. |
| Debug mode | Logs push activity to `storage/logs`. Disable in production. |

### Status tab

Real-time health checks:

- **HTTPS** — push notifications and service workers require a secure context
- **App name** — confirms a name is configured
- **Icons** — checks that the required 192×192 and 180×180 sizes are uploaded
- **Service worker** — confirms the SW is registered and active in the current browser
- **Push notifications** — confirms VAPID keys have been generated

## Push notifications setup checklist

1. Upload icons (Icons tab) — 192×192 and 180×180 are required
2. Generate VAPID keys (Push notifications tab)
3. Enable the first-run prompt if desired
4. Users install the PWA and grant notification permission
5. Users can adjust per-type preferences in their notification settings

## Browser support

| Feature | Chrome Android | Safari iOS | Firefox Android | Desktop Chrome |
|---|---|---|---|---|
| Install prompt | ✓ | Manual (share button) | ✗ | ✓ |
| Push notifications | ✓ | ✓ (iOS 16.4+) | ✓ | ✓ |
| Offline page | ✓ | ✓ | ✓ | ✓ |
| Service worker | ✓ | ✓ | ✓ | ✓ |

## Development

```bash
cd js
npm install
npm run dev     # watch mode
npm run build   # production build
```

## License

MIT
