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
  StatusTextComponent,
  StickyBarComponent,
  type FilterSelectOption,
  type StatusKind,
} from '@stupa-makers/ui-kit';
import { injectListDetailPage } from '@stupa-makers/ui-kit/shell';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { KINDS, STATUSES, filterSpecs, groupSpecs, statusOf, type Spec } from './model';
import { SourceComponent } from './source.component';

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

/** The page `Specs`: the list of every spec at the source and the detail of one. */
@Component({
  selector: 'app-explorer',
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
    StatusTextComponent,
    StickyBarComponent,
    SourceComponent,
  ],
  host: { '[class.pane-page]': 'split()' },
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss',
})
export class ExplorerComponent {
  readonly data = inject(DataService);
  private readonly router = inject(Router);
  readonly t = inject(I18n).t;
  private readonly layout = viewChild(ListDetailLayoutComponent);
  private readonly ld = injectListDetailPage(this.layout);
  readonly split = this.ld.split;
  readonly selectedId = this.ld.selectedId;

  /** Route parameters. */
  readonly repo = input('');
  readonly ref = input('');

  readonly q = signal('');
  readonly status = signal('');
  readonly kind = signal('');

  readonly statusOptions = computed<FilterSelectOption[]>(() => [
    { value: '', label: this.t('all') },
    ...STATUSES.map((v) => ({ value: v, label: this.t(`status.${v}`) })),
  ]);
  readonly kindOptions = computed<FilterSelectOption[]>(() => [
    { value: '', label: this.t('all') },
    ...KINDS.map((v) => ({ value: v, label: this.t(`kind.${v}`) })),
  ]);
  readonly statusText = computed(() =>
    this.status() ? this.t(`status.${this.status()}`) : this.t('status'),
  );
  readonly kindText = computed(() => (this.kind() ? this.t(`kind.${this.kind()}`) : this.t('kind')));
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

  constructor() {
    effect(() => {
      if (this.repo() && this.ref()) this.data.select(this.repo(), this.ref());
    });
  }

  statusKind(s: Spec): StatusKind {
    return STATUS_KIND[statusOf(s)] ?? 'muted';
  }

  errorText(status: number): string {
    return this.t(errorKey(status));
  }

  reset(): void {
    this.q.set('');
    this.status.set('');
    this.kind.set('');
  }

  closeDetail(): void {
    void this.router.navigate(['/', this.data.repo(), this.data.ref()]);
  }
}
