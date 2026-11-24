import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ColumnsComponent,
  NoteComponent,
  SectionComponent,
  TableComponent,
  type Action,
  type Column,
  type ListRow,
  type LoadState,
  type MetaChip,
  type ScreenHead,
  type SideSheetDef,
  type StatusKind,
} from '@stupa-makers/ui-kit';
import { MarkdownViewComponent } from '@stupa-makers/ui-kit/markdown-view';
import {
  DetailScreenComponent,
  RecordSectionComponent,
  ScreenBodyDirective,
  ScreenSheetDirective,
} from '@stupa-makers/ui-kit/screens';
import { DataService } from './data.service';
import { STATUS_KIND } from './explorer.component';
import { I18n } from './i18n';
import { schemaFields, statusOf, type PathRef, type Spec } from './model';
import { elementsForSpec, viewLabel } from './uml';

/**
 * The detail of one spec: the front matter, the rule text and every reference.
 * §F/specs/detail/000015, §F/specs/detail/000016, §F/specs/detail/000017,
 * §F/specs/detail/000102, §F/specs/detail/000103
 */
interface FieldRow extends Record<string, unknown> {
  path: string;
  type: string;
  required: string;
  description: string;
}

/** The empty state of a section without rows. */
const empty = (heading: string): LoadState<readonly ListRow[]> => ({
  state: 'empty',
  heading,
  icon: 'circleok',
});

/** The rows of a section, or its empty state. */
const rowsOr = (rows: readonly ListRow[], heading: string): LoadState<readonly ListRow[]> =>
  rows.length ? { state: 'ready', data: rows } : empty(heading);

@Component({
  selector: 'app-spec-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ColumnsComponent,
    DetailScreenComponent,
    MarkdownViewComponent,
    NoteComponent,
    RecordSectionComponent,
    ScreenBodyDirective,
    ScreenSheetDirective,
    SectionComponent,
    TableComponent,
  ],
  template: `
    <app-detail-screen
      [head]="head()"
      [state]="state()"
      [actions]="actions()"
      [sheets]="sheets()"
      (action)="onAction($event.key)"
    >
      <ng-template screenBody>
        @if (spec(); as s) {
          @if (s.errors.length) {
            <app-note kind="error" icon="alert">
              @for (e of s.errors; track $index) {
                <span>{{ e }}</span><br />
              }
            </app-note>
          }
          @if (s.replacedBy; as r) {
            <app-note icon="swap">
              {{ t('replacedBy') }} <a [routerLink]="data.specLink(r)">{{ r }}</a>
            </app-note>
          }
          <app-columns>
            <ng-container ngProjectAs="[main]">
              <app-section [heading]="t('rule')" [hideHeading]="true">
                <app-markdown-view
                  [src]="s.body"
                  [headingOffset]="2"
                  [imageSrc]="null"
                  [mailto]="false"
                />
              </app-section>
              @if (s.schema != null) {
                <app-record-section [heading]="t('schema')" [level]="3" [rows]="schemaFile()" />
                <app-table
                  [columns]="fieldColumns()"
                  [rows]="fields()"
                  [emptyText]="t('schemaEmpty')"
                />
              }
            </ng-container>
            <ng-container ngProjectAs="[side]">
              @if (s.status === 'draft' || s.status === 'approved') {
                <app-record-section
                  [heading]="t('implementation')"
                  [level]="3"
                  [rows]="implementation()"
                />
              }
              <app-record-section [heading]="t('tests')" [level]="3" [rows]="tests()" />
              <app-record-section [heading]="t('codeRefs')" [level]="3" [rows]="codeRefs()" />
              <app-record-section [heading]="t('scope')" [level]="3" [rows]="scope()" />
              @if (linked().length) {
                <app-record-section
                  [heading]="t('otherSpecs')"
                  [level]="3"
                  [rows]="{ state: 'ready', data: linked() }"
                />
              }
              @if (externalLinks().length) {
                <app-record-section
                  [heading]="t('otherRepos')"
                  [level]="3"
                  [rows]="{ state: 'ready', data: externalLinks() }"
                />
              }
              @if (umlHits().length) {
                <app-record-section
                  [heading]="t('uml')"
                  [level]="3"
                  [rows]="{ state: 'ready', data: umlHits() }"
                />
              }
            </ng-container>
          </app-columns>
        }
      </ng-template>
      <ng-template screenSheet="raw">
        <app-markdown-view [src]="rawSchema()" [imageSrc]="null" [mailto]="false" />
      </ng-template>
    </app-detail-screen>
  `,
})
export class SpecDetailComponent {
  readonly data = inject(DataService);
  private readonly i18n = inject(I18n);
  readonly t = this.i18n.t;
  /** The rule ID from the URL. */
  readonly id = input('');
  readonly spec = computed(() => this.data.byId().get(this.id()) ?? null);
  readonly status = computed(() => {
    const s = this.spec();
    return s ? statusOf(s) : '';
  });
  readonly statusKind = computed<StatusKind>(() => STATUS_KIND[this.status()] ?? 'muted');
  readonly updated = computed(() => {
    const d = this.spec()?.updated ?? '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (!m) return d;
    return this.i18n.lang() === 'de' ? `${m[3]}.${m[2]}.${m[1]}` : d;
  });

