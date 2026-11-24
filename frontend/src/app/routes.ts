import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  Router,
  UrlSegment,
  type CanActivateFn,
  type Routes,
  type UrlMatchResult,
} from '@angular/router';
import { FOCUS_H1, ListNoneComponent } from '@stupa-makers/ui-kit/shell';
import { catchError, map, of } from 'rxjs';
import { ExplorerComponent } from './explorer.component';
import { translate } from './i18n';
import { DEFAULT_REPO, RULE_ID_RE, type RepoRefs } from './model';
import { RefDetailComponent } from './ref-detail.component';
import { RefsComponent } from './refs.component';
import { SpecDetailComponent } from './spec-detail.component';
import { UmlComponent } from './uml.component';
import { UmlElementComponent } from './uml-element.component';

/** §F/sources/refs/000009: the rule ID keeps its `/` in the URL, so it spans segments. */
export function ruleIdMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  const id = segments.map((s) => s.path).join('/');
  return RULE_ID_RE.test(id) ? { consumed: segments, posParams: { id: new UrlSegment(id, {}) } } : null;
}

/**
 * §F/sources/refs/000008: a URL without a ref opens the default branch of the repository;
 * a URL without a repository opens `STUPA-Workflow`.
 */
export const toDefaultBranch: CanActivateFn = (route) => {
  const router = inject(Router);
  const repo = (route.paramMap.get('repo') ?? DEFAULT_REPO) as string;
  return inject(HttpClient)
    .get<RepoRefs>(`/api/repos/${encodeURIComponent(repo)}/refs`)
    .pipe(
      map((r) => router.createUrlTree(['/', r.repo, r.defaultBranch])),
      catchError(() => of(router.createUrlTree(['/', DEFAULT_REPO, 'main']))),
    );
};

/** The route data of a list or a detail: the shell moves the focus to its `h1` (000512). */
const FOCUS = { [FOCUS_H1]: true };
/** A list page takes the whole width, as before (the route flag `wide` of the kit shell). */
const PAGE = { ...FOCUS, wide: true };

/** The title of a page in the UI language. §NF/accessibility/interaction/000087 */
const title = (key: string): string => `${translate(key)} · Spec-Explorer`;

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [toDefaultBranch], children: [] },
  {
    path: 'verweise/:repo/:ref',
    title: title('refs'),
    component: RefsComponent,
    data: PAGE,
    children: [
      { path: '', component: ListNoneComponent },
      { path: ':n', component: RefDetailComponent, data: FOCUS },
    ],
  },
  { path: ':repo', pathMatch: 'full', canActivate: [toDefaultBranch], children: [] },
  // §F/uml/views/000095: the URL holds the repository, the ref and the view.
  {
    path: ':repo/:ref/uml',
    title: title('uml'),
    component: UmlComponent,
    data: PAGE,
    children: [{ path: '', component: ListNoneComponent }],
  },
  {
    path: ':repo/:ref/uml/:view',
    title: title('uml'),
    component: UmlComponent,
    data: PAGE,
    children: [
      { path: '', component: ListNoneComponent },
      { path: ':el', component: UmlElementComponent, data: FOCUS },
    ],
  },
  {
    path: ':repo/:ref',
    title: title('specs'),
    component: ExplorerComponent,
    data: PAGE,
    children: [
      { path: '', component: ListNoneComponent },
      { matcher: ruleIdMatcher, component: SpecDetailComponent, data: FOCUS },
    ],
  },
];
