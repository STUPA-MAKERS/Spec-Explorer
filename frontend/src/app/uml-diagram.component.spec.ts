import { TestBed } from '@angular/core/testing';
import { provideUiKit } from '@stupa-makers/ui-kit';
import { UmlDiagramComponent } from './uml-diagram.component';
import { layoutUml, type UmlLayout } from './uml-layout';
import type { UmlData } from './uml';

const LAYOUT: UmlLayout = {
  width: 400,
  height: 200,
  boxes: [
    { id: '__frame:x', role: 'frame', name: 'x', lines: [], x: 0, y: 0, w: 400, h: 200 },
    { id: '__start', role: 'start', name: '', lines: [], x: 0, y: 0, w: 18, h: 18 },
    { id: 'a', role: 'element', name: 'a', lines: ['id: UUID'], x: 10, y: 10, w: 80, h: 60 },
    { id: 'b', role: 'element', name: 'b', lines: [], x: 200, y: 10, w: 80, h: 30 },
  ],
  lines: [
    {
      id: 'e0',
      from: 'a',
      to: 'b',
      points: [{ x: 90, y: 40 }, { x: 200, y: 40 }],
      label: 'fk',
      labelX: 120,
      labelY: 30,
      dashed: false,
      curve: false,
      weight: 1,
      ends: ['*', '1'],
    },
  ],
};

function create(selected: string | null = null) {
  TestBed.configureTestingModule({ providers: [provideUiKit()] });
  const fixture = TestBed.createComponent(UmlDiagramComponent);
  fixture.componentRef.setInput('layout', LAYOUT);
  fixture.componentRef.setInput('selected', selected);
  fixture.componentRef.setInput('label', 'Diagramm');
  fixture.detectChanges();
  return fixture;
}

describe('UmlDiagramComponent', () => {
  it('drawing: frames, boxes, lines and end labels (§F/uml/views/000096)', () => {
    const fixture = create('a');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.ud__frame-box').length).toBe(1);
    expect(el.querySelectorAll('.ud__box').length).toBe(2);
    expect(el.querySelector('.ud__box--on')?.textContent).toContain('a');
    expect(el.querySelector('.ud__edge--on')).toBeTruthy();
    expect([...el.querySelectorAll('.ud__label')].map((t) => t.textContent)).toEqual(['fk', '*', '1']);
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Diagramm');
  });

  it('pick: a click selects an element (§F/uml/links/000098)', () => {
    const fixture = create();
    const picked: string[] = [];
    fixture.componentInstance.pick.subscribe((id) => picked.push(id));
    (fixture.nativeElement as HTMLElement).querySelectorAll<SVGGElement>('.ud__box')[1].dispatchEvent(new MouseEvent('click'));
    expect(picked).toEqual(['b']);
  });

  it('zoom: buttons, wheel and keys zoom, drag and arrows move (§F/uml/views/000096)', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    c.fit();
    const start = c.scale();
    c.zoomBy(2);
    expect(c.scale()).toBeCloseTo(Math.min(3, start * 2));
    c.onKey(new KeyboardEvent('keydown', { key: '-' }));
    c.onKey(new KeyboardEvent('keydown', { key: '+' }));
    c.onKey(new KeyboardEvent('keydown', { key: '0' }));
    expect(c.scale()).toBeCloseTo(start);
    const x = c.x();
    c.onKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(c.x()).toBe(x + 40);
    c.onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    c.onKey(new KeyboardEvent('keydown', { key: 'x' }));
    const wheel = new WheelEvent('wheel', { deltaY: -100 });
    c.onWheel(wheel);
    expect(c.scale()).toBeGreaterThan(start);
    c.onWheel(new WheelEvent('wheel', { deltaY: 100 }));
    const down = { button: 0, pointerId: 1, clientX: 0, clientY: 0, currentTarget: null } as unknown as PointerEvent;
    c.onDown(down);
    c.onMove({ pointerId: 1, clientX: 2, clientY: 0, currentTarget: null } as unknown as PointerEvent);
    expect(c.dragging()).toBe(false);
    c.onMove({ pointerId: 1, clientX: 50, clientY: 30, currentTarget: null } as unknown as PointerEvent);
    expect(c.dragging()).toBe(true);
    c.onMove({ pointerId: 2, clientX: 0, clientY: 0, currentTarget: null } as unknown as PointerEvent);
    c.onUp({ pointerId: 1 } as unknown as PointerEvent);
    expect(c.dragging()).toBe(false);
    c.onUp({ pointerId: 1 } as unknown as PointerEvent);
    c.onDown({ button: 2, pointerId: 3 } as unknown as PointerEvent);
  });
});

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
