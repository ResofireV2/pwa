import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';

/**
 * PWAPage — tabbed admin settings page for resofire/pwa.
 *
 * Stage 1: Minimal stub that confirms the page registers and renders
 * correctly inside ExtensionPage. Full tab structure will be built
 * in Stage 2.
 */
export default class PWAPage extends ExtensionPage {
  content(): Mithril.Children {
    return (
      <div className="PWAPage container">
        <p className="helpText">
          {app.translator.trans('resofire-pwa.admin.placeholder')}
        </p>
      </div>
    );
  }
}
