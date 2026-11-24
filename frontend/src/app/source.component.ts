import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SelectSheetComponent, type SelectSheetOption } from '@stupa-makers/ui-kit';
import type { ScreenScope } from '@stupa-makers/ui-kit/screens';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { SHA_RE, type RepoRefs } from './model';

/** The value of the ref chip that opens the sheet. */
export const OTHER = '\u0000other';

/** The page that the source chips switch. */
export type SourcePage = 'specs' | 'refs' | 'uml';

/**
 * The source of a page: the chips `Repo` and `Stand` of the list screen and the sheet for any
 * branch, tag or commit SHA. §F/sources/refs/000004
 */
@Injectable({ providedIn: 'root' })
export class SourceService {
  private readonly data = inject(DataService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly t = inject(I18n).t;

  /** The sheet "Stand wählen" is open, for this page. */
  readonly sheet = signal<SourcePage | null>(null);

  private readonly repoOptions = computed(() => {
    const repos = this.data.repos();
    const list = repos.includes(this.data.repo()) ? repos : [this.data.repo(), ...repos];
    return list.map((r) => ({ value: r, label: r }));
  });
  private readonly refOptions = computed(() => {
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
  /** The scope of the list screen: the chips `Repo` and `Stand`. */
  readonly scope = computed<ScreenScope>(() => ({
    label: this.t('source'),
    chips: [
      {
        key: 'repo',
        label: this.t('repo'),
        icon: 'package',
        options: this.repoOptions(),
        value: this.data.repo(),
      },
      {
        key: 'ref',
        label: this.t('ref'),
        icon: 'flow',
        options: this.refOptions(),
        value: this.data.ref(),
        text: this.refText(),
      },
    ],
  }));

  /** A chip of the scope got a new value. */
  change(page: SourcePage, e: { readonly key: string; readonly value: string }): void {
    if (e.key === 'repo') this.setRepo(page, e.value);
    else if (e.value === OTHER) this.sheet.set(page);
    else if (e.value !== this.data.ref()) this.go(page, this.data.repo(), e.value);
  }

  private setRepo(page: SourcePage, repo: string): void {
    if (repo === this.data.repo()) return;
    this.http.get<RepoRefs>(`/api/repos/${encodeURIComponent(repo)}/refs`).subscribe({
      next: (r) => this.go(page, r.repo, r.defaultBranch),
      error: () => undefined,
    });
  }

  go(page: SourcePage, repo: string, ref: string): void {
    this.sheet.set(null);
    const base =
      page === 'refs'
        ? ['/verweise', repo, ref]
        : page === 'uml'
          ? ['/', repo, ref, 'uml']
          : ['/', repo, ref];
    void this.router.navigate(base);
  }
}

/**
 * The sheet "Stand wählen": the branches and tags of the repository, and a commit SHA that the
 * search names. §F/sources/refs/000004, §F/sources/refs/000005
 */
@Component({
  selector: 'app-source-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectSheetComponent],
  template: `
    <app-select-sheet
      [open]="source.sheet() !== null"
      (openChange)="$event || source.sheet.set(null)"
      [heading]="t('chooseRef')"
      [options]="options()"
      [value]="data.ref()"
      [search]="{ placeholder: t('searchRef') }"
      [(query)]="query"
      [listLabel]="t('refList')"
      [emptyHeading]="t('noRefFound')"
      [submitLabel]="t('open')"
      (picked)="pick($event)"
    />
  `,
})
export class SourceSheetComponent {
  readonly data = inject(DataService);
  readonly source = inject(SourceService);
  readonly t = inject(I18n).t;
  readonly query = signal('');

  /**
   * The branches (the default branch first) and the tags that match the search, at most 100,
   * and the commit when the search is a SHA of 7 to 40 hex characters.
   */
  readonly options = computed<readonly SelectSheetOption[] | null>(() => {
    const refs = this.data.repoRefs();
    if (!refs) return null;
    const q = this.query().trim().toLowerCase();
    const branches = [refs.defaultBranch, ...refs.branches.filter((b) => b !== refs.defaultBranch)];
    const rows: SelectSheetOption[] = [
      ...branches.map((b) => ({ value: b, label: b, sub: this.t('branch') })),
      ...refs.tags.map((x) => ({ value: x, label: x, sub: this.t('tag') })),
    ].filter((o) => o.label.toLowerCase().includes(q));
    const sha = SHA_RE.test(q) ? [{ value: q, label: q, sub: this.t('commit') }] : [];
    return [...sha, ...rows].slice(0, 100);
  });

  pick(value: string | readonly string[]): void {
    const page = this.source.sheet() ?? 'specs';
    this.query.set('');
    this.source.go(page, this.data.repo(), String(value));
  }
}
