import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  Router,
  UrlSegment,
  type CanActivateFn,
  type Routes,
  type UrlMatchResult,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ExplorerComponent } from './explorer.component';
import { DEFAULT_REPO, RULE_ID_RE, type RepoRefs } from './model';
import { RefDetailComponent } from './ref-detail.component';
import { RefNoneComponent } from './ref-none.component';
import { RefsComponent } from './refs.component';
import { SpecDetailComponent } from './spec-detail.component';
import { SpecNoneComponent } from './spec-none.component';
import { UmlComponent } from './uml.component';
import { UmlElementComponent, UmlNoneComponent } from './uml-element.component';

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

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [toDefaultBranch], children: [] },
  {
    path: 'verweise/:repo/:ref',
    component: RefsComponent,
    data: { wide: true },
    children: [
      { path: '', component: RefNoneComponent },
      { path: ':n', component: RefDetailComponent },
    ],
  },
  { path: ':repo', pathMatch: 'full', canActivate: [toDefaultBranch], children: [] },
  // §F/uml/views/000095: the URL holds the repository, the ref and the view.
  {
    path: ':repo/:ref/uml',
    component: UmlComponent,
    data: { wide: true },
    children: [{ path: '', component: UmlNoneComponent }],
  },
  {
    path: ':repo/:ref/uml/:view',
    component: UmlComponent,
    data: { wide: true },
    children: [
      { path: '', component: UmlNoneComponent },
      { path: ':el', component: UmlElementComponent },
    ],
  },
  {
    path: ':repo/:ref',
    component: ExplorerComponent,
    data: { wide: true },
    children: [
      { path: '', component: SpecNoneComponent },
      { matcher: ruleIdMatcher, component: SpecDetailComponent },
    ],
  },
];
