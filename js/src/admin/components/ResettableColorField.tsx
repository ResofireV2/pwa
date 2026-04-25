import Component, { ComponentAttrs } from 'flarum/common/Component';
import type Stream from 'flarum/common/utils/Stream';
import type Mithril from 'mithril';

export interface IResettableColorFieldAttrs extends ComponentAttrs {
  /** The setting stream to read/write. */
  stream: Stream<string>;
  /** Label shown above the field. */
  label: Mithril.Children;
  /** Help text shown below. */
  help?: Mithril.Children;
  /** Fallback color shown as placeholder when empty (e.g. forum primary color). */
  placeholder?: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default class ResettableColorField extends Component<IResettableColorFieldAttrs> {
  private colorInputRef: HTMLInputElement | null = null;

  view(): Mithril.Children {
    const { stream, label, help, placeholder } = this.attrs;
    const value       = stream() || '';
    const isValid     = HEX_RE.test(value);
    const swatchColor = isValid ? value : (placeholder || '#888888');

    return (
      <div className="Form-group">
        <label>{label}</label>

        <div className="ResettableColorField">
          <input
            className="FormControl ResettableColorField-input"
            type="text"
            value={value}
            placeholder={placeholder || ''}
            maxlength={7}
            oninput={(e: Event) => {
              const val = (e.target as HTMLInputElement).value;
              stream(val);
              m.redraw();
            }}
            onblur={(e: Event) => {
              const val = (e.target as HTMLInputElement).value.trim();
              // Allow empty — empty means "use forum default".
              // Only sanitise if the user typed something invalid.
              if (val !== '' && !HEX_RE.test(val)) {
                const short = val.replace(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i, '#$1$1$2$2$3$3');
                stream(HEX_RE.test(short) ? short : '');
              } else {
                stream(val);
              }
              m.redraw();
            }}
          />

          {/* Hidden native color picker — triggered by clicking the swatch */}
          <input
            className="ResettableColorField-picker"
            type="color"
            value={isValid ? value : (placeholder || '#888888')}
            oncreate={(vnode: Mithril.VnodeDOM<any, any>) => {
              this.colorInputRef = vnode.dom as HTMLInputElement;
            }}
            oninput={(e: Event) => {
              const val = (e.target as HTMLInputElement).value;
              stream(val);
              m.redraw();
            }}
          />

          <span
            className="ResettableColorField-swatch"
            style={{ backgroundColor: swatchColor }}
            onclick={() => this.colorInputRef?.click()}
            title="Pick a color"
          />
        </div>

        {help && <div className="helpText">{help}</div>}
      </div>
    );
  }
}
