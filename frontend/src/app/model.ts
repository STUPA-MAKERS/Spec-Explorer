/**
 * The data of the API and the pure functions of the pages: list filters, list groups and the
 * code excerpt of a reference. The functions hold no state, so the unit tests call them directly.
 */

import type { UmlView } from './uml';

export interface PathRef {
  path: string;
  exists: boolean;
}

export interface TestRef {
  entry: string;
  path: string;
  fn: string;
  line: number | null;
  exists: boolean;
}

export interface CodeRef {
  ref: string;
  path: string;
  line: number;
  text: string;
  from: number;
  context: string[];
}

export interface Spec {
  id: string;
  num: string;
  file: string;
  title: string;
  kind: string;
  status: string;
  owner: string;
  updated: string;
  replacedBy: string | null;
  tests: TestRef[];
  implementation: PathRef[] | null;
  scope: PathRef[];
  body: string;
  errors: string[];
  codeRefs: CodeRef[];
  mentions: string[];
  mentionedBy: string[];
  replaces: string[];
}

export interface SourceIndex {
  repo: string;
  ref: string;
  sha: string;
  specs: Spec[];
  broken: CodeRef[];
  /** §F/uml/views/000095: the views of `specs/uml/`; empty when the source has none. */
  uml: UmlView[];
}

export interface RepoRefs {
  repo: string;
  defaultBranch: string;
  branches: string[];
  tags: string[];
}

/** A reference with whether it names a spec at the source. */
export interface RefRow extends CodeRef {
  ok: boolean;
}

export const KINDS = ['functional', 'non-functional', 'style'] as const;
export const STATUSES = ['approved', 'draft', 'replaced', 'removed', 'error'] as const;
export const ORG = 'STUPA-MAKERS';
export const DEFAULT_REPO = 'STUPA-Workflow';

/** §F/sources/refs/000005: a commit SHA has 7 to 40 hexadecimal characters. */
export const SHA_RE = /^[0-9a-fA-F]{7,40}$/;
/** The form of a rule ID. */
export const RULE_ID_RE = /^(F|NF|S)(\/[a-z0-9-]+)+\/[0-9]{6}$/;

/** §F/specs/list/000014: a spec with a format violation has the status `error`. */
export function statusOf(spec: Spec): string {
  return spec.errors.length ? 'error' : spec.status;
}

export interface SpecFilter {
  q: string;
  status: string;
  kind: string;
}

/**
 * §F/specs/list/000012 and §F/specs/list/000013: the search matches the number, the rule ID
 * and the title, without case. An empty filter shows every status and every kind.
 */
export function filterSpecs(specs: readonly Spec[], f: SpecFilter): Spec[] {
  const q = f.q.trim().toLowerCase();
  return specs.filter(
    (s) =>
      (!f.status || statusOf(s) === f.status) &&
      (!f.kind || s.kind === f.kind) &&
      (!q ||
        s.num.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)),
  );
}

export interface SpecGroup {
  key: string;
  kind: string;
  topic: string;
  specs: Spec[];
}

/**
 * §F/specs/list/000011: groups by kind, area and topic in the order of the index of
 * `specs/README.md`, which sorts by rule ID. Inside a topic, the specs sort by number.
 */
export function groupSpecs(specs: readonly Spec[]): SpecGroup[] {
  const groups = new Map<string, SpecGroup>();
  for (const s of [...specs].sort((a, b) => cmp(a.id, b.id))) {
    const parts = s.id.split('/');
    const key = parts.slice(0, -1).join('/');
    let group = groups.get(key);
    if (!group) {
      group = { key, kind: s.kind, topic: parts.slice(1, -1).join(' / '), specs: [] };
      groups.set(key, group);
    }
    group.specs.push(s);
  }
  for (const g of groups.values()) g.specs.sort((a, b) => cmp(a.num, b.num));
  return [...groups.values()];
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** §F/references/code/000021: every reference; the ones without a spec come first. */
export function refRows(index: SourceIndex | null): RefRow[] {
  if (!index) return [];
  const ok = index.specs.flatMap((s) => s.codeRefs.map((r) => ({ ...r, ok: true })));
  return [...index.broken.map((r) => ({ ...r, ok: false })), ...ok];
}

export interface RefFilter {
  q: string;
  /** `''` all, `ok` with a spec, `none` without a spec. */
  spec: string;
}

/**
 * §F/references/code/000021 and §F/references/code/000072: the filter `Spec` limits the list
 * to one group; the search matches the rule ID and the path, without case.
 */
export function filterRefs(rows: readonly RefRow[], f: RefFilter): { row: RefRow; i: number }[] {
  const q = f.q.trim().toLowerCase();
  return rows
    .map((row, i) => ({ row, i }))
    .filter(
      ({ row }) =>
        (!f.spec || (f.spec === 'ok') === row.ok) &&
        (!q || row.ref.toLowerCase().includes(q) || row.path.toLowerCase().includes(q)),
    );
}

/**
 * §F/references/code/000071: the lines around a reference as a fenced code block, with line
 * numbers. The common indent goes, so a deep line still fits. Each line starts with its number,
 * so no line of the code can close the fence.
 */
export function codeExcerpt(ref: Pick<CodeRef, 'from' | 'context'>): string {
  const filled = ref.context.filter((l) => l.trim());
  const indent = filled.length
    ? Math.min(...filled.map((l) => l.length - l.trimStart().length))
    : 0;
  const width = String(ref.from + ref.context.length - 1).length;
  const lines = ref.context.map(
    (l, i) => `${String(ref.from + i).padStart(width)}  ${l.slice(indent)}`,
  );
  return '```\n' + lines.join('\n') + '\n```';
}

/**
 * §F/references/code/000020, §F/specs/detail/000017: a link to GitHub at the commit SHA of
 * the source, with the line when one is given.
 */
export function blobUrl(repo: string, sha: string, path: string, line?: number | null): string {
  const file = path
    .split('/')
    .filter((p) => p && p !== '.')
    .map(encodeURIComponent)
    .join('/');
  const kind = file ? 'blob' : 'tree';
  return `https://github.com/${ORG}/${encodeURIComponent(repo)}/${kind}/${sha}/${file}${line ? `#L${line}` : ''}`;
}