  /** The load state of the screen: the spec, or the text that it is missing. */
  readonly state = computed<LoadState<Spec>>(() => {
    const s = this.spec();
    if (s) return { state: 'ready', data: s };
    if (!this.data.index()) return { state: 'loading' };
    return { state: 'empty', heading: this.t('specMissing'), icon: 'file' };
  });

  /** §F/specs/detail/000015, §F/specs/detail/000102: the front matter as the head. */
  readonly head = computed<ScreenHead>(() => {
    const s = this.spec();
    if (!s) return { title: '' };
    const meta: MetaChip[] = [
      { label: s.id },
      { label: this.t('kind.' + s.kind) },
      ...(s.version ? [{ label: `v${s.version}` }] : []),
      ...(s.mediaType ? [{ label: s.mediaType }] : []),
      { label: s.owner },
      { label: this.updated() },
    ];
    return {
      title: s.title,
      status: { label: this.t('status.' + this.status()), kind: this.statusKind() },
      meta,
    };
  });

  /** §F/specs/detail/000017: the spec file on GitHub. */
  readonly actions = computed<readonly Action[]>(() => [
    { key: 'open', label: this.t('openFile'), icon: 'ext', priority: 'head' },
  ]);

  /** §F/specs/detail/000103: the raw schema of a protocol spec in a side sheet. */
  readonly sheets = computed<readonly SideSheetDef[]>(() =>
    this.spec()?.schema != null ? [{ key: 'raw', label: this.t('schemaRaw'), icon: 'code' }] : [],
  );

  /** The row of a path at the commit, or the text that it is missing. */
  private pathRow(p: PathRef): ListRow {
    return {
      id: p.path,
      title: p.path,
      code: 'title',
      href: this.data.blob(p.path),
      ...(p.exists ? {} : { status: { label: this.t('missing'), kind: 'error' } }),
    };
  }

