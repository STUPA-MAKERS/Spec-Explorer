import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ButtonComponent, IconComponent } from '@stupa-makers/ui-kit';
import { HEAD_H, LINE_H, PAD_X, type UmlBox, type UmlLayout, type UmlLine } from './uml-layout';

const MIN = 0.1;
const MAX = 3;
const STEP = 1.25;

/** The path of a line through its points. */
export function linePath(l: UmlLine): string {
  if (l.curve && l.points.length === 4) {
    const [a, b, c, d] = l.points;
    return `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;
  }
  return l.points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
}

/** The place of an end label: a little beside the first or the last point of a line. */
export function endPlace(l: UmlLine, atEnd: boolean): { x: number; y: number } {
  const pts = l.points;
  if (pts.length < 2) return { x: 0, y: 0 };
  const [a, b] = atEnd ? [pts[pts.length - 1], pts[pts.length - 2]] : [pts[0], pts[1]];
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  return { x: a.x + dx * 10 + (dy ? 6 : 0), y: a.y + dy * 14 + (dx ? -4 : 0) };
}

/**
 * The SVG drawing of one laid-out view, with zoom and move. §F/uml/views/000096
 *
 * The drawing is one picture for assistive technology (`role="img"`); the list segment holds
 * the same content as text (§F/uml/views/000097). A click on a box selects its element.
 */
@Component({
  selector: 'app-uml-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  template: `
    <div class="ud__tools" role="group" [attr.aria-label]="zoomLabel()">
      <app-button variant="tonal" size="sm" [iconOnly]="true" [ariaLabel]="outLabel()" (click)="zoomBy(1 / step)">
        <app-icon name="minus" />
      </app-button>
      <app-button variant="tonal" size="sm" [iconOnly]="true" [ariaLabel]="inLabel()" (click)="zoomBy(step)">
        <app-icon name="plus" />
      </app-button>
      <app-button variant="tonal" size="sm" (click)="fit()">{{ fitLabel() }}</app-button>
    </div>
    <div
      #frame
      class="ud__frame"
      tabindex="0"
      role="img"
      [attr.aria-label]="label()"
      [class.ud__frame--drag]="dragging()"
      (wheel)="onWheel($event)"
      (pointerdown)="onDown($event)"
      (pointermove)="onMove($event)"
      (pointerup)="onUp($event)"
      (pointercancel)="onUp($event)"
      (keydown)="onKey($event)"
    >
      <svg class="ud__svg" aria-hidden="true" focusable="false">
        <defs>
          <marker id="ud-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10" class="ud__head" />
          </marker>
        </defs>
        <g [attr.transform]="transform()">
          @for (b of frames(); track b.id) {
            <g class="ud__frame-box">
              <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="10" />
              <text [attr.x]="b.x + 12" [attr.y]="b.y + 20" class="ud__frame-name">{{ b.name }}</text>
            </g>
          }
          @for (l of layout().lines; track l.id) {
            <g
              class="ud__edge"
              [class.ud__edge--on]="l.from === selected() || l.to === selected()"
              [class.ud__edge--off]="selected() && l.from !== selected() && l.to !== selected()"
            >
              <path
                [attr.d]="path(l)"
                [class.ud__dash]="l.dashed"
                [style.stroke-width]="l.weight"
                [attr.marker-end]="l.ends ? null : 'url(#ud-arrow)'"
              />
              @if (l.label && (!l.curve || l.from === selected() || l.to === selected())) {
                <text [attr.x]="l.labelX" [attr.y]="l.labelY" class="ud__label">{{ l.label }}</text>
              }
              @if (l.ends; as ends) {
                <text [attr.x]="end(l, false).x" [attr.y]="end(l, false).y" class="ud__label">{{ ends[0] }}</text>
                <text [attr.x]="end(l, true).x" [attr.y]="end(l, true).y" class="ud__label">{{ ends[1] }}</text>
              }
            </g>
          }
          @for (b of items(); track b.id) {
            @switch (b.role) {
              @case ('frame') {
                <g class="ud__frame-box">
                  <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="10" />
                  <text [attr.x]="b.x + 12" [attr.y]="b.y + 20" class="ud__frame-name">{{ b.name }}</text>
                </g>
              }
              @case ('start') {
                <circle class="ud__start" [attr.cx]="b.x + b.w / 2" [attr.cy]="b.y + b.h / 2" [attr.r]="b.w / 2" />
              }
              @default {
                <g
                  class="ud__box"
                  [class.ud__box--on]="b.id === selected()"
                  [class.ud__box--state]="state()"
                  (click)="pick.emit(b.id)"
                >
                  <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" [attr.rx]="state() ? 18 : 4" />
                  <text [attr.x]="b.x + b.w / 2" [attr.y]="b.y + (state() ? b.h / 2 + 5 : 20)" class="ud__name">{{ b.name }}</text>
                  @if (b.lines.length) {
                    <line [attr.x1]="b.x" [attr.x2]="b.x + b.w" [attr.y1]="b.y + headH" [attr.y2]="b.y + headH" class="ud__rule" />
                    @for (l of b.lines; track $index) {
                      <text [attr.x]="b.x + padX" [attr.y]="b.y + headH + 18 + $index * lineH" class="ud__line">{{ l }}</text>
                    }
                  }
                </g>
              }
            }
          }
        </g>
      </svg>
    </div>
  `,
  styleUrl: './uml-diagram.component.scss',
})
export class UmlDiagramComponent {
  readonly layout = input.required<UmlLayout>();
  readonly selected = input<string | null>(null);
  /** The view is a state view: round boxes with the name in the middle. */
  readonly state = input(false);
  readonly label = input('');
  readonly zoomLabel = input('Zoom');
  readonly inLabel = input('+');
  readonly outLabel = input('−');
  readonly fitLabel = input('Fit');
  readonly pick = output<string>();

  readonly headH = HEAD_H;
  readonly lineH = LINE_H;
  readonly padX = PAD_X;
  readonly step = STEP;

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  readonly scale = signal(1);
  readonly x = signal(0);
  readonly y = signal(0);
  readonly dragging = signal(false);
  private drag: { id: number; sx: number; sy: number; x: number; y: number; moved: boolean } | null = null;

  readonly frames = computed(() => this.layout().boxes.filter((b) => b.role === 'frame'));
  readonly items = computed(() => this.layout().boxes.filter((b) => b.role !== 'frame'));
  readonly transform = computed(() => `translate(${this.x()},${this.y()}) scale(${this.scale()})`);

  constructor() {
    effect(() => {
      this.layout();
      untracked(() => queueMicrotask(() => this.fit()));
    });
  }

  path(l: UmlLine): string {
    return linePath(l);
  }

  end(l: UmlLine, atEnd: boolean): { x: number; y: number } {
    return endPlace(l, atEnd);
  }

  /** Fit the whole drawing into the frame, at most at its natural size. */
  fit(): void {
    const el = this.frame().nativeElement;
    const { width, height } = this.layout();
    const w = el.clientWidth || 800;
    const h = el.clientHeight || 600;
    if (!width || !height) return;
    // The tools sit over the top right corner, so the drawing starts below them.
    const top = 64;
    const s = Math.min(1, (w - 32) / width, (h - top - 16) / height);
    this.scale.set(Math.max(MIN, s));
    this.x.set((w - width * this.scale()) / 2);
    this.y.set(top);
  }

  /** Zoom around a point of the frame, by default its middle. */
  zoomBy(factor: number, cx?: number, cy?: number): void {
    const el = this.frame().nativeElement;
    const px = cx ?? el.clientWidth / 2;
    const py = cy ?? el.clientHeight / 2;
    const old = this.scale();
    const next = Math.min(MAX, Math.max(MIN, old * factor));
    this.x.set(px - ((px - this.x()) * next) / old);
    this.y.set(py - ((py - this.y()) * next) / old);
    this.scale.set(next);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.frame().nativeElement.getBoundingClientRect();
    this.zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX - rect.left, event.clientY - rect.top);
  }

  onDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.drag = { id: event.pointerId, sx: event.clientX, sy: event.clientY, x: this.x(), y: this.y(), moved: false };
  }

  onMove(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.sx;
    const dy = event.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      this.dragging.set(true);
      (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
    }
    this.x.set(d.x + dx);
    this.y.set(d.y + dy);
  }

  onUp(event: PointerEvent): void {
    if (this.drag?.id !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(false);
  }

  /** `+`, `-` and `0` zoom and fit; the arrow keys move the drawing. */
  onKey(event: KeyboardEvent): void {
    const move: Record<string, [number, number]> = {
      ArrowLeft: [40, 0],
      ArrowRight: [-40, 0],
      ArrowUp: [0, 40],
      ArrowDown: [0, -40],
    };
    if (event.key === '+' || event.key === '=') this.zoomBy(STEP);
    else if (event.key === '-') this.zoomBy(1 / STEP);
    else if (event.key === '0') this.fit();
    else if (move[event.key]) {
      this.x.update((v) => v + move[event.key][0]);
      this.y.update((v) => v + move[event.key][1]);
    } else return;
    event.preventDefault();
  }
}

export type { UmlBox };
