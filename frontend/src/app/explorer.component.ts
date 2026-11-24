import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import type { FilterDef, ListGroup, ListQuery, LoadState, StatusKind } from '@stupa-makers/ui-kit';
import { ListDetailScreenComponent } from '@stupa-makers/ui-kit/screens';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { KINDS, STATUSES, filterSpecs, groupSpecs, statusOf, type Spec } from './model';
import { SourceService } from './source.component';

export const STATUS_KIND: Record<string, StatusKind> = {
  draft: 'warn',
  approved: 'accent',
  replaced: 'muted',
  removed: 'muted',
  error: 'error',
};

/** The text of a failed load by its HTTP status. */
export function errorKey(status: number): string {
  return status === 404 ? 'notFound' : status === 413 ? 'tooLarge' : 'loadFailed';
}

/** The value of one filter of a list query, or the empty string. */
export function queryValue(q: ListQuery, key: string): string {
  const v = q.filters[key];
  return typeof v === 'string' ? v : '';
}

/**
 * The page `Specs`: the list of every spec at the source and the detail of one, on the
 * list/detail screen of the kit. §F/specs/list/000010, §F/specs/list/000011,
 * §F/specs/list/000012, §F/specs/list/000013, §NF/usability/layout/000037
 */
@Component({
  selector: 'app-explorer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListDetailScreenComponent],
  template: `
    <app-list-detail-screen
      [head]="{ title: t('specs') }"
      [scope]="source.scope()"
      [search]="{ placeholder: t('searchSpecs') }"
      [filters]="filters()"
      [filtersLabel]="t('filter')"
      [rows]="rows()"
      [none]="{ heading: t('pickSpec'), icon: 'document' }"
      [config]="{ reset: true }"
      (scopeChange)="source.change('specs', $event)"
      (query)="onQuery($event)"
    />
  `,
})
export class ExplorerComponent {
  readonly data = inject(DataService);
  readonly source = inject(SourceService);
  readonly t = inject(I18n).t;

  /** Route parameters. */
  readonly repo = input('');
  readonly ref = input('');

  readonly q = signal('');
  readonly status = signal('');
  readonly kind = signal('');

  readonly filters = computed<readonly FilterDef[]>(() => [
    {
      key: 'status',
      label: this.t('status'),
      kind: 'single',
      value: null,
      options: [
        { value: '', label: this.t('all') },
        ...STATUSES.map((v) => ({ value: v, label: this.t(`status.${v}`) })),
      ],
    },
    {
      key: 'kind',
      label: this.t('kind'),
      kind: 'single',
      value: null,
      options: [
        { value: '', label: this.t('all') },
        ...KINDS.map((v) => ({ value: v, label: this.t(`kind.${v}`) })),
      ],
    },
  ]);
  readonly filtered = computed(() => !!(this.q() || this.status() || this.kind()));
  readonly groups = computed(() =>
    groupSpecs(
      filterSpecs(this.data.index()?.specs ?? [], {
        q: this.q(),
        status: this.status(),
        kind: this.kind(),
      }),
    ),
  );
  readonly rows = computed<LoadState<readonly ListGroup[]>>(() => {
    const failed = this.data.error();
    if (failed) {
      return { state: 'error', message: this.t(errorKey(failed)), retry: () => this.data.reload() };
    }
    if (!this.data.index()) return { state: 'loading' };
    const groups = this.groups();
    if (!groups.length) {
      return this.filtered()
        ? { state: 'empty', heading: this.t('noSpecMatch'), icon: 'searchOff' }
        : { state: 'empty', heading: this.t('noSpecs'), icon: 'document' };
    }
    return {
      state: 'ready',
      data: groups.map((g) => ({
        key: g.key,
        label: `${this.t('kind.' + g.kind)} · ${g.topic}`,
        rows: g.specs.map((s) => this.row(s)),
      })),
    };
  });

  constructor() {
    effect(() => {
      if (this.repo() && this.ref()) this.data.select(this.repo(), this.ref());
    });
  }

  private row(s: Spec): ListGroup['rows'][number] {
    const status = this.data.status(s);
    return {
      id: s.id,
      title: s.title,
      meta: [`${s.num} · ${s.id.split('/').slice(0, -1).join('/')}`],
      code: 'meta',
      link: { commands: this.data.specLink(s.id) },
      ...(status === 'approved'
        ? {}
        : { status: { label: this.t(`status.${status}`), kind: STATUS_KIND[statusOf(s)] ?? 'muted' } }),
    };
  }

  onQuery(q: ListQuery): void {
    this.q.set(q.search);
    this.status.set(queryValue(q, 'status'));
    this.kind.set(queryValue(q, 'kind'));
  }
}
