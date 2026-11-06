import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  ButtonComponent,
  EmptyStateComponent,
  IconComponent,
  ListItemComponent,
  SectionComponent,
  SheetBarComponent,
  SheetBarTitleDirective,
  StatusTextComponent,
} from '@stupa-makers/ui-kit';
import { MarkdownViewComponent } from '@stupa-makers/ui-kit/markdown-view';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { codeExcerpt } from './model';
import { RefsComponent } from './refs.component';

/**
 * The detail of one reference: the lines around it, its spec and its file.
 * §F/references/code/000071
 */
@Component({
  selector: 'app-ref-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    ListItemComponent,
    SectionComponent,
    SheetBarComponent,
    SheetBarTitleDirective,
    StatusTextComponent,
    MarkdownViewComponent,
  ],
  template: `
    @if (ref(); as r) {
      <article class="sd" [class.sd--split]="split()" aria-labelledby="rd-title">
        <header class="sheet-head">
          <app-sheet-bar [bleed]="split()">
            <h2 appSheetBarTitle id="rd-title" class="sheet-title mono rd__title">{{ r.ref }}</h2>
            <app-button variant="text" [iconOnly]="true" [ariaLabel]="t('openLine')" (click)="open(r.path, r.line)">
              <app-icon name="ext" />
            </app-button>
          </app-sheet-bar>
          <p class="sheet-line sd__line">
            @if (r.ok) {
              <app-status-text kind="accent">{{ t('withSpec') }}</app-status-text>
            } @else {
              <app-status-text kind="error">{{ t('withoutSpec') }}</app-status-text>
            }
            <span class="sd__dot" aria-hidden="true">·</span><span>{{ t('line', { n: r.line }) }}</span>
          </p>
        </header>
        <app-section class="sd__sec" [heading]="t('codePlace')">
          <app-markdown-view [src]="code()" [imageSrc]="null" [mailto]="false" />
        </app-section>
        @if (spec(); as s) {
          <app-section class="sd__sec" [heading]="t('spec')">
            <div class="rowgroup">
              <app-list-item [title]="s.title" [sub]="s.id" [link]="data.specLink(s.id)" />
            </div>
          </app-section>
        }
        <app-section class="sd__sec" [heading]="t('file')">
          <div class="rowgroup">
            <app-list-item class="sd__path" [title]="r.path" (activate)="open(r.path, r.line)">
              <app-icon trail name="ext" [size]="16" />
            </app-list-item>
          </div>
        </app-section>
      </article>
    } @else if (data.index()) {
      <app-empty-state plain icon="link" fill [heading]="t('refMissing')" />
    }
  `,
  styleUrl: './spec-detail.component.scss',
  styles: `
    .rd__title {
      font-size: var(--fs-h1);
    }
  `,
})
export class RefDetailComponent {
  readonly data = inject(DataService);
  readonly t = inject(I18n).t;
  readonly split = inject(RefsComponent).split;
  /** The position of the reference in the list, from the URL. */
  readonly n = input('');
  readonly ref = computed(() => this.data.refs()[Number(this.n())] ?? null);
  readonly spec = computed(() => {
    const r = this.ref();
    return r?.ok ? (this.data.byId().get(r.ref) ?? null) : null;
  });
  readonly code = computed(() => {
    const r = this.ref();
    return r ? codeExcerpt(r) : '';
  });

  /** §F/references/code/000020: open the line at the commit SHA. */
  open(path: string, line?: number | null): void {
    window.open(this.data.blob(path, line), '_blank', 'noopener');
  }
}
