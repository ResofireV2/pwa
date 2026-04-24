import app from 'flarum/admin/app';
import Component, { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import type Mithril from 'mithril';

export interface IIconUploadButtonAttrs extends ComponentAttrs {
  onSuccess: (generated: Record<string, { path: string; url: string }>) => void;
  onDelete: () => void;
  hasIcons: boolean;
}

export default class IconUploadButton extends Component<IIconUploadButtonAttrs> {
  uploading = false;
  deleting  = false;
  error: string | null = null;

  view(): Mithril.Children {
    const { hasIcons } = this.attrs;

    return (
      <div className="IconUploadButton">
        {this.error && (
          <p className="helpText" style="color: var(--control-danger-color); margin-bottom: 10px;">
            {this.error}
          </p>
        )}

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <Button
            className="Button Button--primary"
            loading={this.uploading}
            disabled={this.uploading || this.deleting}
            onclick={this.triggerUpload.bind(this)}
          >
            <i className="fas fa-upload" style="margin-right: 6px;" />
            {hasIcons
              ? app.translator.trans('resofire-pwa.admin.icons.replace_button')
              : app.translator.trans('resofire-pwa.admin.icons.upload_button')}
          </Button>

          {hasIcons && (
            <Button
              className="Button Button--danger"
              loading={this.deleting}
              disabled={this.uploading || this.deleting}
              onclick={this.deleteAll.bind(this)}
            >
              <i className="fas fa-trash-alt" style="margin-right: 6px;" />
              {app.translator.trans('resofire-pwa.admin.icons.delete_button')}
            </Button>
          )}

          {(this.uploading || this.deleting) && (
            <LoadingIndicator size="small" display="unset" />
          )}
        </div>
      </div>
    );
  }

  private triggerUpload(): void {
    if (this.uploading) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      document.body.removeChild(input);

      if (!file) return;

      this.error = null;
      this.uploading = true;
      m.redraw();

      const body = new FormData();
      body.append('icon-source', file);

      app.request<{ generated: Record<string, { path: string; url: string }> }>({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/resofire-pwa/icons`,
        serialize: (raw) => raw,
        body,
      })
        .then((response) => {
          this.uploading = false;
          this.attrs.onSuccess(response.generated);
          m.redraw();
        })
        .catch((e: any) => {
          this.uploading = false;
          this.error = e?.response?.json?.error
            ?? app.translator.trans('resofire-pwa.admin.icons.upload_error') as string;
          m.redraw();
        });
    });

    input.click();
  }

  private deleteAll(): void {
    if (this.deleting) return;
    if (!confirm(app.translator.trans('resofire-pwa.admin.icons.delete_confirm') as string)) return;

    this.error = null;
    this.deleting = true;
    m.redraw();

    app.request({
      method: 'DELETE',
      url: `${app.forum.attribute('apiUrl')}/resofire-pwa/icons`,
    })
      .then(() => {
        this.deleting = false;
        this.attrs.onDelete();
        m.redraw();
      })
      .catch(() => {
        this.deleting = false;
        this.error = app.translator.trans('resofire-pwa.admin.icons.delete_error') as string;
        m.redraw();
      });
  }
}
