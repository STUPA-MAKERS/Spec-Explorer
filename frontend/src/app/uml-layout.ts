/**
 * The layout of a UML view with ELK (elkjs). §F/uml/views/000096
 *
 * The page stores no positions: each view is laid out from its data each time. `umlGraph` is
 * pure and builds the ELK input for one kind of view; `layoutUml` loads elkjs on first use, so
 * the library is in its own chunk and only the page `UML` loads it.
 *
 * - Komponenten: layered from top to bottom, one partition per layer of the import contract.
 * - Klassen: one frame per module with its class boxes, the foreign keys between the boxes.
 * - Verteilung: one frame per network (the first network of a service), `depends_on` dashed.
 * - State view: left to right, a start point before the initial state.
 */
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api';
import {
  UML_CHAR_W,
  UML_HEAD_H,
  UML_LINE_H,
  UML_PAD_X,
  type UmlBox,
  type UmlLayout,
  type UmlLine,
} from '@stupa-makers/ui-kit/views/uml';
import { edgeLabel, edgesOf, elementLines, type UmlData, type UmlEdge, type UmlKind } from './uml';

export type { UmlBox, UmlLayout, UmlLine };

/** The text sizes of the drawing: the UML view of the kit draws with the same. */
const CHAR_W = UML_CHAR_W;
const LINE_H = UML_LINE_H;
const HEAD_H = UML_HEAD_H;
const PAD_X = UML_PAD_X;
export const START = '__start';
const FRAME_PAD = 28;

/** A box and a line while the layout builds them; the kit view takes them read-only. */
type Box = { -readonly [K in keyof UmlBox]: UmlBox[K] };
type Line = { -readonly [K in keyof UmlLine]: UmlLine[K] };

function textWidth(text: string): number {
  return text.length * CHAR_W;
}

function boxSize(kind: UmlKind, name: string, lines: string[]): { width: number; height: number } {
  if (kind === 'state') return { width: Math.max(textWidth(name) + 2 * PAD_X, 96), height: 40 };
  const widest = Math.max(textWidth(name) + 16, ...lines.map(textWidth));
  return { width: Math.ceil(widest + 2 * PAD_X), height: HEAD_H + lines.length * LINE_H + (lines.length ? 8 : 0) };
}

function frameOf(kind: UmlKind, el: UmlData['elements'][number]): string | null {
  if (kind === 'classes') return el.module ?? null;
  if (kind === 'deployment') return el.networks?.[0] ?? null;
  return null;
}

const BASE: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.json.shapeCoords': 'ROOT',
  'elk.json.edgeCoords': 'ROOT',
  'elk.spacing.nodeNode': '28',
  'elk.layered.spacing.nodeNodeBetweenLayers': '56',
  'elk.spacing.edgeLabel': '4',
  'elk.edgeLabels.inline': 'false',
  'elk.layered.edgeLabels.sideSelection': 'ALWAYS_UP',
};

/** The ELK input of one view. Pure, so the unit tests read it without elkjs. */
export function umlGraph(kind: UmlKind, data: UmlData): ElkNode {
  const frames = new Map<string, ElkNode>();
  const root: ElkNode = {
    id: '__root',
    layoutOptions: {
      ...BASE,
      'elk.direction': kind === 'state' ? 'RIGHT' : 'DOWN',
      ...(kind === 'components' ? { 'elk.partitioning.activate': 'true' } : {}),
    },
    children: [],
    edges: [],
  };
  for (const el of data.elements) {
    const lines = elementLines(kind, el);
    const size = boxSize(kind, el.name, lines);
    const node: ElkNode = {
      id: el.id,
      ...size,
      labels: [{ text: el.name }],
      layoutOptions: kind === 'components' ? { 'elk.partitioning.partition': String(el.layer ?? 0) } : {},
    };
    const frame = frameOf(kind, el);
    if (frame) {
      let parent = frames.get(frame);
      if (!parent) {
        parent = {
          id: `__frame:${frame}`,
          labels: [{ text: frame }],
          layoutOptions: { 'elk.padding': `[top=${FRAME_PAD + 8},left=16,bottom=16,right=16]` },
          children: [],
        };
        frames.set(frame, parent);
        root.children?.push(parent);
      }
      parent.children?.push(node);
    } else {
      root.children?.push(node);
    }
  }
  const initial = data.elements.find((e) => e.initial);
  if (kind === 'state' && initial) {
    root.children?.push({ id: START, width: 18, height: 18 });
    root.edges?.push({ id: '__start-edge', sources: [START], targets: [initial.id] });
  }
  edgesOf(data).forEach((e, i) => {
    const label = edgeLabel(kind, e);
    const edge: ElkExtendedEdge = { id: `e${i}`, sources: [e.from], targets: [e.to] };
    if (label) edge.labels = [{ text: label, width: textWidth(label), height: 14 }];
    root.edges?.push(edge);
  });
  return root;
}

type Elk = { layout(graph: ElkNode): Promise<ElkNode> };
let elk: Promise<Elk> | null = null;

function collect(node: ElkNode, kind: UmlKind, data: UmlData, boxes: Box[]): void {
  for (const child of node.children ?? []) {
    const x = child.x ?? 0;
    const y = child.y ?? 0;
    const w = child.width ?? 0;
    const h = child.height ?? 0;
    if (child.id === START) {
      boxes.push({ id: START, role: 'start', name: '', lines: [], x, y, w, h });
    } else if (child.id.startsWith('__frame:')) {
      boxes.push({ id: child.id, role: 'frame', name: child.labels?.[0]?.text ?? '', lines: [], x, y, w, h });
      collect(child, kind, data, boxes);
    } else {
      const el = data.elements.find((e) => e.id === child.id);
      if (el) boxes.push({ id: el.id, role: 'element', name: el.name, lines: elementLines(kind, el), x, y, w, h });
    }
  }
}

