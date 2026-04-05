import { Component, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SignaturePadComponent), multi: true }],
  template: `
    <div class="sig-wrap">
      <canvas #cv width="280" height="80" (pointerdown)="start($event)" (pointermove)="draw($event)" (pointerup)="end()" (pointerleave)="end()"></canvas>
      <button type="button" class="sig-clear" (click)="clear()">✕</button>
    </div>
  `,
  styles: [`
    .sig-wrap { position: relative; display: inline-block; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; }
    canvas { display: block; cursor: crosshair; touch-action: none; }
    .sig-clear { position: absolute; top: 2px; right: 4px; background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer; &:hover { color: #dc2626; } }
  `],
})
export class SignaturePadComponent implements ControlValueAccessor {
  @ViewChild('cv', { static: true }) cvRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private hasContent = false;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.ctx = this.cvRef.nativeElement.getContext('2d')!;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#1e293b';
  }

  start(e: PointerEvent): void {
    this.drawing = true;
    this.ctx.beginPath();
    const r = this.cvRef.nativeElement.getBoundingClientRect();
    this.ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  }

  draw(e: PointerEvent): void {
    if (!this.drawing) return;
    const r = this.cvRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    this.ctx.stroke();
    this.hasContent = true;
  }

  end(): void {
    if (!this.drawing) return;
    this.drawing = false;
    this.onTouched();
    this.onChange(this.hasContent ? this.cvRef.nativeElement.toDataURL('image/webp', 0.5) : '');
  }

  clear(): void {
    this.ctx.clearRect(0, 0, 280, 80);
    this.hasContent = false;
    this.onChange('');
  }

  writeValue(v: string): void {
    if (!v) { this.clear(); return; }
    const img = new Image();
    img.onload = () => { this.ctx.clearRect(0, 0, 280, 80); this.ctx.drawImage(img, 0, 0); this.hasContent = true; };
    img.src = v;
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
