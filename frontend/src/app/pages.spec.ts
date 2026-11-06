import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideUiKit } from '@stupa-makers/ui-kit';
import { screen } from '@testing-library/angular';
import { DataService } from './data.service';
import { I18n } from './i18n';
import type { SourceIndex, Spec } from './model';
import { routes } from './routes';
import { SourceComponent } from './source.component';

const SHA = '1234567'.padEnd(40, 'a');

function spec(id: string, title: string, extra: Partial<Spec> = {}): Spec {
  return {
    id,
    num: id.slice(-6),
    file: `specs/${id}.md`,
    title,
    kind: 'functional',
    status: 'approved',
    owner: 'o',
    updated: '2026-11-06',
    replacedBy: null,
    tests: [],
    implementation: [],
    scope: [],
    body: 'It must work.',
    errors: [],
    codeRefs: [],
    mentions: [],
    mentionedBy: [],
    replaces: [],
    ...extra,
  };
}

const INDEX: SourceIndex = {
  repo: 'STUPA-Workflow',
  ref: 'main',
  sha: SHA,
  specs: [
    spec('F/a/b/000001', 'First rule', {
      mentions: ['F/a/b/000002'],
      replaces: ['F/a/b/000003'],
      tests: [{ entry: 'x.py:test_a', path: 'x.py', fn: 'test_a', line: 3, exists: true }],
      implementation: [{ path: 'backend', exists: true }],
      codeRefs: [{ ref: 'F/a/b/000001', path: 'backend/x.py', line: 5, text: '', from: 1, context: ['a'] }],
    }),
    spec('F/a/b/000002', 'Second rule', { status: 'draft', mentionedBy: ['F/a/b/000001'] }),
    spec('F/a/b/000003', 'Old rule', { status: 'replaced', replacedBy: 'F/a/b/000001' }),
  ],
  broken: [{ ref: 'F/a/b/000099', path: 'frontend/y.ts', line: 2, text: '', from: 1, context: ['x', 'y'] }],
};

let http: HttpTestingController;

async function open(url: string): Promise<RouterTestingHarness> {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  settle(harness);
  return harness;
}

function settle(harness: RouterTestingHarness, index: SourceIndex = INDEX): void {
  for (let i = 0; i < 3; i++) {
    harness.detectChanges();
    answer(index);
  }
  harness.detectChanges();
}

function answer(index: SourceIndex = INDEX): void {
  for (const r of http.match('/api/repos')) r.flush({ repos: ['ui-kit', 'STUPA-Workflow'], default: 'STUPA-Workflow' });
  for (const r of http.match((q) => q.url.endsWith('/refs'))) {
    r.flush({ repo: 'STUPA-Workflow', defaultBranch: 'main', branches: ['main', 'dev'], tags: ['v1'] });
  }
  for (const r of http.match((q) => q.url.endsWith('/index'))) r.flush(index);
}

describe('pages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideUiKit(),
      ],
    });
    TestBed.inject(I18n).lang.set('de');
    http = TestBed.inject(HttpTestingController);
  });

  it('listsSpecs: groups, status and detail with every section', async () => {
    await open('/STUPA-Workflow/main/F/a/b/000001');
    expect(screen.getAllByText('First rule').length).toBeGreaterThan(0);
    expect(screen.getByText('Entwurf')).toBeTruthy();
    expect(screen.getByText('Umsetzung')).toBeTruthy();
    expect(screen.getByText('test_a')).toBeTruthy();
    expect(screen.getByText('x.py:5')).toBeTruthy();
    expect(screen.getAllByText(/Ersetzt · F\/a\/b\/000003|Nennt · F\/a\/b\/000002/).length).toBe(2);
    const data = TestBed.inject(DataService);
    expect(data.sha()).toBe(SHA);
  });

  it('missingSpec: an unknown rule ID shows an empty state', async () => {
    const harness = await open('/STUPA-Workflow/main/F/a/b/000777');
    harness.detectChanges();
    expect(screen.getByText('Diese Spec gibt es an diesem Stand nicht')).toBeTruthy();
  });

  it('replacedNote: a replaced spec links to the new spec', async () => {
    await open('/STUPA-Workflow/main/F/a/b/000003');
    expect(screen.getByText('Ersetzt durch')).toBeTruthy();
  });

  it('loadError: a missing source shows Diesen Stand gibt es nicht', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/STUPA-Workflow/nope');
    harness.detectChanges();
    for (const r of http.match((q) => q.url.endsWith('/index'))) r.flush('', { status: 404, statusText: 'x' });
    harness.detectChanges();
    expect(screen.getByText('Diesen Stand gibt es nicht')).toBeTruthy();
    TestBed.inject(DataService).reload();
    for (const r of http.match((q) => q.url.endsWith('/index'))) r.flush('', { status: 413, statusText: 'x' });
    harness.detectChanges();
    expect(screen.getByText('Das Repository ist zu groß')).toBeTruthy();
  });

  it('references: the list has both groups and the detail shows the code', async () => {
    const harness = await open('/verweise/STUPA-Workflow/main/0');
    harness.detectChanges();
    expect(screen.getAllByText('Ohne Spec').length).toBe(2);
    expect(screen.getByText('Mit Spec')).toBeTruthy();
    expect(screen.getByText('Zeile 2')).toBeTruthy();
    await harness.navigateByUrl('/verweise/STUPA-Workflow/main/1');
    harness.detectChanges();
    expect(screen.getByText('First rule')).toBeTruthy();
    expect(screen.getByText('Zeile 5')).toBeTruthy();
  });

  it('noReferences: a source without a reference says so', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/verweise/STUPA-Workflow/main');
    settle(harness, { ...INDEX, specs: [], broken: [] });
    expect(screen.getAllByText('Kein Verweis mit §').length).toBeGreaterThan(0);
  });

  it('source: the chips switch the ref and the dialog checks a SHA (§F/sources/refs/000004)', async () => {
    const harness = await open('/STUPA-Workflow/main');
    const source = harness.routeDebugElement!.query((d) => d.componentInstance instanceof SourceComponent)
      .componentInstance as SourceComponent;
    expect(source.refOptions().map((o) => o.value)).toEqual(['main', 'v1', '\u0000other']);
    expect(source.refText()).toBe('main · 1234567');
    source.setRef('\u0000other');
    expect(source.dialog()).toBe(true);
    source.tab.set('branch');
    source.q.set('de');
    expect(source.rows()).toEqual(['dev']);
    source.tab.set('tag');
    expect(source.rows()).toEqual([]);
    source.sha = 'xyz';
    source.openSha();
    expect(source.shaError()).toBe('Kein gültiger Commit-SHA');
    source.sha = 'ABCDEF1';
    source.openSha();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/STUPA-Workflow/abcdef1');
    source.setRepo('ui-kit');
    http.expectOne('/api/repos/ui-kit/refs').flush({ repo: 'ui-kit', defaultBranch: 'development', branches: [], tags: [] });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/ui-kit/development');
  });
});
