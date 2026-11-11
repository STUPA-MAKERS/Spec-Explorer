/**
 * The UML views of a source and the pure functions of the page `UML`: the order and the name
 * of a view, the module filter of the class view, the list of a view, and the match of an
 * element with the specs. The functions hold no state, so the unit tests call them directly.
 */
import type { Spec } from './model';

export interface UmlAttribute {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  values?: string[];
}

export interface UmlElement {
  id: string;
  name: string;
  path: string;
  layer?: number;
  module?: string;
  table?: string;
  attributes?: UmlAttribute[];
  image?: string;
  build?: string;
  networks?: string[];
  initial?: boolean;
}

export interface UmlEdge {
  from: string;
  to: string;
  count?: number;
  column?: string;
  onDelete?: string;
  multiplicity?: string;
  trigger?: string;
  path?: string;
}

export interface UmlData {
  view: string;
  title: string;
  table?: string;
  column?: string;
  elements: UmlElement[];
  edges?: UmlEdge[];
}

/** One file of `specs/uml/`: the data, or `null` and the format errors. */
export interface UmlView {
  key: string;
  file: string;
  data: UmlData | null;
  errors: string[];
}

export type UmlKind = 'components' | 'classes' | 'deployment' | 'state';

/** The kind of drawing of a view. A file that names no fixed view is a state view. */
export function kindOf(view: UmlView): UmlKind {
  return view.key === 'components' || view.key === 'classes' || view.key === 'deployment'
    ? view.key
    : 'state';
}

/** The label key of a fixed view; a state view shows its title. */
export function viewLabel(view: UmlView, t: (key: string) => string): string {
  const kind = kindOf(view);
  return kind === 'state' ? (view.data?.title ?? view.key) : t(`uml.${kind}`);
}

/** The edges of a view, never `undefined`. */
export function edgesOf(data: UmlData): UmlEdge[] {
  return data.edges ?? [];
}

/**
 * §F/uml/views/000096: the classes of one module and the classes that a foreign key links to
 * them. An empty module shows every class.
 */
export function filterClasses(data: UmlData, module: string): UmlData {
  if (!module) return data;
  const own = new Set(data.elements.filter((e) => e.module === module).map((e) => e.id));
  const edges = edgesOf(data).filter((e) => own.has(e.from) || own.has(e.to));
  const keep = new Set([...own, ...edges.flatMap((e) => [e.from, e.to])]);
  return { ...data, elements: data.elements.filter((e) => keep.has(e.id)), edges };
}

/** The module with the most classes; the first by name on a tie. */
export function biggestModule(data: UmlData): string {
  const count = new Map<string, number>();
  for (const e of data.elements) if (e.module) count.set(e.module, (count.get(e.module) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? '';
}

/** The modules of the class view, sorted. */
export function classModules(data: UmlData): string[] {
  return [...new Set(data.elements.map((e) => e.module ?? '').filter(Boolean))].sort();
}

/** The text of one line of an element in the drawing and in the list. */
export function attributeText(a: UmlAttribute): string {
  const key = a.primaryKey ? ' {PK}' : '';
  const nullable = a.nullable && !a.primaryKey ? ' [0..1]' : '';
  return `${a.name}: ${a.type}${nullable}${key}`;
}

/** The lines below the name of an element, by the kind of the view. */
export function elementLines(kind: UmlKind, e: UmlElement): string[] {
  if (kind === 'classes') return (e.attributes ?? []).map(attributeText);
  if (kind === 'deployment') {
    const made = e.build ? `build: ${e.build}` : e.image ? e.image : '';
    const nets = (e.networks ?? []).length > 1 ? [`networks: ${(e.networks ?? []).join(', ')}`] : [];
    return [made, ...nets].filter(Boolean);
  }
  return [];
}

/** The label of an edge in the drawing and in the list. */
export function edgeLabel(kind: UmlKind, e: UmlEdge): string {
  if (kind === 'components') return String(e.count ?? '');
  if (kind === 'classes') return e.column ?? '';
  if (kind === 'state') return e.trigger ?? '';
  return '';
}

/** One row of the list of a view: an element and the lines that start or end at it. */
export interface UmlRow {
  element: UmlElement;
  lines: string[];
  outgoing: UmlEdge[];
  incoming: UmlEdge[];
}

/**
 * §F/uml/views/000097: each element with its lines and the edges at it, in the order of the
 * drawing (by layer for the component view, else by name).
 */
export function umlRows(kind: UmlKind, data: UmlData): UmlRow[] {
  const edges = edgesOf(data);
  const order = (e: UmlElement): [number, string] => [kind === 'components' ? (e.layer ?? 0) : 0, e.name];
  return [...data.elements]
    .sort((a, b) => {
      const [la, na] = order(a);
      const [lb, nb] = order(b);
      return la - lb || na.localeCompare(nb);
    })
    .map((element) => ({
      element,
      lines: elementLines(kind, element),
      outgoing: edges.filter((e) => e.from === element.id),
      incoming: edges.filter((e) => e.to === element.id),
    }));
}

/** Whether `path` is `base` or lies below the folder `base`. */
export function pathCovers(base: string, path: string): boolean {
  const b = base.replace(/\/+$/, '');
  return path === b || path.startsWith(`${b}/`);
}

/**
 * §F/uml/links/000098: the specs whose `implementation` holds the path of the element or a
 * folder above it.
 */
export function specsForPath(specs: readonly Spec[], path: string): Spec[] {
  return specs.filter((s) => (s.implementation ?? []).some((p) => pathCovers(p.path, path)));
}

/** One element of a view that a spec implements. */
export interface UmlHit {
  view: UmlView;
  element: UmlElement;
}

/**
 * §F/uml/links/000099: the UML elements whose path is below a path of the `implementation` of
 * the spec. A path that is a whole repository folder (`backend`, `frontend`, `specs`) holds too
 * much to say anything, so it does not count.
 */
export function elementsForSpec(views: readonly UmlView[], spec: Spec): UmlHit[] {
  const paths = (spec.implementation ?? [])
    .map((p) => p.path.replace(/\/+$/, ''))
    .filter((p) => p.includes('/'));
  if (!paths.length) return [];
  return views.flatMap((view) =>
    (view.data?.elements ?? [])
      .filter((element) => paths.some((p) => pathCovers(p, element.path)))
      .map((element) => ({ view, element })),
  );
}
