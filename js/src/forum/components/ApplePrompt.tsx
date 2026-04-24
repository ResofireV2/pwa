import app from 'flarum/forum/app';
import Component, { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { dismissBanner } from '../utils/install-state';

export interface IApplePromptAttrs extends ComponentAttrs {
  onDismiss: () => void;
}

type ArrowDirection = 'up' | 'down';

export default class ApplePrompt extends Component<IApplePromptAttrs> {
  visible = false;
  private arrowDir: ArrowDirection = 'down';
  private orientationHandler: (() => void) | null = null;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;

  oninit(vnode: Mithril.Vnode<IApplePromptAttrs, this>): void {
    super.oninit(vnode);

    const delay = app.forum.attribute<number>('resofire-pwa.iosPromptDelay') ?? 10000;

    this.delayTimer = setTimeout(() => {
      this.visible = true;
      this.updateArrow();
      m.redraw();
    }, delay);
  }

  oncreate(vnode: Mithril.VnodeDOM<IApplePromptAttrs, this>): void {
    super.oncreate(vnode);

    this.orientationHandler = () => {
      this.updateArrow();
      m.redraw();
    };

    window.addEventListener('orientationchange', this.orientationHandler);
    window.addEventListener('resize', this.orientationHandler);
  }

  onremove(): void {
    if (this.delayTimer !== null) clearTimeout(this.delayTimer);
    if (this.orientationHandler) {
      window.removeEventListener('orientationchange', this.orientationHandler);
      window.removeEventListener('resize', this.orientationHandler);
    }
  }

  view(): Mithril.Children {
    if (!this.visible) return null;

    const appName = app.forum.attribute<string>('resofire-pwa.appName')
      || app.forum.attribute<string>('title')
      || '';

    const customText = app.forum.attribute<string>('resofire-pwa.iosPromptText') || '';

    const promptText = customText
      ? customText.replace('{appName}', appName)
      : app.translator.trans('resofire-pwa.forum.apple.prompt_text', { appName }) as string;

    return (
      <div className={'PWA-apple' + (this.arrowDir === 'up' ? ' PWA-apple--arrow-up' : ' PWA-apple--arrow-down')}>
        <div className="PWA-apple-body">
          <div className="PWA-apple-icon">
            <i className="fas fa-share-square" />
          </div>
          <p className="PWA-apple-text">{promptText}</p>
        </div>

        <button
          className="PWA-apple-dismiss"
          aria-label={app.translator.trans('resofire-pwa.forum.apple.dismiss') as string}
          onclick={this.onDismiss.bind(this)}
        >
          <i className="fas fa-times" />
        </button>

        <div className={'PWA-apple-arrow PWA-apple-arrow--' + this.arrowDir} />
      </div>
    );
  }

  /**
   * Determine whether Safari's share button is at the top or bottom
   * of the screen for the current device and orientation.
   *
   * Rules:
   * - iPad: always top (iosPadAlwaysUp setting)
   * - iPhone portrait: share button is at the bottom toolbar → arrow down
   * - iPhone landscape: share button moves to the top → arrow up
   */
  private updateArrow(): void {
    const isPad = /iPad/.test(navigator.userAgent)
      || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

    const autoDetect = app.forum.attribute<boolean>('resofire-pwa.iosAutoDetectOrientation') ?? true;
    const padAlwaysUp = app.forum.attribute<boolean>('resofire-pwa.iosPadAlwaysUp') ?? true;

    if (isPad && padAlwaysUp) {
      this.arrowDir = 'up';
      return;
    }

    if (!autoDetect) {
      this.arrowDir = 'down';
      return;
    }

    // Portrait: window.innerHeight > window.innerWidth
    const isPortrait = window.innerHeight > window.innerWidth;
    this.arrowDir = isPortrait ? 'down' : 'up';
  }

  private onDismiss(): void {
    this.visible = false;
    dismissBanner();
    this.attrs.onDismiss();
    m.redraw();
  }
}
