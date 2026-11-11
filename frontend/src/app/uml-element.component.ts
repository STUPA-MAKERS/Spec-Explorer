import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  ButtonComponent,
  DetailNoneComponent,
  EmptyStateComponent,
  IconComponent,
  ListItemComponent,
  SectionComponent,
  SheetBarComponent,
  SheetBarTitleDirective,
} from '@stupa-makers/ui-kit';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { edgeLabel, edgesOf, elementLines, kindOf, specsForPath } from './uml';
import { UmlComponent } from './uml.component';

/** The detail pane of `UML` before an element is picked. */
@Component({
  selector: 'app-uml-none',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailNoneComponent],
  template: `<app-detail-none state="pick" icon="shapes" [heading]="t('uml.pick')" />`,
  styles: `
    @use 'detail-none-host';
    :host {
      @include detail-none-host.host;
    }
  `,
})
export class UmlNoneComponent {
  readonly t = inject(I18n).t;
}

/**
 * The detail of one element: its lines, its path, the elements it is linked to and the specs
 * that implement its path. §F/uml/links/000098
 */
@Component({
  selector: 'app-uml-element',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    ListItemComponent,
    SectionComponent,
    SheetBarComponent,
    SheetBarTitleDirective,
  ],
  template: `
    @if (element(); as el) {
      <article class="sd" [class.sd--split]="split()" aria-labelledby="ue-title">
        <header class="sheet-head">
          <app-sheet-bar [bleed]="split()">
            <h2 appSheetBarTitle id="ue-title" class="sheet-title mono">{{ el.name }}</h2>
            <app-button variant="text" [iconOnly]="true" [ariaLabel]="t('openFile')" (click)="open(el.path)">
              <app-icon name="ext" />
            </app-button>
          </app-sheet-bar>
          <p class="sheet-line sd__line">
            <span>{{ viewName() }}</span>
            @if (el.layer) {
              <span class="sd__dot" aria-hidden="true">·</span><span>{{ t('uml.layer', { n: el.layer }) }}</span>
            }
            @if (el.table) {
              <span class="sd__dot" aria-hidden="true">·</span><span class="mono">{{ el.table }}</span>
            }
          </p>
        </header>

        @if (lines().length) {
          <app-section class="sd__sec" [heading]="t('uml.attributes')">
            <ul class="ue__lines mono">
              @for (l of lines(); track $index) {
                <li>{{ l }}</li>
              }
            </ul>
          </app-section>
        }

        <app-section class="sd__sec" [heading]="t('uml.links')">
          @if (links().length) {
            <div class="rowgroup">
              @for (x of links(); track $index) {
                <app-list-item class="sd__row" [title]="x.title" [sub]="x.sub" [link]="x.link" />
              }
            </div>
          } @else {
            <app-empty-state rows="2" [heading]="t('uml.noLinks')" />
          }
        </app-section>

        <app-section class="sd__sec" [heading]="t('specs')">
          @if (specs().length) {
            <div class="rowgroup">
              @for (s of specs(); track s.id) {
                <app-list-item class="sd__row" [title]="s.title" [sub]="s.id" [link]="data.specLink(s.id)" />
              }
            </div>
          } @else {
            <app-empty-state rows="2" [heading]="t('uml.noSpecs')" />
          }
        </app-section>

        <app-section class="sd__sec" [heading]="t('file')">
          <div class="rowgroup">
            <app-list-item class="sd__path" [title]="el.path" (activate)="open(el.path)">
              <app-icon trail name="ext" [size]="16" />
            </app-list-item>
          </div>
        </app-section>
      </article>
    } @else if (data.index()) {
      <app-empty-state plain icon="shapes" fill [heading]="t('uml.missing')" />
    }
  `,
  styleUrl: './spec-detail.component.scss',
  styles: `
    .ue__lines {
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--fs-sm);
      line-height: 1.7;
      overflow-wrap: anywhere;
    }
  `,
})
export class UmlElementComponent {
  readonly data = inject(DataService);
  readonly t = inject(I18n).t;
  private readonly page = inject(UmlComponent);
  readonly split = this.page.split;
  /** The element ID from the URL. */
  readonly el = input('');

  readonly element = computed(
    () => this.page.current()?.data?.elements.find((e) => e.id === this.el()) ?? null,
  );
  readonly viewName = computed(() => this.page.viewText());
  readonly lines = computed(() => {
    const view = this.page.current();
    const el = this.element();
    return view && el ? elementLines(kindOf(view), el) : [];
  });
  readonly links = computed(() => {
    const view = this.page.current();
    const el = this.element();
    if (!view?.data || !el) return [];
    const kind = kindOf(view);
    const name = (id: string): string => view.data?.elements.find((e) => e.id === id)?.name ?? id;
    return edgesOf(view.data).flatMap((e) => {
      const out = e.from === el.id;
      if (!out && e.to !== el.id) return [];
      const other = out ? e.to : e.from;
      const label = edgeLabel(kind, e);
      return [
        {
          title: `${out ? '→' : '←'} ${name(other)}`,
          sub: label,
          link: this.page.elementLink(other),
        },
      ];
    });
  });
  readonly specs = computed(() => {
    const el = this.element();
    return el ? specsForPath(this.data.index()?.specs ?? [], el.path) : [];
  });

  open(path: string): void {
    window.open(this.data.blob(path), '_blank', 'noopener');
  }
}
