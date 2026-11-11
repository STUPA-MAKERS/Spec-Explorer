import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  ButtonComponent,
  EmptyStateComponent,
  FilterSelectComponent,
  ListDetailLayoutComponent,
  ListGroupComponent,
  ListItemComponent,
  PageHeaderComponent,
  ScrollFadeDirective,
  SegmentedComponent,
  StickyBarComponent,
  type FilterSelectOption,
  type SegmentedOption,
} from '@stupa-makers/ui-kit';
import { injectListDetailPage } from '@stupa-makers/ui-kit/shell';
import { DataService } from './data.service';
import { errorKey } from './explorer.component';
import { I18n } from './i18n';
import { SourceComponent } from './source.component';
import { biggestModule, classModules, edgeLabel, filterClasses, kindOf, umlRows, viewLabel, type UmlEdge, type UmlRow } from './uml';
import { UmlDiagramComponent } from './uml-diagram.component';
import { layoutUml, type UmlLayout } from './uml-layout';

/**
 * The page `UML`: the views of `specs/uml/` at the source, as a diagram or as a list, and the
 * detail of one element. §F/uml/views/000095, §F/uml/views/000096, §F/uml/views/000097
 */
@Component({
  selector: 'app-uml',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    ButtonComponent,
    EmptyStateComponent,
    FilterSelectComponent,
    ListDetailLayoutComponent,
    ListGroupComponent,
    ListItemComponent,
    PageHeaderComponent,
    ScrollFadeDirective,
    SegmentedComponent,
    StickyBarComponent,
    SourceComponent,
    UmlDiagramComponent,
  ],
  host: { '[class.pane-page]': 'split()' },
  templateUrl: './uml.component.html',
  styleUrls: ['./explorer.component.scss', './uml.component.scss'],
})
export class UmlComponent {
  readonly data = inject(DataService);
  private readonly router = inject(Router);
  readonly t = inject(I18n).t;
  private readonly layoutRef = viewChild(ListDetailLayoutComponent);
  private readonly ld = injectListDetailPage(this.layoutRef, { param: 'el' });
  readonly split = this.ld.split;
  readonly selectedId = this.ld.selectedId;

  /** Route parameters. */
  readonly repo = input('');
  readonly ref = input('');
  readonly view = input('');

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
  readonly current = computed(() => {
    const all = this.views();
    return all.find((v) => v.key === this.view()) ?? null;
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
  readonly rows = computed(() => {
    const data = this.shown();
    return data ? umlRows(this.kind(), data) : [];
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

  errorText(status: number): string {
    return this.t(errorKey(status));
  }

  closeDetail(): void {
    void this.router.navigate(['/', this.data.repo(), this.data.ref(), 'uml', this.view()]);
  }
}
