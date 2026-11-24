import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  EmptyStateComponent,
  FilterSelectComponent,
  SegmentedComponent,
  type FilterSelectOption,
  type ListGroup,
  type ListRow,
  type LoadState,
  type SegmentedOption,
} from '@stupa-makers/ui-kit';
import {
  ListDetailScreenComponent,
  ScreenBodyDirective,
  ScreenFiltersDirective,
  ScreenToolsDirective,
} from '@stupa-makers/ui-kit/screens';
import { UmlDiagramViewComponent, type UmlLayout } from '@stupa-makers/ui-kit/views/uml';
import { DataService } from './data.service';
import { errorKey } from './explorer.component';
import { I18n } from './i18n';
import { SourceService } from './source.component';
import {
  biggestModule,
  classModules,
  edgeLabel,
  filterClasses,
  kindOf,
  umlRows,
  viewLabel,
  type UmlEdge,
  type UmlRow,
} from './uml';
import { layoutUml } from './uml-layout';

/**
 * The page `UML`: the views of `specs/uml/` at the source, as a diagram or as a list, and the
 * detail of one element, on the list/detail screen of the kit with the UML view of the kit.
 * §F/uml/views/000095, §F/uml/views/000096, §F/uml/views/000097
 */
@Component({
  selector: 'app-uml',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    FilterSelectComponent,
    ListDetailScreenComponent,
    ScreenBodyDirective,
    ScreenFiltersDirective,
    ScreenToolsDirective,
    SegmentedComponent,
    UmlDiagramViewComponent,
  ],
  template: `
    <app-list-detail-screen
      [head]="{ title: t('uml') }"
      [scope]="source.scope()"
      [filtersLabel]="t('filter')"
      [rows]="rows()"
      [none]="{ heading: t('uml.pick'), icon: 'shapes' }"
      [config]="{ param: 'el', listWidth: 'fill' }"
      (scopeChange)="source.change('uml', $event)"
    >
      @if (views().length) {
        <ng-template screenFilters>
          <app-filter-select
            [label]="t('uml.view')"
            [options]="viewOptions()"
            [value]="view()"
            [text]="viewText()"
            (valueChange)="pickView($event)"
            filled
          />
          @if (kind() === 'classes' && current()?.data) {
            <app-filter-select
              [label]="t('uml.module')"
              [options]="moduleOptions()"
              [value]="module()"
              [text]="moduleText()"
              (valueChange)="pickedModule.set($event)"
              filled
            />
          }
        </ng-template>
        <ng-template screenTools>
          <app-segmented
            [options]="modeOptions()"
            [ariaLabel]="t('uml.mode')"
            [value]="mode()"
            (valueChange)="mode.set($event === 'list' ? 'list' : 'diagram')"
          />
        </ng-template>
      }
      @if (broken(); as v) {
        <ng-template screenBody>
          <app-empty-state icon="alert" [heading]="t('uml.broken')">
            <p>{{ v.file }}</p>
            <ul>
              @for (e of v.errors; track $index) {
                <li>{{ e }}</li>
              }
            </ul>
          </app-empty-state>
        </ng-template>
      } @else if (mode() === 'diagram' && current()) {
        <ng-template screenBody>
          @if (layout(); as l) {
            <app-uml-diagram-view
              [layout]="l"
              [selected]="selected()"
              [state]="kind() === 'state'"
              [label]="diagramLabel()"
              (pick)="pick($event)"
            />
          }
        </ng-template>
      }
    </app-list-detail-screen>
  `,
})
export class UmlComponent {
  readonly data = inject(DataService);
  readonly source = inject(SourceService);
  private readonly router = inject(Router);
  readonly t = inject(I18n).t;

  /** Route parameters. */
  readonly repo = input('');
  readonly ref = input('');
  readonly view = input('');

  /** The element of the open detail; the detail sets it. */
  readonly selected = signal<string | null>(null);
  readonly mode = signal<'diagram' | 'list'>('diagram');
  /** `null` until the reader picks: then the module with the most classes. */
  readonly pickedModule = signal<string | null>(null);
  readonly module = computed(() => {
    const picked = this.pickedModule();
    if (picked !== null) return picked;
    const data = this.current()?.data;
    return data && this.kind() === 'classes' ? biggestModule(data) : '';
  });

