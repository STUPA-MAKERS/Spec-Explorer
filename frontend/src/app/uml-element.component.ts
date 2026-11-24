import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import type { Action, ListRow, LoadState, ScreenHead } from '@stupa-makers/ui-kit';
import {
  DetailScreenComponent,
  RecordSectionComponent,
  ScreenBodyDirective,
} from '@stupa-makers/ui-kit/screens';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { edgeLabel, edgesOf, elementLines, kindOf, specsForPath, type UmlElement } from './uml';
import { UmlComponent } from './uml.component';

/**
 * The detail of one element: its lines, its path, the elements it is linked to and the specs
 * that implement its path. §F/uml/links/000098
 */
@Component({
  selector: 'app-uml-element',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailScreenComponent, RecordSectionComponent, ScreenBodyDirective],
  template: `
    <app-detail-screen
      [head]="head()"
      [state]="state()"
      [actions]="actions()"
      (action)="onAction($event.key)"
    >
      <ng-template screenBody>
        @if (lines().length) {
          <app-record-section
            [heading]="t('uml.attributes')"
            [level]="3"
            [rows]="{ state: 'ready', data: lines() }"
          />
        }
        <app-record-section [heading]="t('uml.links')" [level]="3" [rows]="links()" />
        <app-record-section [heading]="t('specs')" [level]="3" [rows]="specs()" />
        <app-record-section [heading]="t('file')" [level]="3" [rows]="fileRows()" />
      </ng-template>
    </app-detail-screen>
  `,
})
export class UmlElementComponent {
  readonly data = inject(DataService);
  readonly t = inject(I18n).t;
  private readonly page = inject(UmlComponent);
  /** The element ID from the URL. */
  readonly el = input('');

  readonly element = computed(
    () => this.page.current()?.data?.elements.find((e) => e.id === this.el()) ?? null,
  );
  readonly state = computed<LoadState<UmlElement>>(() => {
    const el = this.element();
    if (el) return { state: 'ready', data: el };
    if (!this.data.index()) return { state: 'loading' };
    return { state: 'empty', heading: this.t('uml.missing'), icon: 'shapes' };
  });
  readonly head = computed<ScreenHead>(() => {
    const el = this.element();
    if (!el) return { title: '' };
    return {
      title: el.name,
      meta: [
        { label: this.page.viewText() },
        ...(el.layer ? [{ label: this.t('uml.layer', { n: el.layer }) }] : []),
        ...(el.table ? [{ label: el.table }] : []),
      ],
    };
  });
  readonly actions = computed<readonly Action[]>(() => [
    { key: 'open', label: this.t('openFile'), icon: 'ext', priority: 'head' },
  ]);
  /** The attributes, the image or the build of the element, each a line of code. */
  readonly lines = computed<readonly ListRow[]>(() => {
    const view = this.page.current();
    const el = this.element();
    return view && el
      ? elementLines(kindOf(view), el).map((l, i) => ({ id: String(i), title: l, code: 'title' }))
      : [];
  });
  readonly links = computed<LoadState<readonly ListRow[]>>(() => {
    const view = this.page.current();
    const el = this.element();
    if (!view?.data || !el) return { state: 'loading' };
    const data = view.data;
    const kind = kindOf(view);
    const name = (id: string): string => data.elements.find((e) => e.id === id)?.name ?? id;
    const rows = edgesOf(data).flatMap((e, i): ListRow[] => {
      const out = e.from === el.id;
      if (!out && e.to !== el.id) return [];
      const other = out ? e.to : e.from;
      const label = edgeLabel(kind, e);
      return [
        {
          id: String(i),
          title: `${out ? '→' : '←'} ${name(other)}`,
          ...(label ? { meta: [label] } : {}),
          link: { commands: this.page.elementLink(other) },
        },
      ];
    });
    return rows.length
      ? { state: 'ready', data: rows }
      : { state: 'empty', heading: this.t('uml.noLinks'), icon: 'circleok' };
  });
  readonly specs = computed<LoadState<readonly ListRow[]>>(() => {
    const el = this.element();
    const found = el ? specsForPath(this.data.index()?.specs ?? [], el.path) : [];
    return found.length
      ? {
          state: 'ready',
          data: found.map((s) => ({
            id: s.id,
            title: s.title,
            meta: [s.id],
            link: { commands: this.data.specLink(s.id) },
          })),
        }
      : { state: 'empty', heading: this.t('uml.noSpecs'), icon: 'circleok' };
  });
  readonly fileRows = computed<LoadState<readonly ListRow[]>>(() => {
    const el = this.element();
    return el
      ? {
          state: 'ready',
          data: [{ id: el.path, title: el.path, code: 'title', href: this.data.blob(el.path) }],
        }
      : { state: 'loading' };
  });

  constructor() {
    // The drawing marks the element of the open detail.
    effect(() => this.page.selected.set(this.el() || null));
    inject(DestroyRef).onDestroy(() => this.page.selected.set(null));
  }

  onAction(key: string): void {
    const el = this.element();
    if (key === 'open' && el) window.open(this.data.blob(el.path), '_blank', 'noopener');
  }
}
