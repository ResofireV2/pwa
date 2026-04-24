import Component, { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type Stream from 'flarum/common/utils/Stream';

export interface ISplashPreviewAttrs extends ComponentAttrs {
  bgColor: Stream<string>;
  logoBgEnabled: Stream<string>;
  logoBgColor: Stream<string>;
  appName: Stream<string>;
}

type PreviewMode = 'splash' | 'home';

export default class SplashPreview extends Component<ISplashPreviewAttrs> {
  mode: PreviewMode = 'splash';

  view(): Mithril.Children {
    const bg          = this.validColor(this.attrs.bgColor()) || '#1a3a5c';
    const v         = this.attrs.logoBgEnabled();
    const useLogoBg = !!v && v !== '0';
    const logoBg      = useLogoBg ? (this.validColor(this.attrs.logoBgColor()) || bg) : bg;
    const appName     = this.attrs.appName() || 'My Community';
    const nameColor   = this.textColorFor(bg);
    const iconColor   = this.textColorFor(logoBg);
    const contrast    = this.contrastRatio(bg, iconColor);

    return (
      <div className="SplashPreview">
        <p className="SplashPreview-label">{app.translator.trans('resofire-pwa.admin.general.preview_label') as string}</p>

        <div className="SplashPreview-tabs">
          <button
            className={'SplashPreview-tab' + (this.mode === 'splash' ? ' is-active' : '')}
            onclick={() => { this.mode = 'splash'; m.redraw(); }}
          >
            Splash
          </button>
          <button
            className={'SplashPreview-tab' + (this.mode === 'home' ? ' is-active' : '')}
            onclick={() => { this.mode = 'home'; m.redraw(); }}
          >
            Home screen
          </button>
        </div>

        <div className="SplashPreview-phone">
          <div className="SplashPreview-frame">
            <div className="SplashPreview-notch" />

            {this.mode === 'splash' && (
              <>
                <div
                  className="SplashPreview-statusbar"
                  style={{ backgroundColor: bg }}
                />
                <div
                  className="SplashPreview-screen"
                  style={{ backgroundColor: bg }}
                >
                  <div
                    className="SplashPreview-logo"
                    style={{
                      backgroundColor: useLogoBg && logoBg !== bg ? logoBg : 'transparent',
                      borderRadius: useLogoBg && logoBg !== bg ? '12px' : '0',
                    }}
                  >
                    <i className="fas fa-mobile-alt" style={{ color: iconColor }} />
                  </div>
                  <div
                    className="SplashPreview-name"
                    style={{ color: nameColor }}
                  >
                    {appName}
                  </div>
                </div>
                <div className="SplashPreview-homebar">
                  <div className="SplashPreview-homebar-pill" />
                </div>
              </>
            )}

            {this.mode === 'home' && (
              <div style={{ backgroundColor: '#f0f0f0', height: '338px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="SplashPreview-homeicon">
                  <div
                    className="SplashPreview-homeicon-icon"
                    style={{ backgroundColor: bg }}
                  >
                    <i className="fas fa-mobile-alt" style={{ color: iconColor }} />
                  </div>
                  <div className="SplashPreview-homeicon-label">{appName}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="SplashPreview-hint">
          {this.mode === 'splash'
            ? 'Shown for 2–3s on launch'
            : 'Home screen icon'}
        </p>

        <div className="SplashPreview-contrast">
          <div
            className="SplashPreview-contrast-dot"
            style={{ backgroundColor: this.contrastColor(contrast) }}
          />
          <span>{this.contrastLabel(contrast)}</span>
        </div>
      </div>
    );
  }

  private validColor(value: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '';
  }

  private getLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  private textColorFor(hex: string): string {
    if (!this.validColor(hex)) return '#ffffff';
    return this.getLuminance(hex) > 0.35 ? '#111111' : '#ffffff';
  }

  private contrastRatio(hex1: string, hex2: string): number {
    if (!this.validColor(hex1) || !this.validColor(hex2)) return 21;
    const l1 = this.getLuminance(hex1);
    const l2 = this.getLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  private contrastColor(ratio: number): string {
    if (ratio >= 7)   return '#22c55e';
    if (ratio >= 4.5) return '#f59e0b';
    return '#ef4444';
  }

  private contrastLabel(ratio: number): string {
    const r = ratio.toFixed(1);
    if (ratio >= 7)   return `Excellent contrast (${r}:1)`;
    if (ratio >= 4.5) return `Good contrast (${r}:1)`;
    return `Low contrast (${r}:1) — consider adjusting`;
  }
}
