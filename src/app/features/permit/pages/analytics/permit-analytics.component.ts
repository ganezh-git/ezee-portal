import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermitService } from '../../services/permit.service';
import { PermitAnalytics, PERMIT_STATUS_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-permit-analytics',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './permit-analytics.component.html',
  styleUrl: './permit-analytics.component.scss',
})
export class PermitAnalyticsComponent implements OnInit, AfterViewChecked {
  loading = true;
  data: PermitAnalytics | null = null;
  statusConfig = PERMIT_STATUS_CONFIG;
  private chartsDrawn = false;

  @ViewChild('trendChart') trendChartEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusPie') statusPieEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyLine') dailyLineEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeBar') typeBarEl!: ElementRef<HTMLCanvasElement>;

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.permitService.getAnalytics().subscribe({
      next: (d) => {
        this.data = d;
        this.loading = false;
        this.chartsDrawn = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  ngAfterViewChecked(): void {
    if (!this.loading && this.data && !this.chartsDrawn && this.trendChartEl) {
      this.chartsDrawn = true;
      setTimeout(() => this.drawAllCharts(), 50);
    }
  }

  get totalPermits(): number {
    return this.data?.statusCounts.reduce((a, b) => a + b.count, 0) || 0;
  }

  get avgPerDay(): string {
    const days = this.data?.dailyCounts?.length || 1;
    const total = this.data?.dailyCounts?.reduce((a, b) => a + b.count, 0) || 0;
    return (total / Math.max(days, 1)).toFixed(1);
  }

  get closureRate(): string {
    const closed = (this.data?.statusCounts.find(s => s.status === 'Permit Returned')?.count || 0)
      + (this.data?.statusCounts.find(s => s.status === 'Lock Released')?.count || 0);
    return ((closed / Math.max(this.totalPermits, 1)) * 100).toFixed(0);
  }

  get activeCount(): number {
    return this.data?.statusCounts.find(s => s.status === 'Printable and permit to be surrender')?.count || 0;
  }

  get topDept(): string {
    return this.data?.departmentBreakdown?.[0]?.name || '—';
  }

  get topType(): string {
    if (!this.data?.typeCounts?.length) return '—';
    return [...this.data.typeCounts].sort((a, b) => b.count - a.count)[0]?.label || '—';
  }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  private drawAllCharts(): void {
    this.drawTrendChart();
    this.drawStatusPie();
    this.drawDailyLine();
    this.drawTypeBar();
  }

  private drawTrendChart(): void {
    const canvas = this.trendChartEl?.nativeElement;
    if (!canvas || !this.data?.monthlyTrend?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dd = this.data.monthlyTrend;
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    const pad = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...dd.map(d => d.count), 1);
    const barW = chartW / dd.length * 0.35;
    const gap = chartW / dd.length;

    // Grid
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + chartH - (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal / 4 * i)), pad.left - 5, y + 3);
    }

    dd.forEach((d, i) => {
      const x = pad.left + i * gap + gap / 2;

      // Created bar
      const totalH = (d.count / maxVal) * chartH;
      const grad = ctx.createLinearGradient(x - barW, pad.top + chartH - totalH, x - barW, pad.top + chartH);
      grad.addColorStop(0, '#3b82f6'); grad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(x - barW - 2, pad.top + chartH - totalH, barW, totalH, [3, 3, 0, 0]); ctx.fill();

      // Closed bar
      const closedH = ((d.closed || 0) / maxVal) * chartH;
      const grad2 = ctx.createLinearGradient(x + 2, pad.top + chartH - closedH, x + 2, pad.top + chartH);
      grad2.addColorStop(0, '#16a34a'); grad2.addColorStop(1, '#86efac');
      ctx.fillStyle = grad2;
      ctx.beginPath(); ctx.roundRect(x + 2, pad.top + chartH - closedH, barW, closedH, [3, 3, 0, 0]); ctx.fill();

      // Label
      ctx.fillStyle = '#64748b'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x, pad.top + chartH + 16);
    });

    // Legend
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(pad.left, h - 12, 10, 8);
    ctx.fillStyle = '#334155'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Created', pad.left + 14, h - 5);
    ctx.fillStyle = '#16a34a'; ctx.fillRect(pad.left + 60, h - 12, 10, 8);
    ctx.fillStyle = '#334155'; ctx.fillText('Closed', pad.left + 74, h - 5);
  }

  private drawStatusPie(): void {
    const canvas = this.statusPieEl?.nativeElement;
    if (!canvas || !this.data?.statusCounts?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);

    const total = this.data.statusCounts.reduce((a, b) => a + b.count, 0);
    if (total === 0) return;

    const cx = w / 2, cy = h / 2 - 10;
    const R = Math.min(w, h) / 2 - 30;
    const r = R * 0.55; // donut hole

    const colors = ['#3b82f6', '#16a34a', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#eab308', '#ec4899', '#64748b'];
    let angle = -Math.PI / 2;

    this.data.statusCounts.forEach((s, i) => {
      const slice = (s.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, angle, angle + slice);
      ctx.arc(cx, cy, r, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      angle += slice;
    });

    // Center text
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(total), cx, cy + 3);
    ctx.fillStyle = '#64748b'; ctx.font = '9px sans-serif';
    ctx.fillText('Total', cx, cy + 16);

    // Legend below
    let lx = 10, ly = h - 12;
    this.data.statusCounts.slice(0, 6).forEach((s, i) => {
      const label = this.getStatusStyle(s.status).label;
      ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(lx, ly - 7, 8, 8);
      ctx.fillStyle = '#475569'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
      const text = `${label} (${s.count})`;
      ctx.fillText(text, lx + 11, ly);
      lx += ctx.measureText(text).width + 20;
      if (lx > w - 40) { lx = 10; ly += 13; }
    });
  }

  private drawDailyLine(): void {
    const canvas = this.dailyLineEl?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const raw = this.data!.dailyCounts || [];
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    const pad = { top: 20, right: 20, bottom: 35, left: 35 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);

    // Fill last 15 days
    const days: { date: string; count: number }[] = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const found = raw.find((dd: any) => dd.date === ds);
      days.push({ date: ds, count: found ? found.count : 0 });
    }

    const maxVal = Math.max(...days.map(d => d.count), 1);

    // Grid
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + chartH - (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal / 4 * i)), pad.left - 5, y + 3);
    }

    // Area fill
    const stepX = chartW / (days.length - 1);
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    days.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.count / maxVal) * chartH;
      if (i === 0) ctx.lineTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    areaGrad.addColorStop(0, 'rgba(59,130,246,0.2)'); areaGrad.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = areaGrad; ctx.fill();

    // Line
    ctx.beginPath();
    days.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.count / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();

    // Dots
    days.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.count / maxVal) * chartH;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();
    });

    // Date labels (show every 3rd)
    days.forEach((d, i) => {
      if (i % 3 !== 0 && i !== days.length - 1) return;
      const x = pad.left + i * stepX;
      ctx.fillStyle = '#94a3b8'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.date.slice(5), x, pad.top + chartH + 14);
    });
  }

  private drawTypeBar(): void {
    const canvas = this.typeBarEl?.nativeElement;
    if (!canvas || !this.data?.typeCounts?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);

    const types = [...this.data.typeCounts].sort((a, b) => b.count - a.count);
    const maxVal = Math.max(...types.map(t => t.count), 1);
    const barH = Math.min(24, (h - 20) / types.length - 4);
    const labelWidth = 80;
    const barMaxW = w - labelWidth - 50;

    types.forEach((t, i) => {
      const y = 10 + i * (barH + 6);
      // Label
      ctx.fillStyle = '#475569'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(t.label, labelWidth - 8, y + barH / 2 + 4);
      // Bar
      const bw = (t.count / maxVal) * barMaxW;
      const grad = ctx.createLinearGradient(labelWidth, y, labelWidth + bw, y);
      grad.addColorStop(0, t.color); grad.addColorStop(1, t.color + '88');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(labelWidth, y, bw, barH, [0, 4, 4, 0]); ctx.fill();
      // Value
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(String(t.count), labelWidth + bw + 6, y + barH / 2 + 4);
    });
  }
}