const ROW_GAP = 120;
const BOX_GAP = 20;
const ROW_MAX = 1500;
const COMP_H = 34;

/**
 * §F/uml/views/000096: the component view in one row per layer, layer 1 at the top. A row
 * wraps when it is wider than `ROW_MAX`. An import is a curve from the bottom of the importer to
 * the top of the imported module; an import in the same row is a curve below the row.
 */
export function layoutComponents(data: UmlData, layerName: (n: number) => string): UmlLayout {
  const layers = [...new Set(data.elements.map((e) => e.layer ?? 0))].sort((a, b) => a - b);
  const boxes: Box[] = [];
  const frames: Box[] = [];
  const at = new Map<string, Box>();
  let y = 0;
  let width = 0;
  for (const layer of layers) {
    const els = data.elements.filter((e) => (e.layer ?? 0) === layer).sort((a, b) => a.name.localeCompare(b.name));
    const top = y;
    let x = 16;
    let rowY = y + FRAME_PAD + 8;
    for (const el of els) {
      const w = Math.ceil(textWidth(el.name) + 2 * PAD_X + 8);
      if (x + w > ROW_MAX && x > 16) {
        x = 16;
        rowY += COMP_H + BOX_GAP;
      }
      const box: Box = { id: el.id, role: 'element', name: el.name, lines: [], x, y: rowY, w, h: COMP_H };
      boxes.push(box);
      at.set(el.id, box);
      x += w + BOX_GAP;
      width = Math.max(width, x);
    }
    const bottom = rowY + COMP_H + 16;
    frames.push({ id: `__frame:${layer}`, role: 'frame', name: layerName(layer), lines: [], x: 0, y: top, w: 0, h: bottom - top });
    y = bottom + ROW_GAP;
  }
  for (const f of frames) f.w = width;
  const edges = edgesOf(data);
  const slots = (id: string, side: 'out' | 'in'): Map<UmlEdge, number> => {
    const mine = edges.filter((e) => (side === 'out' ? e.from : e.to) === id);
    const other = (e: UmlEdge): Box | undefined => at.get(side === 'out' ? e.to : e.from);
    mine.sort((a, b) => (other(a)?.x ?? 0) - (other(b)?.x ?? 0));
    return new Map(mine.map((e, i) => [e, (i + 1) / (mine.length + 1)]));
  };
  const outSlots = new Map(data.elements.map((e) => [e.id, slots(e.id, 'out')]));
  const inSlots = new Map(data.elements.map((e) => [e.id, slots(e.id, 'in')]));
  const lines: Line[] = edges.flatMap((e, i) => {
    const a = at.get(e.from);
    const b = at.get(e.to);
    if (!a || !b) return [];
    const sx = a.x + a.w * (outSlots.get(e.from)?.get(e) ?? 0.5);
    const ex = b.x + b.w * (inSlots.get(e.to)?.get(e) ?? 0.5);
    const below = b.y > a.y + 1;
    const sy = a.y + a.h;
    const ey = below ? b.y : b.y + b.h;
    const bend = below ? Math.max(40, (ey - sy) / 2) : 46;
    const points = [
      { x: sx, y: sy },
      { x: sx, y: sy + bend },
      { x: ex, y: below ? ey - bend : ey + bend },
      { x: ex, y: ey },
    ];
    const mid = { x: (sx + ex) / 2, y: below ? (sy + ey) / 2 : sy + bend * 0.75 };
    const count = e.count ?? 1;
    return [
      {
        id: `e${i}`,
        from: e.from,
        to: e.to,
        points,
        label: String(count),
        labelX: mid.x + 4,
        labelY: mid.y,
        dashed: false,
        curve: true,
        weight: 1 + Math.log2(count) * 0.45,
        ends: null,
      },
    ];
  });
  return { width, height: y - ROW_GAP, boxes: [...frames, ...boxes], lines };
}

/** Lay out one view. Frames come first in `boxes`, so the drawing puts them behind. */
export async function layoutUml(
  kind: UmlKind,
  data: UmlData,
  layerName: (n: number) => string = (n) => `layer ${n}`,
): Promise<UmlLayout> {
  if (kind === 'components') return layoutComponents(data, layerName);
  elk ??= import('elkjs/lib/elk.bundled.js').then((m) => new m.default() as unknown as Elk);
  const out = await (await elk).layout(umlGraph(kind, data));
  const boxes: Box[] = [];
  collect(out, kind, data, boxes);
  boxes.sort((a, b) => Number(b.role === 'frame') - Number(a.role === 'frame'));
  const edges = edgesOf(data);
  const lines: Line[] = (out.edges ?? []).map((e) => {
    const section = e.sections?.[0];
    const points = section ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint] : [];
    const label = e.labels?.[0];
    const source = e.id === '__start-edge' ? null : edges[Number(e.id.slice(1))];
    return {
      id: e.id,
      from: e.sources[0],
      to: e.targets[0],
      points,
      label: label?.text ?? '',
      labelX: label?.x ?? 0,
      labelY: (label?.y ?? 0) + 11,
      dashed: kind === 'deployment',
      curve: false,
      weight: 1.2,
      ends: kind === 'classes' && source ? [source.multiplicity ?? '*', '1'] : null,
    };
  });
  return { width: out.width ?? 0, height: out.height ?? 0, boxes, lines };
}
