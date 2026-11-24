import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  SectionComponent,
  type Action,
  type ListRow,
  type LoadState,
  type ScreenHead,
} from '@stupa-makers/ui-kit';
import { MarkdownViewComponent } from '@stupa-makers/ui-kit/markdown-view';
import {
  DetailScreenComponent,
  RecordSectionComponent,
  ScreenBodyDirective,
} from '@stupa-makers/ui-kit/screens';
import { DataService } from './data.service';
import { I18n } from './i18n';
import { codeExcerpt, type RefRow } from './model';

/**
 * The detail of one reference: the lines around it, its spec and its file.
 * §F/references/code/000071
 */
@Component({
  selector: 'app-ref-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DetailScreenComponent,
    MarkdownViewComponent,
    RecordSectionComponent,
    ScreenBodyDirective,
    SectionComponent,
  ],
  template: `
    <app-detail-screen
      [head]="head()"
      [state]="state()"
      [actions]="actions()"
      (action)="onAction($event.key)"
    >
      <ng-template screenBody>
        <app-section [heading]="t('codePlace')">
          <app-markdown-view [src]="code()" [imageSrc]="null" [mailto]="false" />
        </app-section>
        @if (specRows(); as rows) {
          <app-record-section [heading]="t('spec')" [level]="3" [rows]="rows" />
        }
        <app-record-section [heading]="t('file')" [level]="3" [rows]="fileRows()" />
      </ng-template>
    </app-detail-screen>
  `,
})
export class RefDetailComponent {
  readonly data = inject(DataService);
  readonly t = inject(I18n).t;
  /** The position of the reference in the list, from the URL. */
  readonly n = input('');
  readonly ref = computed(() => this.data.refs()[Number(this.n())] ?? null);
  readonly spec = computed(() => {
    const r = this.ref();
    return r?.ok && !r.repo ? (this.data.byId().get(r.ref) ?? null) : null;
  });
  readonly code = computed(() => {
    const r = this.ref();
    return r ? codeExcerpt(r) : '';
  });

  readonly state = computed<LoadState<RefRow>>(() => {
    const r = this.ref();
    if (r) return { state: 'ready', data: r };
    if (!this.data.index()) return { state: 'loading' };
    return { state: 'empty', heading: this.t('refMissing'), icon: 'link' };
  });

  readonly head = computed<ScreenHead>(() => {
    const r = this.ref();
    if (!r) return { title: '' };
    return {
      title: r.repo ? `${r.repo}:${r.ref}` : r.ref,
      status: r.ok
        ? { label: this.t('withSpec'), kind: 'accent' }
        : { label: this.t('withoutSpec'), kind: 'error' },
      meta: [{ label: this.t('line', { n: r.line }) }],
    };
  });

  readonly actions = computed<readonly Action[]>(() => [
    { key: 'open', label: this.t('openLine'), icon: 'ext', priority: 'head' },
  ]);

  /** The spec of the reference, here or in another repository. */
  readonly specRows = computed<LoadState<readonly ListRow[]> | null>(() => {
    const r = this.ref();
    const s = this.spec();
    if (s) {
      return {
        state: 'ready',
        data: [{ id: s.id, title: s.title, meta: [s.id], link: { commands: this.data.specLink(s.id) } }],
      };
    }
    if (r?.repo) {
      return {
        state: 'ready',
        data: [
          { id: r.ref, title: r.ref, meta: [r.repo], link: { commands: this.data.externalLink(r.repo, r.ref) } },
        ],
      };
    }
    return null;
  });

  /** §F/references/code/000020: the file at the line, on GitHub. */
  readonly fileRows = computed<LoadState<readonly ListRow[]>>(() => {
    const r = this.ref();
    return r
      ? {
          state: 'ready',
          data: [{ id: r.path, title: r.path, code: 'title', href: this.data.blob(r.path, r.line) }],
        }
      : { state: 'loading' };
  });

  onAction(key: string): void {
    const r = this.ref();
    if (key === 'open' && r) window.open(this.data.blob(r.path, r.line), '_blank', 'noopener');
  }
}
