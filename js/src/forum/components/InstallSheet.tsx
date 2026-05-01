import app from 'flarum/forum/app';
import Component, { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { markInstalled, markSheetSeen } from '../utils/install-state';

export interface IInstallSheetAttrs extends ComponentAttrs {
  deferredPrompt: any;
  onInstall: () => void;
  onDismiss: () => void;
}

export default class InstallSheet extends Component<IInstallSheetAttrs> {
  visible = false;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;

  oninit(vnode: Mithril.Vnode<IInstallSheetAttrs, this>): void {
    super.oninit(vnode);

    const delay = app.forum.attribute<number>('resofire-pwa.androidSheetDelay') ?? 1500;

    this.delayTimer = setTimeout(() => {
      this.visible = true;
      markSheetSeen();
      m.redraw();
    }, delay);
  }

  onremove(): void {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
    }
  }

  view(): Mithril.Children {
    const appName = app.forum.attribute<string>('resofire-pwa.appName')
      || app.forum.attribute<string>('title')
      || '';

    const showPush       = app.forum.attribute<boolean>('resofire-pwa.androidSheetFeaturePush')       ?? true;
    const showFullscreen = app.forum.attribute<boolean>('resofire-pwa.androidSheetFeatureFullscreen') ?? true;

    const features: { icon: string; label: string }[] = [];
    if (showPush)       features.push({ icon: 'fas fa-bell',    label: app.translator.trans('resofire-pwa.forum.sheet.feature_push')       as string });
    if (showFullscreen) features.push({ icon: 'fas fa-expand',  label: app.translator.trans('resofire-pwa.forum.sheet.feature_fullscreen') as string });

    return (
      <div className={'PWA-sheet-backdrop' + (this.visible ? ' is-visible' : '')}
        onclick={this.onBackdropClick.bind(this)}
      >
        <div
          className={'PWA-sheet' + (this.visible ? ' is-visible' : '')}
          onclick={(e: Event) => e.stopPropagation()}
        >
          <div className="PWA-sheet-handle" />

          <div className="PWA-sheet-header">
            <div className="PWA-sheet-icon">
              {app.forum.attribute<string>('resofire-pwa.icon192Url')
                ? <img src={app.forum.attribute<string>('resofire-pwa.icon192Url')} className="PWA-sheet-icon-img" alt="" />
                : <i className="fas fa-mobile-alt" />
              }
            </div>
            <div className="PWA-sheet-title">
              {app.translator.trans('resofire-pwa.forum.sheet.title', { appName })}
            </div>
            <div className="PWA-sheet-subtitle">
              {app.translator.trans('resofire-pwa.forum.sheet.subtitle')}
            </div>
          </div>

          {features.length > 0 && (
            <ul className="PWA-sheet-features">
              {features.map((f, i) => (
                <li key={i} className="PWA-sheet-feature">
                  <div className="PWA-sheet-feature-icon">
                    <i className={f.icon} />
                  </div>
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="PWA-sheet-actions">
            <button
              className="Button Button--primary PWA-sheet-btn-install"
              onclick={this.onInstall.bind(this)}
            >
              {app.translator.trans('resofire-pwa.forum.sheet.install')}
            </button>
            <button
              className="Button PWA-sheet-btn-later"
              onclick={this.onDismiss.bind(this)}
            >
              {app.translator.trans('resofire-pwa.forum.sheet.not_now')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  private onInstall(): void {
    const { deferredPrompt, onInstall } = this.attrs;

    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choice: { outcome: string }) => {
      if (choice.outcome === 'accepted') {
        markInstalled();
        onInstall();
      } else {
        this.hide();
      }
    });
  }

  private onDismiss(): void {
    this.hide();
    this.attrs.onDismiss();
  }

  private onBackdropClick(): void {
    this.hide();
    this.attrs.onDismiss();
  }

  private hide(): void {
    this.visible = false;
    m.redraw();
  }
}
