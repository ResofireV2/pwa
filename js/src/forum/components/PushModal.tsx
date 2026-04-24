import app from 'flarum/forum/app';
import Component, { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';

export interface IPushModalAttrs extends ComponentAttrs {
  onAccept: () => void;
  onDecline: () => void;
}

export default class PushModal extends Component<IPushModalAttrs> {
  requesting = false;

  view(): Mithril.Children {
    const title = app.forum.attribute<string>('resofire-pwa.pushPromptTitle')
      || app.translator.trans('resofire-pwa.forum.push.modal_title') as string;

    const body = app.forum.attribute<string>('resofire-pwa.pushPromptBody')
      || app.translator.trans('resofire-pwa.forum.push.modal_body') as string;

    return (
      <div className="PWA-push-backdrop">
        <div className="PWA-push-modal">
          <div className="PWA-push-modal-icon">
            <i className="fas fa-bell" />
          </div>

          <h3 className="PWA-push-modal-title">{title}</h3>
          <p className="PWA-push-modal-body">{body}</p>

          <div className="PWA-push-modal-actions">
            <button
              className="Button Button--primary PWA-push-btn-allow"
              disabled={this.requesting}
              onclick={this.onAllow.bind(this)}
            >
              {this.requesting
                ? <i className="fas fa-spinner fa-spin" />
                : app.translator.trans('resofire-pwa.forum.push.allow')}
            </button>
            <button
              className="Button PWA-push-btn-decline"
              disabled={this.requesting}
              onclick={this.attrs.onDecline}
            >
              {app.translator.trans('resofire-pwa.forum.push.decline')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  private async onAllow(): Promise<void> {
    this.requesting = true;
    m.redraw();

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        await subscribeUserToPush();
        this.attrs.onAccept();
      } else {
        this.attrs.onDecline();
      }
    } catch {
      this.attrs.onDecline();
    } finally {
      this.requesting = false;
      m.redraw();
    }
  }
}

/**
 * Subscribe the current user to Web Push and save the subscription server-side.
 */
export async function subscribeUserToPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;

  const vapidPublicKey = app.forum.attribute<string>('resofire-pwa.vapidPublicKey');
  if (!vapidPublicKey) return;

  // Convert the url-safe base64 public key to a Uint8Array.
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: applicationServerKey,
    });
  }

  await app.request({
    method: 'POST',
    url:    `${app.forum.attribute('apiUrl')}/resofire-pwa/push`,
    body:   { subscription: subscription.toJSON() },
  });
}

/**
 * Unsubscribe the current device from Web Push and remove server-side.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await app.request({
    method: 'DELETE',
    url:    `${app.forum.attribute('apiUrl')}/resofire-pwa/push`,
    body:   { endpoint },
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
