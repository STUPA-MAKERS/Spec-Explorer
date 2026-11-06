import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  DialogComponent,
  FilterSelectComponent,
  InputComponent,
  ListItemComponent,
  SearchPillComponent,
  SegmentedComponent,
  StatusTextComponent,
  type FilterSelectOption,
  type SegmentedOption,
} from '@stupa-makers/ui-kit';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { ORG, SHA_RE, type RepoRefs } from './model';

/** The value of the ref chip that opens the dialog. */
const OTHER = '\u0000other';

/**
 * The source of a page: the chips `Repo` and `Stand` and the dialog for any branch, tag or
 * commit SHA. §F/sources/refs/000004
 */
@Component({
  selector: 'app-source',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    DialogComponent,
    FilterSelectComponent,
    InputComponent,
    ListItemComponent,
    SearchPillComponent,
    SegmentedComponent,
    StatusTextComponent,
  ],
  template: `
    <app-filter-select
        [label]="t('repo')"
        icon="package"
        [options]="repoOptions()"
        [value]="data.repo()"
        [active]="true"
        (valueChange)="setRepo($event)"
      />
      <app-filter-select
        [label]="t('ref')"
        icon="flow"
        [options]="refOptions()"
        [value]="data.ref()"
        [text]="refText()"
        [active]="true"
        (valueChange)="setRef($event)"
      />
    <app-dialog
      [open]="dialog()"
      [title]="t('chooseRef')"
      [subtitle]="org + '/' + data.repo()"
      (closed)="dialog.set(false)"
    >
      <div class="src">
        <app-segmented
          [options]="tabs()"
          [value]="tab()"
          (valueChange)="tab.set($event ?? 'branch')"
          [ariaLabel]="t('refKind')"
          width="fill"
        />
        @if (tab() === 'commit') {
          <app-input
            [label]="t('commitSha')"
            [error]="shaError()"
            [(ngModel)]="sha"
            (keydown.enter)="openSha()"
          />
        } @else {
          <app-search-pill
            size="md"
            [placeholder]="tab() === 'branch' ? t('searchBranch') : t('searchTag')"
            [value]="q()"
            (valueChange)="q.set($event)"
          />
          <div class="rowgroup src__rows">
            @for (r of rows(); track r) {
              <app-list-item [title]="r" [selected]="r === data.ref()" (activate)="go(data.repo(), r)">
                @if (r === data.ref()) {
                  <app-status-text trail kind="accent">{{ t('current') }}</app-status-text>
                }
              </app-list-item>
            }
          </div>
        }
      </div>
      <div dialog-footer>
        <app-button variant="text" (click)="dialog.set(false)">{{ t('cancel') }}</app-button>
        @if (tab() === 'commit') {
          <app-button (click)="openSha()">{{ t('open') }}</app-button>
        }
      </div>
    </app-dialog>
  `,
  styles: `
    :host {
      display: contents;
    }
    app-filter-select {
      max-width: 100%;
    }
    .src {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      min-width: 0;
    }
    .src__rows {
      max-height: 22rem;
      overflow: auto;
    }
  `,
})
export class SourceComponent {
  readonly data = inject(DataService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly t = inject(I18n).t;
  readonly org = ORG;
  /** The page that the chips switch: the specs or the references. */
  readonly page = input<'specs' | 'refs'>('specs');

  readonly dialog = signal(false);
  readonly tab = signal('branch');
  readonly q = signal('');
  sha = '';
  readonly shaError = signal('');

  readonly tabs = computed<SegmentedOption[]>(() => [
    { value: 'branch', label: this.t('branch') },
    { value: 'tag', label: this.t('tag') },
    { value: 'commit', label: this.t('commit') },
  ]);
  readonly repoOptions = computed<FilterSelectOption[]>(() => {
    const repos = this.data.repos();
    const list = repos.includes(this.data.repo()) ? repos : [this.data.repo(), ...repos];
    return list.map((r) => ({ value: r, label: r }));
  });
  readonly refOptions = computed<FilterSelectOption[]>(() => {
    const refs = this.data.repoRefs();
    const list = [refs?.defaultBranch ?? '', this.data.ref(), ...(refs?.tags.slice(0, 4) ?? [])];
    const unique = [...new Set(list.filter(Boolean))];
    return [
      ...unique.map((r) => ({ value: r, label: r })),
      { value: OTHER, label: this.t('otherRef') },
    ];
  });
  /** §F/sources/refs/000006: the ref and the first 7 characters of its commit. */
  readonly refText = computed(() => {
    const sha = this.data.sha().slice(0, 7);
    return sha ? `${this.data.ref()} · ${sha}` : this.data.ref();
  });
  readonly rows = computed(() => {
    const refs = this.data.repoRefs();
    if (!refs) return [];
    const q = this.q().trim().toLowerCase();
    const list =
      this.tab() === 'tag'
        ? refs.tags
        : [refs.defaultBranch, ...refs.branches.filter((b) => b !== refs.defaultBranch)];
    return list.filter((x) => x.toLowerCase().includes(q)).slice(0, 100);
  });

  setRepo(repo: string): void {
    if (repo === this.data.repo()) return;
    this.http.get<RepoRefs>(`/api/repos/${encodeURIComponent(repo)}/refs`).subscribe({
      next: (r) => this.go(r.repo, r.defaultBranch),
      error: () => undefined,
    });
  }

  setRef(ref: string): void {
    if (ref === OTHER) {
      this.q.set('');
      this.dialog.set(true);
    } else if (ref !== this.data.ref()) {
      this.go(this.data.repo(), ref);
    }
  }

  /** §F/sources/refs/000005: a commit SHA has 7 to 40 hexadecimal characters. */
  openSha(): void {
    const sha = this.sha.trim();
    if (!SHA_RE.test(sha)) {
      this.shaError.set(this.t('shaInvalid'));
      return;
    }
    this.shaError.set('');
    this.go(this.data.repo(), sha.toLowerCase());
  }

  go(repo: string, ref: string): void {
    this.dialog.set(false);
    const base = this.page() === 'refs' ? ['/verweise', repo, ref] : ['/', repo, ref];
    void this.router.navigate(base);
  }
}
