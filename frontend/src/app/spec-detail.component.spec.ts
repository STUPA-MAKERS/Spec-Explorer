import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { provideUiKit } from '@stupa-makers/ui-kit';
import { DataService } from './data.service';
import { ExplorerComponent } from './explorer.component';
import { I18n } from './i18n';
import type { SourceIndex, Spec } from './model';
import { SpecDetailComponent } from './spec-detail.component';

const SHA = 'f'.repeat(40);

function spec(extra: Partial<Spec> = {}): Spec {
  return {
    id: 'F/sources/refs/000005',
    num: '000005',
    file: 'specs/requirements/functional/sources/refs/000005_commit-sha.md',
    title: 'A commit SHA has 7 to 40 characters',
    kind: 'functional',
    status: 'approved',
    owner: 'frederikbeimgraben',
    updated: '2026-11-06',
    replacedBy: null,
    tests: [],
    implementation: null,
    scope: [{ path: 'backend', exists: true }, { path: 'gone', exists: false }],
    body: 'A commit SHA must have 7 to 40 characters.\n\nReason: It names one state.\n\nTest: Unit test.',
    errors: [],
    codeRefs: [],
    mentions: [],
    mentionedBy: [],
    replaces: [],
    ...extra,
  };
}

async function show(s: Spec): Promise<void> {
  await render(SpecDetailComponent, {
    inputs: { id: s.id },
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideUiKit(),
      { provide: ExplorerComponent, useValue: { split: signal(true) } },
    ],
    configureTestBed: () => {
      TestBed.inject(I18n).lang.set('de');
      const data = TestBed.inject(DataService);
      data.repo.set('STUPA-Workflow');
      data.ref.set('main');
      const index: SourceIndex = { repo: 'STUPA-Workflow', ref: 'main', sha: SHA, specs: [s], broken: [] };
      data.index.set(index);
    },
  });
}

describe('SpecDetailComponent', () => {
  it('frontMatter: shows rule ID, title, kind, status, owner and date (§F/specs/detail/000015)', async () => {
    await show(spec());
    expect(screen.getByRole('heading', { name: 'A commit SHA has 7 to 40 characters' })).toBeTruthy();
    for (const text of ['F/sources/refs/000005', 'Funktional', 'Freigegeben', 'frederikbeimgraben', '06.11.2026']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('body: renders the body; Reason and Test stay as text (§F/specs/detail/000016)', async () => {
    await show(spec());
    expect(screen.getByText('A commit SHA must have 7 to 40 characters.')).toBeTruthy();
    expect(screen.getByText(/^Reason:/)).toBeTruthy();
    expect(screen.getByText(/^Test:/)).toBeTruthy();
  });

  it('fileLink: opens the spec file at the commit SHA (§F/specs/detail/000017)', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    await show(spec());
    screen.getByRole('button', { name: 'Datei auf GitHub öffnen' }).click();
    expect(open).toHaveBeenCalledWith(
      `https://github.com/STUPA-MAKERS/STUPA-Workflow/blob/${SHA}/specs/requirements/functional/sources/refs/000005_commit-sha.md`,
      '_blank',
      'noopener',
    );
    open.mockRestore();
  });

  it('notImplemented: implementation null shows Nicht umgesetzt (§F/references/paths/000023)', async () => {
    await show(spec());
    expect(screen.getByText('Nicht umgesetzt')).toBeTruthy();
    expect(screen.getByText('fehlt')).toBeTruthy();
  });

  it('formatError: shows each violation (§F/specs/list/000014)', async () => {
    await show(spec({ errors: ['no front matter', 'scope must be a list of paths'] }));
    expect(screen.getByText('Fehler')).toBeTruthy();
    expect(screen.getByText('no front matter')).toBeTruthy();
    expect(screen.getByText('scope must be a list of paths')).toBeTruthy();
  });
});
