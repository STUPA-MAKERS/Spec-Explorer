import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  UrlSegment,
  convertToParamMap,
  provideRouter,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { ruleIdMatcher, routes, toDefaultBranch } from './routes';

function segments(path: string): UrlSegment[] {
  return path.split('/').map((p) => new UrlSegment(p, {}));
}

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('urlForm: the rule ID keeps its slashes, the ref encodes them (§F/sources/refs/000009)', () => {
    const match = ruleIdMatcher(segments('F/sources/refs/000009'));
    expect(match?.posParams?.['id'].path).toBe('F/sources/refs/000009');
    expect(ruleIdMatcher(segments('F/sources/refs/9'))).toBeNull();
    const router = TestBed.inject(Router);
    const url = router.serializeUrl(
      router.createUrlTree(['/', 'STUPA-Workflow', 'claude/x', 'F', 'sources', 'refs', '000009']),
    );
    expect(url).toBe('/STUPA-Workflow/claude%2Fx/F/sources/refs/000009');
    const parsed = router.parseUrl(url);
    expect(parsed.root.children['primary'].segments[1].path).toBe('claude/x');
  });

  function guard(repo: string | null): Observable<UrlTree> {
    const route = { paramMap: convertToParamMap(repo ? { repo } : {}) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(
      () => toDefaultBranch(route, {} as RouterStateSnapshot) as Observable<UrlTree>,
    );
  }

  it('defaultSource: a URL without a source opens the default branch of STUPA-Workflow (§F/sources/refs/000008)', () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    let target = '';
    guard(null).subscribe((t) => (target = router.serializeUrl(t)));
    http.expectOne('/api/repos/STUPA-Workflow/refs').flush({
      repo: 'STUPA-Workflow',
      defaultBranch: 'main',
      branches: ['main'],
      tags: [],
    });
    expect(target).toBe('/STUPA-Workflow/main');

    guard('ui-kit').subscribe((t) => (target = router.serializeUrl(t)));
    http.expectOne('/api/repos/ui-kit/refs').flush('', { status: 404, statusText: 'Not Found' });
    expect(target).toBe('/STUPA-Workflow/main');
  });
});
