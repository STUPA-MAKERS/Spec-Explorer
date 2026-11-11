import { linePath, endPlace } from './uml-diagram.component';
import { layoutComponents, umlGraph, START } from './uml-layout';
import type { UmlData } from './uml';

const COMPONENTS: UmlData = {
  view: 'components',
  title: 'Backend modules',
  elements: [
    { id: 'admin', name: 'admin', path: 'backend/app/modules/admin', layer: 1 },
    { id: 'voting', name: 'voting', path: 'backend/app/modules/voting', layer: 3 },
    { id: 'flow', name: 'flow', path: 'backend/app/modules/flow', layer: 3 },
    { id: 'shared', name: 'shared', path: 'backend/app/shared', layer: 6 },
  ],
  edges: [
    { from: 'admin', to: 'voting', count: 4 },
    { from: 'voting', to: 'flow', count: 2 },
    { from: 'voting', to: 'shared', count: 9 },
  ],
};

describe('umlLayout', () => {
  it('layoutComponents: one row per layer, layer 1 at the top (§F/uml/views/000096)', () => {
    const l = layoutComponents(COMPONENTS, (n) => `Schicht ${n}`);
    const frames = l.boxes.filter((b) => b.role === 'frame');
    expect(frames.map((f) => f.name)).toEqual(['Schicht 1', 'Schicht 3', 'Schicht 6']);
    const y = (id: string): number => l.boxes.find((b) => b.id === id)?.y ?? -1;
    expect(y('admin')).toBeLessThan(y('voting'));
    expect(y('voting')).toBe(y('flow'));
    expect(y('voting')).toBeLessThan(y('shared'));
    expect(l.lines.map((x) => x.label)).toEqual(['4', '2', '9']);
    expect(l.lines.every((x) => x.curve && x.points.length === 4)).toBe(true);
    expect(l.lines[2].weight).toBeGreaterThan(l.lines[1].weight);
  });

  it('umlGraph: a frame per module and a start point for a state view', () => {
    const classes = umlGraph('classes', {
      view: 'classes',
      title: 'C',
      elements: [
        { id: 'Vote', name: 'Vote', path: 'x', module: 'voting', attributes: [{ name: 'id', type: 'UUID' }] },
        { id: 'Meeting', name: 'Meeting', path: 'y', module: 'meetings' },
      ],
      edges: [{ from: 'Vote', to: 'Meeting', column: 'meeting_id' }],
    });
    expect(classes.children?.map((c) => c.id)).toEqual(['__frame:voting', '__frame:meetings']);
    expect(classes.edges?.[0].labels?.[0].text).toBe('meeting_id');
    const state = umlGraph('state', {
      view: 'state',
      title: 'S',
      elements: [
        { id: 'draft', name: 'draft', path: 'x', initial: true },
        { id: 'open', name: 'open', path: 'x' },
      ],
      edges: [{ from: 'draft', to: 'open', trigger: 'open it' }],
    });
    expect(state.children?.map((c) => c.id)).toContain(START);
    expect(state.edges?.find((e) => e.sources[0] === START)?.targets).toEqual(['draft']);
    expect(state.layoutOptions?.['elk.direction']).toBe('RIGHT');
  });

  it('linePath: corners, curves and the end labels', () => {
    const base = { id: 'e', from: 'a', to: 'b', label: '', labelX: 0, labelY: 0, dashed: false, weight: 1, ends: null };
    expect(linePath({ ...base, curve: false, points: [{ x: 0, y: 0 }, { x: 0, y: 10 }] })).toBe('M0,0 L0,10');
    expect(
      linePath({ ...base, curve: true, points: [{ x: 0, y: 0 }, { x: 0, y: 5 }, { x: 9, y: 5 }, { x: 9, y: 10 }] }),
    ).toBe('M0,0 C0,5 9,5 9,10');
    const line = { ...base, curve: false, points: [{ x: 0, y: 0 }, { x: 0, y: 100 }] };
    expect(endPlace(line, false).y).toBeGreaterThan(0);
    expect(endPlace(line, true).y).toBeLessThan(100);
  });
});
