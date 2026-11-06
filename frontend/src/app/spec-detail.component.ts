import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  EmptyStateComponent,
  IconComponent,
  ListItemComponent,
  NoteComponent,
  SectionComponent,
  SheetBarComponent,
  SheetBarTitleDirective,
  StatusTextComponent,
  type StatusKind,
} from '@stupa-makers/ui-kit';
import { MarkdownViewComponent } from '@stupa-makers/ui-kit/markdown-view';
import { DataService } from './data.service';
import { ExplorerComponent, STATUS_KIND } from './explorer.component';
import { I18n } from './i18n';
import { statusOf, type Spec } from './model';

/**
 * The detail of one spec: the front matter, the rule text and every reference.
 * §F/specs/detail/000015, §F/specs/detail/000016, §F/specs/detail/000017
 */
@Component({
  selector: 'app-spec-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    ListItemComponent,
    NoteComponent,
    SectionComponent,
    SheetBarComponent,
    SheetBarTitleDirective,
    StatusTextComponent,
    MarkdownViewComponent,
  ],
  templateUrl: './spec-detail.component.html',
  styleUrl: './spec-detail.component.scss',
})
export class SpecDetailComponent {
  readonly data = inject(DataService);
  private readonly i18n = inject(I18n);
  readonly t = this.i18n.t;
  readonly split = inject(ExplorerComponent).split;
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
  /** §F/references/specs/000026 and §F/specs/detail/000018: the specs around this one. */
  readonly linked = computed(() => {
    const s = this.spec();
    if (!s) return [];
    const get = (how: string, ids: string[]): { how: string; spec: Spec }[] =>
      ids.flatMap((i) => {
        const spec = this.data.byId().get(i);
        return spec ? [{ how, spec }] : [];
      });
    return [
      ...get('replaces', s.replaces),
      ...get('mentions', s.mentions),
      ...get('mentionedBy', s.mentionedBy),
    ];
  });

  base(p: string): string {
    return p.split('/').pop() ?? p;
  }

  dir(p: string): string {
    return p.split('/').slice(0, -1).join('/');
  }

  /** §F/references/code/000020: open a file or a line at the commit SHA. */
  open(path: string, line?: number | null): void {
    window.open(this.data.blob(path, line), '_blank', 'noopener');
  }
}
