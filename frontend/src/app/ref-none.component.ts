import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DetailNoneComponent } from '@stupa-makers/ui-kit';
import { DataService } from './data.service';
import { I18n } from './i18n';

/** The detail pane of `Verweise` before a reference is picked. */
@Component({
  selector: 'app-ref-none',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailNoneComponent],
  template: `
    <app-detail-none
      [state]="state()"
      icon="link"
      [heading]="t('pickRef')"
      emptyIcon="circleok"
      [emptyHeading]="t('noRefs')"
    />
  `,
  styles: `
    @use 'detail-none-host';
    :host {
      @include detail-none-host.host;
    }
  `,
})
export class RefNoneComponent {
  private readonly data = inject(DataService);
  readonly t = inject(I18n).t;
  readonly state = computed(() => (this.data.refs().length ? 'pick' : 'empty'));
}
