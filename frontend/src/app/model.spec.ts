import {
  blobUrl,
  codeExcerpt,
  filterRefs,
  filterSpecs,
  groupSpecs,
  refRows,
  statusOf,
  type CodeRef,
  type SourceIndex,
  type Spec,
} from './model';

function spec(id: string, title: string, extra: Partial<Spec> = {}): Spec {
  const kind = id.startsWith('NF') ? 'non-functional' : id.startsWith('S') ? 'style' : 'functional';
  return {
    id,
    num: id.slice(-6),
    file: `specs/${id}.md`,
    title,
    kind,
    status: 'approved',
    owner: 'o',
    updated: '2026-11-06',
    replacedBy: null,
    tests: [],
    implementation: null,
    scope: [],
    body: '',
    errors: [],
    codeRefs: [],
    mentions: [],
    mentionedBy: [],
    replaces: [],
    ...extra,
  };
}

function ref(id: string, path: string, line = 1): CodeRef {
  return { ref: id, path, line, text: '', from: 1, context: [] };
}

const SPECS = [
  spec('S/specs/format/000046', 'Front matter'),
  spec('F/sources/refs/000005', 'Commit SHA', { status: 'draft' }),
  spec('F/sources/refs/000004', 'Ref kinds'),
  spec('NF/security/access/000027', 'Read only'),
  spec('F/specs/list/000010', 'Every spec file', { errors: ['no front matter'] }),
];

describe('filterSpecs', () => {
  it('matchSearch: matches number, rule ID and title without case (§F/specs/list/000012)', () => {
    expect(filterSpecs(SPECS, { q: '000005', status: '', kind: '' }).map((s) => s.title)).toEqual([
      'Commit SHA',
    ]);
    expect(filterSpecs(SPECS, { q: 'nf/SECURITY', status: '', kind: '' })).toHaveLength(1);
    expect(filterSpecs(SPECS, { q: 'REF KINDS', status: '', kind: '' })).toHaveLength(1);
  });

  it('statusAndKind: one filter each; without a filter every status shows (§F/specs/list/000013)', () => {
    expect(filterSpecs(SPECS, { q: '', status: '', kind: '' })).toHaveLength(5);
    expect(filterSpecs(SPECS, { q: '', status: 'draft', kind: '' })).toHaveLength(1);
    expect(filterSpecs(SPECS, { q: '', status: '', kind: 'style' })).toHaveLength(1);
  });

  it('formatError: a broken spec has the status error (§F/specs/list/000014)', () => {
    expect(statusOf(SPECS[4])).toBe('error');
    expect(filterSpecs(SPECS, { q: '', status: 'error', kind: '' })[0].id).toBe(
      'F/specs/list/000010',
    );
  });
});

describe('groupSpecs', () => {
  it('treeGroups: kind, area and topic in index order, numbers sorted (§F/specs/list/000011)', () => {
    const groups = groupSpecs(SPECS);
    expect(groups.map((g) => g.key)).toEqual([
      'F/sources/refs',
      'F/specs/list',
      'NF/security/access',
      'S/specs/format',
    ]);
    expect(groups[0].topic).toBe('sources / refs');
    expect(groups[0].specs.map((s) => s.num)).toEqual(['000004', '000005']);
  });
});

describe('references', () => {
  const index: SourceIndex = {
    repo: 'r',
    ref: 'main',
    sha: 'a'.repeat(40),
    specs: [spec('F/a/b/000001', 'A', { codeRefs: [ref('F/a/b/000001', 'backend/app/x.py', 3)] })],
    broken: [ref('F/a/b/000099', 'frontend/src/y.ts', 9)],
  };

  it('refRows: every reference, the ones without a spec first (§F/references/code/000021)', () => {
    expect(refRows(index).map((r) => [r.ref, r.ok])).toEqual([
      ['F/a/b/000099', false],
      ['F/a/b/000001', true],
    ]);
    expect(refRows(null)).toEqual([]);
  });

  it('specFilter: the filter Spec limits the list to one group (§F/references/code/000021)', () => {
    const rows = refRows(index);
    expect(filterRefs(rows, { q: '', spec: '' })).toHaveLength(2);
    expect(filterRefs(rows, { q: '', spec: 'ok' }).map((x) => x.row.ref)).toEqual(['F/a/b/000001']);
    expect(filterRefs(rows, { q: '', spec: 'none' }).map((x) => x.i)).toEqual([0]);
  });

  it('refSearch: matches rule ID and path without case (§F/references/code/000072)', () => {
    const rows = refRows(index);
    expect(filterRefs(rows, { q: '000099', spec: '' })).toHaveLength(1);
    expect(filterRefs(rows, { q: 'BACKEND/app', spec: '' })[0].row.path).toBe('backend/app/x.py');
    expect(filterRefs(rows, { q: 'nothing', spec: '' })).toEqual([]);
  });
});

describe('codeExcerpt', () => {
  it('excerpt: lines with numbers, common indent removed (§F/references/code/000071)', () => {
    const md = codeExcerpt({ from: 8, context: ['    a', '', '      b ```', '    c'] });
    expect(md).toBe('```\n 8  a\n 9  \n10    b ```\n11  c\n```');
    expect(codeExcerpt({ from: 1, context: [] })).toBe('```\n\n```');
  });
});

describe('blobUrl', () => {
  it('lineLink: links a line at the commit SHA (§F/references/code/000020)', () => {
    expect(blobUrl('STUPA-Workflow', 'abc', 'backend/a b.py', 7)).toBe(
      'https://github.com/STUPA-MAKERS/STUPA-Workflow/blob/abc/backend/a%20b.py#L7',
    );
  });

  it('fileLink: links a file at the commit SHA, the root as a tree (§F/specs/detail/000017)', () => {
    expect(blobUrl('ui-kit', 'abc', 'specs/x.md')).toBe(
      'https://github.com/STUPA-MAKERS/ui-kit/blob/abc/specs/x.md',
    );
    expect(blobUrl('ui-kit', 'abc', '.')).toBe('https://github.com/STUPA-MAKERS/ui-kit/tree/abc/');
  });
});
