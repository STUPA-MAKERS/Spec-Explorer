import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  ButtonComponent,
  EmptyStateComponent,
  FilterSelectComponent,
  ListDetailLayoutComponent,
  ListGroupComponent,
  ListItemComponent,
  PageHeaderComponent,
  ScrollFadeDirective,
  SearchPillComponent,
  StickyBarComponent,
  type FilterSelectOption,
} from '@stupa-makers/ui-kit';
import { injectListDetailPage } from '@stupa-makers/ui-kit/shell';
import { DataService } from './data.service';
import { errorKey } from './explorer.component';
import { I18n } from './i18n';
import { filterRefs } from './model';
import { SourceComponent } from './source.component';

/**
 * The page `Verweise`: every `§` reference at the source, the ones without a spec first.
 * §F/references/code/000021, §F/references/code/000072
 */
@Component({
  selector: 'app-refs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    ButtonComponent,
    EmptyStateComponent,
    FilterSelectComponent,
    ListDetailLayoutComponent,
    ListGroupComponent,
    ListItemComponent,
    PageHeaderComponent,
    ScrollFadeDirective,
    SearchPillComponent,
    StickyBarComponent,
    SourceComponent,
  ],
  host: { '[class.pane-page]': 'split()' },
  template: `
    <div class="ex" [class.ex--split]="split()">
      <app-list-detail [detailOpen]="selectedId() !== null" (back)="closeDetail()">
        <section list class="ld-pane ex__pane" aria-labelledby="rf-title">
          <app-page-header [pane]="true" titleId="rf-title" [title]="t('refs')" />
          <app-sticky-bar class="ld-pane__filters">
            <div class="ex__chips" role="group" [attr.aria-label]="t('source')">
              <app-source page="refs" />
            </div>
            <app-search-pill
              [placeholder]="t('searchRefs')"
              [label]="t('searchRefsLabel')"
              [value]="q()"
              [clearable]="true"
              (valueChange)="q.set($event)"
            />
            <div class="ex__chips" role="group" [attr.aria-label]="t('filter')">
              <app-filter-select
                class="ex__chip"
                [label]="t('spec')"
                [options]="specOptions()"
                [value]="spec()"
                [text]="specText()"
                (valueChange)="spec.set($event)"
                filled
              />
              @if (filtered()) {
                <app-button variant="text" size="sm" (click)="reset()">{{ t('reset') }}</app-button>
              }
            </div>
          </app-sticky-bar>
          <div class="ex__scroll" appScrollFade="y">
            @if (data.error(); as status) {
              <app-empty-state icon="alert" [heading]="t(errorKey(status))">
                <app-button variant="text" size="sm" (click)="data.reload()">{{ t('retry') }}</app-button>
              </app-empty-state>
            } @else if (data.index() && !groups().length) {
              @if (filtered()) {
                <app-empty-state [heading]="t('noRefMatch')">
                  <app-button variant="text" size="sm" (click)="reset()">{{ t('reset') }}</app-button>
                </app-empty-state>
              } @else {
                <app-empty-state icon="link" [heading]="t('noRefs')" />
              }
            }
            @for (g of groups(); track g.ok) {
              <app-list-group [label]="t(g.ok ? 'withSpec' : 'withoutSpec')" [tone]="g.ok ? 'accent' : 'warn'">
                <div class="ex__rows" [class.rowgroup]="!split()" role="list">
                  @for (x of g.rows; track x.i) {
                    <app-list-item
                      role="listitem"
                      class="ex__row rf__row"
                      [title]="x.row.ref"
                      [sub]="base(x.row.path) + ':' + x.row.line"
                      [link]="['/verweise', data.repo(), data.ref(), '' + x.i]"
                      [selected]="'' + x.i === selectedId()"
                    />
                  }
                </div>
              </app-list-group>
            }
          </div>
        </section>
        <div detail class="ex__detail"><router-outlet /></div>
      </app-list-detail>
    </div>
  `,
  styleUrl: './explorer.component.scss',
  styles: `
    .rf__row ::ng-deep .li__titleText {
      font-family: var(--font-mono);
      font-size: var(--fs-small);
    }
  `,
})
export class RefsComponent {
  readonly data = inject(DataService);
  private readonly router = inject(Router);
  readonly t = inject(I18n).t;
  readonly errorKey = errorKey;
  private readonly layout = viewChild(ListDetailLayoutComponent);
  private readonly ld = injectListDetailPage(this.layout, { param: 'n' });
  readonly split = this.ld.split;
  readonly selectedId = this.ld.selectedId;

  /** Route parameters. */
  readonly repo = input('');
  readonly ref = input('');

  readonly q = signal('');
  readonly spec = signal('');
  readonly specOptions = computed<FilterSelectOption[]>(() => [
    { value: '', label: this.t('all') },
    { value: 'ok', label: this.t('withSpec') },
    { value: 'none', label: this.t('withoutSpec') },
  ]);
  readonly specText = computed(() => {
    const v = this.spec();
    return v === 'ok' ? this.t('withSpec') : v === 'none' ? this.t('withoutSpec') : this.t('spec');
  });
  readonly filtered = computed(() => !!(this.q() || this.spec()));
  readonly groups = computed(() => {
    const rows = filterRefs(this.data.refs(), { q: this.q(), spec: this.spec() });
    return [
      { ok: false, rows: rows.filter((x) => !x.row.ok) },
      { ok: true, rows: rows.filter((x) => x.row.ok) },
    ].filter((g) => g.rows.length);
  });

  constructor() {
    effect(() => {
      if (this.repo() && this.ref()) this.data.select(this.repo(), this.ref());
    });
  }

  reset(): void {
    this.q.set('');
    this.spec.set('');
  }

  base(p: string): string {
    return p.split('/').pop() ?? p;
  }

  closeDetail(): void {
    void this.router.navigate(['/verweise', this.data.repo(), this.data.ref()]);
  }
}
