import type { Spec } from './model';
import {
  attributeText,
  biggestModule,
  classModules,
  elementLines,
  elementsForSpec,
  filterClasses,
  kindOf,
  specsForPath,
  umlRows,
  viewLabel,
  type UmlData,
  type UmlView,
} from './uml';

function spec(id: string, implementation: string[] | null): Spec {
  return {
    id,
    num: id.slice(-6),
    file: `specs/${id}.md`,
    title: id,
    kind: 'style',
    status: 'approved',
    owner: 'o',
    updated: '2026-11-11',
    replacedBy: null,
    tests: [],
    implementation: implementation?.map((path) => ({ path, exists: true })) ?? null,
    scope: [],
    body: '',
    errors: [],
    codeRefs: [],
    mentions: [],
    mentionedBy: [],
    replaces: [],
  };
}

const CLASSES: UmlData = {
  view: 'classes',
  title: 'Database models',
  elements: [
    { id: 'Vote', name: 'Vote', path: 'backend/app/modules/voting/models.py', module: 'voting', attributes: [{ name: 'id', type: 'UUID', primaryKey: true, nullable: false }] },
    { id: 'Ballot', name: 'Ballot', path: 'backend/app/modules/voting/models.py', module: 'voting', attributes: [{ name: 'note', type: 'TEXT', nullable: true }] },
    { id: 'Meeting', name: 'Meeting', path: 'backend/app/modules/meetings/models.py', module: 'meetings' },
    { id: 'Ticket', name: 'Ticket', path: 'backend/app/modules/tickets/models.py', module: 'tickets' },
  ],
  edges: [
    { from: 'Ballot', to: 'Vote', column: 'vote_id', multiplicity: '*' },
    { from: 'Vote', to: 'Meeting', column: 'meeting_id', multiplicity: '*' },
  ],
};

const view = (key: string, data: UmlData | null = CLASSES): UmlView => ({ key, file: `specs/uml/${key}.json`, data, errors: [] });

describe('uml', () => {
  it('kindOf: a file without a fixed name is a state view (§F/uml/views/000095)', () => {
    expect(kindOf(view('components'))).toBe('components');
    expect(kindOf(view('vote-status'))).toBe('state');
    const t = (k: string): string => `T:${k}`;
    expect(viewLabel(view('classes'), t)).toBe('T:uml.classes');
    expect(viewLabel(view('vote-status', { ...CLASSES, title: 'Vote' }), t)).toBe('Vote');
  });

  it('filterClasses: one module and the classes linked to it (§F/uml/views/000096)', () => {
    const shown = filterClasses(CLASSES, 'voting');
    expect(shown.elements.map((e) => e.id)).toEqual(['Vote', 'Ballot', 'Meeting']);
    expect(shown.edges).toHaveLength(2);
    expect(filterClasses(CLASSES, '')).toBe(CLASSES);
    expect(classModules(CLASSES)).toEqual(['meetings', 'tickets', 'voting']);
    expect(biggestModule(CLASSES)).toBe('voting');
  });

  it('umlRows: each element with the lines at it (§F/uml/views/000097)', () => {
    const rows = umlRows('classes', CLASSES);
    expect(rows.map((r) => r.element.id)).toEqual(['Ballot', 'Meeting', 'Ticket', 'Vote']);
    const vote = rows.find((r) => r.element.id === 'Vote');
    expect(vote?.outgoing.map((e) => e.to)).toEqual(['Meeting']);
    expect(vote?.incoming.map((e) => e.from)).toEqual(['Ballot']);
    expect(vote?.lines).toEqual(['id: UUID {PK}']);
    const layered = umlRows('components', {
      view: 'components',
      title: 'M',
      elements: [
        { id: 'b', name: 'b', path: 'b', layer: 2 },
        { id: 'a', name: 'a', path: 'a', layer: 5 },
      ],
    });
    expect(layered.map((r) => r.element.id)).toEqual(['b', 'a']);
  });

  it('attributeText: the text of a box and its lines', () => {
    expect(attributeText({ name: 'note', type: 'TEXT', nullable: true })).toBe('note: TEXT [0..1]');
    expect(elementLines('deployment', { id: 'api', name: 'api', path: 'x', build: 'backend', networks: ['a', 'b'] })).toEqual([
      'build: backend',
      'networks: a, b',
    ]);
    expect(elementLines('deployment', { id: 'db', name: 'db', path: 'x', image: 'postgres:16', networks: ['a'] })).toEqual([
      'postgres:16',
    ]);
    expect(elementLines('components', { id: 'm', name: 'm', path: 'x', layer: 1 })).toEqual([]);
  });

  it('specsForPath: a spec whose implementation holds the path or a folder above it (§F/uml/links/000098)', () => {
    const specs = [
      spec('S/a/b/000001', ['backend/app/modules/voting']),
      spec('S/a/b/000002', ['backend/app/modules/voting/models.py']),
      spec('S/a/b/000003', ['backend/app/modules/votingx']),
      spec('S/a/b/000004', null),
    ];
    expect(specsForPath(specs, 'backend/app/modules/voting/models.py').map((s) => s.id)).toEqual([
      'S/a/b/000001',
      'S/a/b/000002',
    ]);
  });

  it('elementsForSpec: the elements below the implementation of a spec (§F/uml/links/000099)', () => {
    const views = [view('classes'), view('broken', null)];
    const hits = elementsForSpec(views, spec('S/a/b/000001', ['backend/app/modules/voting/', 'backend']));
    expect(hits.map((h) => h.element.id)).toEqual(['Vote', 'Ballot']);
    expect(elementsForSpec(views, spec('S/a/b/000002', ['backend']))).toEqual([]);
    expect(elementsForSpec(views, spec('S/a/b/000003', null))).toEqual([]);
  });
});
