import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ThemeService } from '@stupa-makers/ui-kit';
import { FrameworkShellComponent } from '@stupa-makers/ui-kit/shell';
import { STATEMENT } from './config';
import { I18n } from './i18n';
import { SourceSheetComponent } from './source.component';

/** The frame of the explorer: the framework shell of the kit and the sheet of the source. */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FrameworkShellComponent, SourceSheetComponent],
  template: `
    <app-framework-shell (action)="onAction($event)" />
    <app-source-sheet />
  `,
})
export class App {
  private readonly i18n = inject(I18n);

  constructor() {
    // §NF/usability/layout/000038: no stored choice, so the theme follows the system.
    inject(ThemeService).init();
    // §NF/accessibility/language/000093: the page language follows the UI language.
    effect(() => {
      document.documentElement.lang = this.i18n.lang();
    });
  }

  /** "Barriere melden" opens the statement of the platform, which has the report. */
  onAction(key: string): void {
    if (key === 'reportBarrier') window.open(STATEMENT, '_blank', 'noopener');
  }
}
