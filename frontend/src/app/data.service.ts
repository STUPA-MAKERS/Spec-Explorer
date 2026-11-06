import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DEFAULT_REPO,
  blobUrl,
  refRows,
  type RepoRefs,
  type SourceIndex,
  type Spec,
} from './model';

/** The state of one load: `null` while it runs or when it worked, else the HTTP status. */
export type LoadError = number | null;

/**
 * The source that the pages show: one repository and one ref, and the index of its commit.
 * The server does all GitHub access; the browser talks only to `/api`.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private requestId = 0;
  private key = '';

  readonly repo = signal(DEFAULT_REPO);
  readonly ref = signal('');
  readonly index = signal<SourceIndex | null>(null);
  readonly error = signal<LoadError>(null);
  readonly repos = signal<string[]>([]);
  readonly repoRefs = signal<RepoRefs | null>(null);

  /** §F/sources/refs/000006: the commit that the page shows. */
  readonly sha = computed(() => this.index()?.sha ?? '');
  readonly byId = computed(() => new Map((this.index()?.specs ?? []).map((s) => [s.id, s])));
  readonly refs = computed(() => refRows(this.index()));

  constructor() {
    this.http.get<{ repos: string[] }>('/api/repos').subscribe({
      next: (r) => this.repos.set(r.repos),
      error: () => this.repos.set([]),
    });
  }

  /** Show a source. A source that is already shown or loading does not load again. */
  select(repo: string, ref: string): void {
    const key = `${repo}\n${ref}`;
    if (key === this.key) return;
    const repoChanged = repo !== this.repo() || !this.repoRefs();
    this.key = key;
    this.repo.set(repo);
    this.ref.set(ref);
    this.reload();
    if (repoChanged) this.loadRefs(repo);
  }

  /** Load the index of the current source again. */
  reload(): void {
    const id = ++this.requestId;
    this.index.set(null);
    this.error.set(null);
    const url = `/api/repos/${encodeURIComponent(this.repo())}/index`;
    this.http.get<SourceIndex>(url, { params: { ref: this.ref() } }).subscribe({
      next: (index) => {
        if (id === this.requestId) this.index.set(index);
      },
      error: (e: HttpErrorResponse) => {
        if (id === this.requestId) this.error.set(e.status || 500);
      },
    });
  }

  private loadRefs(repo: string): void {
    this.repoRefs.set(null);
    this.http.get<RepoRefs>(`/api/repos/${encodeURIComponent(repo)}/refs`).subscribe({
      next: (refs) => {
        if (repo === this.repo()) this.repoRefs.set(refs);
      },
      error: () => undefined,
    });
  }

  /** The link to a file or a line on GitHub at the commit of the source. */
  blob(path: string, line?: number | null): string {
    return blobUrl(this.repo(), this.sha(), path, line);
  }

  /** The router link of a spec at the current source. §F/sources/refs/000009 */
  specLink(id: string): string[] {
    return ['/', this.repo(), this.ref(), ...id.split('/')];
  }

  status(s: Spec): string {
    return s.errors.length ? 'error' : s.status;
  }
}