  readonly views = computed(() => this.data.index()?.uml ?? []);
  readonly current = computed(() => this.views().find((v) => v.key === this.view()) ?? null);
  /** A view with format errors. */
  readonly broken = computed(() => {
    const v = this.current();
    return v?.errors.length ? v : null;
  });
  readonly kind = computed(() => {
    const v = this.current();
    return v ? kindOf(v) : 'components';
  });
  /** The data that the page shows: the class view filtered by module. */
  readonly shown = computed(() => {
    const data = this.current()?.data;
    if (!data) return null;
    return this.kind() === 'classes' ? filterClasses(data, this.module()) : data;
  });

  /** §F/uml/views/000097: the list holds the same content as the drawing. */
  readonly rows = computed<LoadState<readonly ListGroup[]>>(() => {
    const failed = this.data.error();
    if (failed) {
      return { state: 'error', message: this.t(errorKey(failed)), retry: () => this.data.reload() };
    }
    if (!this.data.index()) return { state: 'loading' };
    if (!this.views().length) return { state: 'empty', heading: this.t('uml.none'), icon: 'shapes' };
    const data = this.shown();
    if (!data) return { state: 'loading' };
    const groups = umlRows(this.kind(), data).map((r) => this.group(r));
    return groups.length
      ? { state: 'ready', data: groups }
      : { state: 'empty', heading: this.t('uml.none'), icon: 'shapes' };
  });

  readonly viewOptions = computed<FilterSelectOption[]>(() =>
    this.views().map((v) => ({ value: v.key, label: viewLabel(v, this.t) })),
  );
  readonly viewText = computed(() => {
    const v = this.current();
    return v ? viewLabel(v, this.t) : this.t('uml.view');
  });
  readonly moduleOptions = computed<FilterSelectOption[]>(() => {
    const data = this.current()?.data;
    return [
      { value: '', label: this.t('all') },
      ...(data ? classModules(data) : []).map((m) => ({ value: m, label: m })),
    ];
  });
  readonly moduleText = computed(() => this.module() || this.t('uml.module'));
  readonly modeOptions = computed<SegmentedOption[]>(() => [
    { value: 'diagram', label: this.t('uml.diagram') },
    { value: 'list', label: this.t('uml.list') },
  ]);

  readonly layout = signal<UmlLayout | null>(null);
  readonly diagramLabel = computed(() =>
    this.t('uml.diagramLabel', { view: this.viewText(), n: this.shown()?.elements.length ?? 0 }),
  );

  constructor() {
    effect(() => {
      if (this.repo() && this.ref()) this.data.select(this.repo(), this.ref());
    });
    // §F/uml/views/000095: a URL without a view opens the first view.
    effect(() => {
      const all = this.views();
      if (all.length && !this.view()) {
        void this.router.navigate(['/', this.data.repo(), this.data.ref(), 'uml', all[0].key], {
          replaceUrl: true,
        });
      }
    });
    let run = 0;
    effect(() => {
      const data = this.shown();
      const kind = this.kind();
      const id = ++run;
      this.layout.set(null);
      if (!data) return;
      void layoutUml(kind, data, (n) => this.t('uml.layer', { n })).then((l) => {
        if (id === run) this.layout.set(l);
      });
    });
  }

  /** The rows of one element: the element and its lines to other elements. */
  private group(r: UmlRow): ListGroup {
    const element: ListRow = {
      id: r.element.id,
      title: r.element.name,
      meta: [this.rowSub(r)],
      link: { commands: this.elementLink(r.element.id) },
    };
    const line = (e: UmlEdge, other: string, arrow: string, i: number): ListRow => ({
      id: `${r.element.id}${arrow}${i}`,
      title: `${arrow} ${this.edgeText(e, other)}`,
      link: { commands: this.elementLink(other) },
    });
    return {
      key: r.element.id,
      label: r.element.name,
      rows: [
        element,
        ...r.outgoing.map((e, i) => line(e, e.to, '→', i)),
        ...r.incoming.map((e, i) => line(e, e.from, '←', i)),
      ],
    };
  }

  /** The link of an element of the current view. */
  elementLink(id: string): string[] {
    return ['/', this.data.repo(), this.data.ref(), 'uml', this.view(), id];
  }

  pick(id: string): void {
    void this.router.navigate(this.elementLink(id));
  }

  pickView(key: string): void {
    this.pickedModule.set(null);
    void this.router.navigate(['/', this.data.repo(), this.data.ref(), 'uml', key]);
  }

  /** The second line of an element in the list: its layer, its lines or its path. */
  rowSub(r: UmlRow): string {
    if (r.element.layer) return this.t('uml.layer', { n: r.element.layer });
    return r.lines.join(' · ') || r.element.path;
  }

  edgeText(e: UmlEdge, other: string): string {
    const label = edgeLabel(this.kind(), e);
    return label ? `${other} · ${label}` : other;
  }
}
