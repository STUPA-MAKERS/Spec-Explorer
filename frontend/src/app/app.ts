import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '@stupa-makers/ui-kit';
import { ShellComponent, type ShellBrand, type ShellNavItem } from '@stupa-makers/ui-kit/shell';
import { DataService } from './data.service';
import { I18n } from './i18n';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShellComponent],
  template: `
    <app-shell
      [frame]="'rail'"
      [nav]="nav()"
      [barKeys]="['specs', 'refs', 'uml']"
      [brand]="brand"
      [searchable]="false"
      [more]="false"
    />
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class App {
  private readonly data = inject(DataService);
  private readonly i18n = inject(I18n);
  readonly brand: ShellBrand = { home: '/', label: 'Spec-Explorer', mark: '/logos/stupa-mark.svg' };
  readonly nav = computed<ShellNavItem[]>(() => {
    const t = this.i18n.t;
    const source = [this.data.repo(), encodeURIComponent(this.data.ref())].join('/');
    return [
      { key: 'specs', path: `/${source}`, label: t('specs'), icon: 'document', place: 'main' },
      { key: 'refs', path: `/verweise/${source}`, label: t('refs'), icon: 'link', place: 'main' },
      { key: 'uml', path: `/${source}/uml`, label: t('uml'), icon: 'shapes', place: 'main' },
    ];
  });

  constructor() {
    // §NF/usability/layout/000038: no stored choice, so the theme follows the system.
    inject(ThemeService).init();
    document.documentElement.lang = this.i18n.lang();
  }
}
