import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import FieldSet from 'flarum/common/components/FieldSet';
import type Mithril from 'mithril';
import SplashPreview from './SplashPreview';

const PREFIX = 'resofire-pwa';

type Tab = 'general' | 'icons' | 'android' | 'apple' | 'push' | 'status';

function tr(key: string): string {
  return app.translator.trans(`${PREFIX}.admin.${key}`) as string;
}

export default class PWAPage extends ExtensionPage {
  activeTab: Tab = 'general';

  content(): Mithril.Children {
    const tabs: { key: Tab; icon: string; label: string }[] = [
      { key: 'general', icon: 'fas fa-cog',         label: tr('tabs.general')  },
      { key: 'icons',   icon: 'fas fa-image',        label: tr('tabs.icons')   },
      { key: 'android', icon: 'fab fa-android',      label: tr('tabs.android') },
      { key: 'apple',   icon: 'fab fa-apple',        label: tr('tabs.apple')   },
      { key: 'push',    icon: 'fas fa-bell',         label: tr('tabs.push')    },
      { key: 'status',  icon: 'fas fa-check-circle', label: tr('tabs.status')  },
    ];

    return (
      <div className="PWAPage">
        <div className="PWAPage-tabs">
          {tabs.map(({ key, icon, label }) => (
            <button
              key={key}
              className={'PWAPage-tab' + (this.activeTab === key ? ' is-active' : '')}
              onclick={() => { this.activeTab = key; m.redraw(); }}
            >
              <i className={icon} />
              {label}
            </button>
          ))}
        </div>

        <div className="PWAPage-content">
          {this.activeTab === 'general' && this.renderGeneral()}
          {this.activeTab === 'icons'   && this.renderIcons()}
          {this.activeTab === 'android' && this.renderAndroid()}
          {this.activeTab === 'apple'   && this.renderApple()}
          {this.activeTab === 'push'    && this.renderPush()}
          {this.activeTab === 'status'  && this.renderStatus()}

          {this.activeTab !== 'status' && (
            <div className="Form-group Form-controls">
              {this.submitButton()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── General ─────────────────────────────────────────────────────────────────

  private renderGeneral(): Mithril.Children {
    return (
      <div className="PWAPage-general">
        <div className="PWAPage-general-settings">
          <FieldSet label={tr('general.identity_heading')}>
            {this.buildSettingComponent({
              setting: `${PREFIX}.longName`,
              label: tr('general.long_name_label'),
              help:  tr('general.long_name_help'),
              type:  'text',
              placeholder: app.data.settings['forum_title'] || '',
            })}
            {this.buildSettingComponent({
              setting: `${PREFIX}.shortName`,
              label: tr('general.short_name_label'),
              help:  tr('general.short_name_help'),
              type:  'text',
            })}
            {this.buildSettingComponent({
              setting: `${PREFIX}.startUrl`,
              label: tr('general.start_url_label'),
              help:  tr('general.start_url_help'),
              type:  'text',
            })}
          </FieldSet>

          <FieldSet label={tr('general.appearance_heading')}>
            {this.buildSettingComponent({
              setting: `${PREFIX}.themeColor`,
              label: tr('general.theme_color_label'),
              help:  tr('general.theme_color_help'),
              type:  'color-preview',
            })}
            {this.buildSettingComponent({
              setting: `${PREFIX}.backgroundColor`,
              label: tr('general.background_color_label'),
              help:  tr('general.background_color_help'),
              type:  'color-preview',
            })}
            {this.buildSettingComponent({
              setting: `${PREFIX}.useLogoBackground`,
              label: tr('general.use_logo_background_label'),
              help:  tr('general.use_logo_background_help'),
              type:  'bool',
            })}
            {this.setting(`${PREFIX}.useLogoBackground`)() === '1' &&
              this.buildSettingComponent({
                setting: `${PREFIX}.logoBackgroundColor`,
                label: tr('general.logo_background_color_label'),
                help:  tr('general.logo_background_color_help'),
                type:  'color-preview',
              })
            }
          </FieldSet>

          <FieldSet label={tr('general.behavior_heading')}>
            {this.buildSettingComponent({
              setting: `${PREFIX}.forcePortrait`,
              label: tr('general.force_portrait_label'),
              help:  tr('general.force_portrait_help'),
              type:  'bool',
            })}
            {this.buildSettingComponent({
              setting: `${PREFIX}.windowControlsOverlay`,
              label: tr('general.window_controls_overlay_label'),
              help:  tr('general.window_controls_overlay_help'),
              type:  'bool',
            })}
          </FieldSet>
        </div>

        <div className="PWAPage-general-preview">
          <SplashPreview
            bgColor={this.setting(`${PREFIX}.backgroundColor`)}
            logoBgEnabled={this.setting(`${PREFIX}.useLogoBackground`)}
            logoBgColor={this.setting(`${PREFIX}.logoBackgroundColor`)}
            appName={this.setting(`${PREFIX}.longName`)}
          />
        </div>
      </div>
    );
  }

  // ── Icons ────────────────────────────────────────────────────────────────────

  private renderIcons(): Mithril.Children {
    return (
      <div>
        <FieldSet label={tr('icons.heading')}>
          <p className="helpText">{tr('icons.help')}</p>
          <p className="helpText">{tr('icons.coming_soon')}</p>
        </FieldSet>
      </div>
    );
  }

  // ── Android ──────────────────────────────────────────────────────────────────

  private renderAndroid(): Mithril.Children {
    const bannerOn = this.setting(`${PREFIX}.androidBannerEnabled`)() === '1';
    const sheetOn  = this.setting(`${PREFIX}.androidSheetEnabled`)()  === '1';

    return (
      <div>
        <FieldSet label={tr('android.banner_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.androidBannerEnabled`,
            label: tr('android.banner_enabled_label'),
            help:  tr('android.banner_enabled_help'),
            type:  'bool',
          })}
          {bannerOn && this.buildSettingComponent({
            setting: `${PREFIX}.androidBannerText`,
            label: tr('android.banner_text_label'),
            help:  tr('android.banner_text_help'),
            type:  'text',
            placeholder: tr('android.banner_text_placeholder'),
          })}
          {bannerOn && this.buildSettingComponent({
            setting: `${PREFIX}.androidInstallText`,
            label: tr('android.install_text_label'),
            help:  tr('android.install_text_help'),
            type:  'text',
            placeholder: tr('android.install_text_placeholder'),
          })}
        </FieldSet>

        <FieldSet label={tr('android.sheet_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.androidSheetEnabled`,
            label: tr('android.sheet_enabled_label'),
            help:  tr('android.sheet_enabled_help'),
            type:  'bool',
          })}
          {sheetOn && this.buildSettingComponent({
            setting: `${PREFIX}.androidSheetDelay`,
            label: tr('android.sheet_delay_label'),
            help:  tr('android.sheet_delay_help'),
            type:  'number',
            min:   0,
          })}
          {sheetOn && this.buildSettingComponent({
            setting: `${PREFIX}.androidSheetFeatureOffline`,
            label: tr('android.sheet_feature_offline_label'),
            type:  'bool',
          })}
          {sheetOn && this.buildSettingComponent({
            setting: `${PREFIX}.androidSheetFeaturePush`,
            label: tr('android.sheet_feature_push_label'),
            type:  'bool',
          })}
          {sheetOn && this.buildSettingComponent({
            setting: `${PREFIX}.androidSheetFeatureFullscreen`,
            label: tr('android.sheet_feature_fullscreen_label'),
            type:  'bool',
          })}
        </FieldSet>
      </div>
    );
  }

  // ── Apple ────────────────────────────────────────────────────────────────────

  private renderApple(): Mithril.Children {
    const promptOn = this.setting(`${PREFIX}.iosPromptEnabled`)() === '1';

    return (
      <div>
        <FieldSet label={tr('apple.prompt_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.iosPromptEnabled`,
            label: tr('apple.prompt_enabled_label'),
            help:  tr('apple.prompt_enabled_help'),
            type:  'bool',
          })}
          {promptOn && this.buildSettingComponent({
            setting: `${PREFIX}.iosPromptText`,
            label: tr('apple.prompt_text_label'),
            help:  tr('apple.prompt_text_help'),
            type:  'text',
            placeholder: tr('apple.prompt_text_placeholder'),
          })}
          {promptOn && this.buildSettingComponent({
            setting: `${PREFIX}.iosPromptDelay`,
            label: tr('apple.prompt_delay_label'),
            help:  tr('apple.prompt_delay_help'),
            type:  'select',
            options: {
              '5000':  tr('apple.delay_5s'),
              '10000': tr('apple.delay_10s'),
              '15000': tr('apple.delay_15s'),
              '30000': tr('apple.delay_30s'),
              '60000': tr('apple.delay_60s'),
            },
            default: '10000',
          })}
        </FieldSet>

        <FieldSet label={tr('apple.orientation_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.iosAutoDetectOrientation`,
            label: tr('apple.auto_detect_orientation_label'),
            help:  tr('apple.auto_detect_orientation_help'),
            type:  'bool',
          })}
          {this.buildSettingComponent({
            setting: `${PREFIX}.iosPadAlwaysUp`,
            label: tr('apple.pad_always_up_label'),
            help:  tr('apple.pad_always_up_help'),
            type:  'bool',
          })}
        </FieldSet>

        <FieldSet label={tr('apple.statusbar_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.statusBarStyle`,
            label: tr('apple.statusbar_label'),
            help:  tr('apple.statusbar_help'),
            type:  'select',
            options: {
              'default':           tr('apple.statusbar_default'),
              'black':             tr('apple.statusbar_black'),
              'black-translucent': tr('apple.statusbar_black_translucent'),
            },
            default: 'default',
          })}
        </FieldSet>
      </div>
    );
  }

