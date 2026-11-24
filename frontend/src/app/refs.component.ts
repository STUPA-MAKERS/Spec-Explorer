import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import type { FilterDef, ListGroup, ListQuery, LoadState } from '@stupa-makers/ui-kit';
import { ListDetailScreenComponent } from '@stupa-makers/ui-kit/screens';
import { DataService } from './data.service';
import { errorKey, queryValue } from './explorer.component';
import { I18n } from './i18n';
import { filterRefs } from './model';
import { SourceService } from './source.component';

/**
 * The page `Verweise`: every `§` reference at the source, the ones without a spec first, on
 * the list/detail screen of the kit. §F/references/code/000021, §F/references/code/000072
 */
@Component({
  selector: 'app-refs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListDetailScreenComponent],
  template: `
    <app-list-detail-screen
      [head]="{ title: t('refs') }"
      [scope]="source.scope()"
      [search]="{ placeholder: t('searchRefs') }"
      [filters]="filters()"
      [filtersLabel]="t('filter')"
      [rows]="rows()"
      [none]="{ heading: t('pickRef'), icon: 'link' }"
      [config]="{ param: 'n', reset: true }"
      (scopeChange)="source.change('refs', $event)"
      (query)="onQuery($event)"
    />
  `,
})
export class RefsComponent {
  readonly data = inject(DataService);
  readonly source = inject(SourceService);
  readonly t = inject(I18n).t;

  /** Route parameters. */
  readonly repo = input('');
  readonly ref = input('');

  readonly q = signal('');
  readonly spec = signal('');
  readonly filters = computed<readonly FilterDef[]>(() => [
    {
      key: 'spec',
      label: this.t('spec'),
      kind: 'single',
      value: null,
      options: [
        { value: '', label: this.t('all') },
        { value: 'ok', label: this.t('withSpec') },
        { value: 'none', label: this.t('withoutSpec') },
      ],
    },
  ]);
  readonly filtered = computed(() => !!(this.q() || this.spec()));
  readonly rows = computed<LoadState<readonly ListGroup[]>>(() => {
    const failed = this.data.error();
    if (failed) {
      return { state: 'error', message: this.t(errorKey(failed)), retry: () => this.data.reload() };
    }
    if (!this.data.index()) return { state: 'loading' };
    const rows = filterRefs(this.data.refs(), { q: this.q(), spec: this.spec() });
    const groups = [false, true]
      .map((ok) => ({ ok, rows: rows.filter((x) => x.row.ok === ok) }))
      .filter((g) => g.rows.length);
    if (!groups.length) {
      return this.filtered()
        ? { state: 'empty', heading: this.t('noRefMatch'), icon: 'searchOff' }
        : { state: 'empty', heading: this.t('noRefs'), icon: 'link' };
    }
    return {
      state: 'ready',
      data: groups.map((g) => ({
        key: g.ok ? 'ok' : 'none',
        label: this.t(g.ok ? 'withSpec' : 'withoutSpec'),
        tone: g.ok ? 'accent' : 'warn',
        rows: g.rows.map((x) => ({
          id: String(x.i),
          title: x.row.ref,
          meta: [`${base(x.row.path)}:${x.row.line}`],
          code: 'title',
          link: { commands: ['/verweise', this.data.repo(), this.data.ref(), String(x.i)] },
        })),
      })),
    };
  });

  constructor() {
    effect(() => {
      if (this.repo() && this.ref()) this.data.select(this.repo(), this.ref());
    });
  }

  onQuery(q: ListQuery): void {
    this.q.set(q.search);
    this.spec.set(queryValue(q, 'spec'));
  }
}

/** The file name of a path. */
export function base(p: string): string {
  return p.split('/').pop() ?? p;
}
