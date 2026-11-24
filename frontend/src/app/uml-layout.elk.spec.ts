import { layoutUml } from './uml-layout';
import type { UmlData } from './uml';

describe('elkLayout', () => {
  const data = (view: string, extra: Partial<UmlData> = {}): UmlData => ({
    view,
    title: view,
    elements: [
      { id: 'a', name: 'a', path: 'x', module: 'm', networks: ['n', 'o'], build: 'backend', initial: true, attributes: [{ name: 'id', type: 'UUID' }] },
      { id: 'b', name: 'b', path: 'y', module: 'm', networks: ['n'], image: 'db:1' },
    ],
    edges: [{ from: 'a', to: 'b', column: 'b_id', multiplicity: '*', trigger: 'go' }],
    ...extra,
  });

  it('layoutUml: classes, deployment and a state view (§F/uml/views/000096)', async () => {
    const classes = await layoutUml('classes', data('classes'));
    expect(classes.boxes[0].role).toBe('frame');
    expect(classes.lines[0].ends).toEqual(['*', '1']);
    expect(classes.lines[0].points.length).toBeGreaterThan(1);
    const deployment = await layoutUml('deployment', data('deployment'));
    expect(deployment.lines[0].dashed).toBe(true);
    const state = await layoutUml('state', data('state'));
    expect(state.boxes.some((b) => b.role === 'start')).toBe(true);
    expect(state.lines.map((l) => l.label)).toContain('go');
    const comps = await layoutUml('components', data('components', { edges: [{ from: 'a', to: 'b', count: 1 }] }));
    expect(comps.lines[0].curve).toBe(true);
  });
});