  /** §F/references/paths/000022, §F/references/paths/000023 */
  readonly implementation = computed<LoadState<readonly ListRow[]>>(() => {
    const impl = this.spec()?.implementation;
    if (impl === null || impl === undefined) return empty(this.t('notImplemented'));
    return rowsOr(
      impl.map((p) => this.pathRow(p)),
      this.t('noPaths'),
    );
  });
  /** §F/references/paths/000024 */
  readonly tests = computed(() =>
    rowsOr(
      (this.spec()?.tests ?? []).map(
        (x): ListRow => ({
          id: x.entry,
          title: x.fn,
          meta: [x.path],
          code: 'title',
          href: this.data.blob(x.path, x.line),
          ...(x.exists ? {} : { status: { label: this.t('missing'), kind: 'error' } }),
        }),
      ),
      this.t('noTests'),
    ),
  );
  /** §F/references/code/000019, §F/references/code/000020 */
  readonly codeRefs = computed(() =>
    rowsOr(
      (this.spec()?.codeRefs ?? []).map(
        (r, i): ListRow => ({
          id: String(i),
          title: `${this.base(r.path)}:${r.line}`,
          meta: [this.dir(r.path)],
          code: 'title',
          href: this.data.blob(r.path, r.line),
        }),
      ),
      this.t('noCodeRefs'),
    ),
  );
  /** §F/references/paths/000025 */
  readonly scope = computed<LoadState<readonly ListRow[]>>(() => ({
    state: 'ready',
    data: (this.spec()?.scope ?? []).map((p) => this.pathRow(p)),
  }));
  /** The schema file of a protocol spec. */
  readonly schemaFile = computed<LoadState<readonly ListRow[]>>(() => {
    const s = this.spec();
    const file = s?.schemaFile ?? s?.file ?? '';
    return {
      state: 'ready',
      data: [{ id: file, title: this.base(file), code: 'title', href: this.data.blob(file) }],
    };
  });

  /** §F/uml/links/000099: the UML elements that the spec implements. */
  readonly umlHits = computed<readonly ListRow[]>(() => {
    const s = this.spec();
    if (!s) return [];
    return elementsForSpec(this.data.index()?.uml ?? [], s).map((h) => ({
      id: `${h.view.key}/${h.element.id}`,
      title: h.element.name,
      meta: [viewLabel(h.view, this.t)],
      link: { commands: ['/', this.data.repo(), this.data.ref(), 'uml', h.view.key, h.element.id] },
    }));
  });
  /** §F/references/specs/000105: the specs of other repositories that the body names. */
  readonly externalLinks = computed<readonly ListRow[]>(() =>
    (this.spec()?.external ?? []).map((x) => ({
      id: `${x.repo}:${x.id}`,
      title: x.id,
      meta: [x.repo],
      link: { commands: this.data.externalLink(x.repo, x.id) },
    })),
  );
  /** §F/references/specs/000026, §F/specs/detail/000018, §F/references/specs/000104 */
  readonly linked = computed<readonly ListRow[]>(() => {
    const s = this.spec();
    if (!s) return [];
    const get = (how: string, ids: readonly string[]): ListRow[] =>
      ids.flatMap((i) => {
        const spec = this.data.byId().get(i);
        return spec
          ? [
              {
                id: how + spec.id,
                title: spec.title,
                meta: [`${this.t(how)} · ${spec.id}`],
                link: { commands: this.data.specLink(spec.id) },
              },
            ]
          : [];
      });
    return [
      ...get('replaces', s.replaces),
      ...get('mentions', s.mentions),
      ...get('mentionedBy', s.mentionedBy),
      ...get('protocols', s.protocols),
      ...get('usedBy', s.usedBy),
    ];
  });
  /** §F/specs/detail/000103: the field table of the schema of a protocol spec. */
  readonly fields = computed(() =>
    schemaFields(this.spec()?.schema).map((f) => ({
      path: f.path,
      type: f.type,
      required: this.t(f.required ? 'yes' : 'no'),
      description: f.description,
    })),
  );
  readonly fieldColumns = computed<Column<FieldRow>[]>(() => [
    { key: 'path', label: this.t('schemaField') },
    { key: 'type', label: this.t('schemaType') },
    { key: 'required', label: this.t('schemaRequired') },
    { key: 'description', label: this.t('schemaDescription') },
  ]);
  /** The raw schema as a fenced JSON block for the Markdown view. */
  readonly rawSchema = computed(() => {
    const schema = this.spec()?.schema;
    return schema == null ? '' : '```json\n' + JSON.stringify(schema, null, 2) + '\n```';
  });

  base(p: string): string {
    return p.split('/').pop() ?? p;
  }

  dir(p: string): string {
    return p.split('/').slice(0, -1).join('/');
  }

  /** §F/specs/detail/000017: the head action opens the spec file at the commit SHA. */
  onAction(key: string): void {
    const s = this.spec();
    if (key === 'open' && s) window.open(this.data.blob(s.file), '_blank', 'noopener');
  }
}