  // ── Push Notifications ───────────────────────────────────────────────────────

  private renderPush(): Mithril.Children {
    const promptOn = this.setting(`${PREFIX}.pushPromptEnabled`)() === '1';

    return (
      <div>
        <FieldSet label={tr('push.vapid_heading')}>
          <p className="helpText">{tr('push.vapid_help')}</p>
          <p className="helpText">{tr('push.vapid_coming_soon')}</p>
        </FieldSet>

        <FieldSet label={tr('push.prompt_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.pushPromptEnabled`,
            label: tr('push.prompt_enabled_label'),
            help:  tr('push.prompt_enabled_help'),
            type:  'bool',
          })}
          {promptOn && this.buildSettingComponent({
            setting: `${PREFIX}.pushPromptTitle`,
            label: tr('push.prompt_title_label'),
            help:  tr('push.prompt_title_help'),
            type:  'text',
            placeholder: tr('push.prompt_title_placeholder'),
          })}
          {promptOn && this.buildSettingComponent({
            setting: `${PREFIX}.pushPromptBody`,
            label: tr('push.prompt_body_label'),
            help:  tr('push.prompt_body_help'),
            type:  'text',
            placeholder: tr('push.prompt_body_placeholder'),
          })}
          {promptOn && this.buildSettingComponent({
            setting: `${PREFIX}.pushPromptDelay`,
            label: tr('push.prompt_delay_label'),
            help:  tr('push.prompt_delay_help'),
            type:  'number',
            min:   0,
          })}
        </FieldSet>

        <FieldSet label={tr('push.misc_heading')}>
          {this.buildSettingComponent({
            setting: `${PREFIX}.userMaxSubscriptions`,
            label: tr('push.max_subscriptions_label'),
            help:  tr('push.max_subscriptions_help'),
            type:  'number',
            min:   1,
          })}
          {this.buildSettingComponent({
            setting: `${PREFIX}.debugMode`,
            label: tr('push.debug_label'),
            help:  tr('push.debug_help'),
            type:  'bool',
          })}
        </FieldSet>
      </div>
    );
  }

  // ── Status ───────────────────────────────────────────────────────────────────

  private renderStatus(): Mithril.Children {
    const checks = this.statusChecks();

    return (
      <div className="PWAPage-status-list">
        {checks.map((check, i) => (
          <div key={i} className={`PWAPage-status-item is-${check.type}`}>
            <div className="PWAPage-status-dot" />
            <div className="PWAPage-status-text">
              <div className="PWAPage-status-title">{check.title}</div>
              <div className="PWAPage-status-body">{check.body}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  private statusChecks(): { type: 'ok' | 'warn' | 'err'; title: string; body: string }[] {
    const checks: { type: 'ok' | 'warn' | 'err'; title: string; body: string }[] = [];
    const forumUrl = app.forum.attribute<string>('baseUrl') || '';
    const appName  = this.setting(`${PREFIX}.longName`)() || app.data.settings['forum_title'] || '';

    checks.push(
      forumUrl.startsWith('https://')
        ? { type: 'ok',  title: tr('status.https_ok'),  body: tr('status.https_ok_body')  }
        : { type: 'err', title: tr('status.https_err'), body: tr('status.https_err_body') }
    );

    checks.push(
      appName
        ? { type: 'ok',  title: tr('status.name_ok'),  body: tr('status.name_ok_body')  }
        : { type: 'err', title: tr('status.name_err'), body: tr('status.name_err_body') }
    );

    // Icons and VAPID — both require later stages; always show as pending for now.
    checks.push({ type: 'err', title: tr('status.icons_err'), body: tr('status.icons_err_body') });
    checks.push({ type: 'err', title: tr('status.vapid_err'), body: tr('status.vapid_err_body') });

    return checks;
  }
}
