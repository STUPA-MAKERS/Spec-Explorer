import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DetailNoneComponent } from '@stupa-makers/ui-kit';
import { I18n } from './i18n';

/** The detail pane of `Specs` before a spec is picked. */
@Component({
  selector: 'app-spec-none',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailNoneComponent],
  template: `<app-detail-none state="pick" icon="document" [heading]="t('pickSpec')" />`,
  styles: `
    @use 'detail-none-host';
    :host {
      @include detail-none-host.host;
    }
  `,
})
export class SpecNoneComponent {
  readonly t = inject(I18n).t;
}
