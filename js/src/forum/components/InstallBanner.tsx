import app from 'flarum/forum/app';
import Component, { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { dismissBanner, markInstalled } from '../utils/install-state';

export interface IInstallBannerAttrs extends ComponentAttrs {
  deferredPrompt: any;
  onInstall: () => void;
  onDismiss: () => void;
}

export default class InstallBanner extends Component<IInstallBannerAttrs> {
  view(): Mithril.Children {
    const appName   = app.forum.attribute<string>('resofire-pwa.appName')
      || app.forum.attribute<string>('title')
      || '';

    const bannerText = app.forum.attribute<string>('resofire-pwa.androidBannerText')
      || app.translator.trans('resofire-pwa.forum.banner.text', { appName }) as string;

    const installText = app.forum.attribute<string>('resofire-pwa.androidInstallText')
      || app.translator.trans('resofire-pwa.forum.banner.install') as string;

    return (
      <div className="PWA-banner">
        <div className="PWA-banner-body">
          <span className="PWA-banner-text">{bannerText}</span>
          <button
            className="PWA-banner-install Button Button--primary Button--small"
            onclick={this.onInstall.bind(this)}
          >
            {installText}
          </button>
        </div>
        <button
          className="PWA-banner-dismiss"
          aria-label={app.translator.trans('resofire-pwa.forum.banner.dismiss') as string}
          onclick={this.onDismiss.bind(this)}
        >
          <i className="fas fa-times" />
        </button>
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
      }
    });
  }

  private onDismiss(): void {
    dismissBanner();
    this.attrs.onDismiss();
  }
}
