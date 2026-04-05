import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PermitBirlaService, BirlaStats } from '../../services/permit-birla.service';
import { PERMIT_STATUS_CONFIG, PERMIT_TYPE_ICONS, PermitType } from '../../models/permit-birla.models';

@Component({
  selector: 'app-birla-analytics',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './birla-analytics.component.html',
  styleUrl: './birla-analytics.component.scss',
})
export class BirlaAnalyticsComponent implements OnInit, AfterViewChecked {
  loading = true;
  stats: BirlaStats | null = null;
  permitTypes: PermitType[] = [];
  statusConfig = PERMIT_STATUS_CONFIG;
  typeIcons = PERMIT_TYPE_ICONS;
  private chartsDrawn = false;

  @ViewChild('trendChart') trendChartEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeRadar') typeRadarEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusPie') statusPieEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyLine') dailyLineEl!: ElementRef<HTMLCanvasElement>;

  constructor(private svc: PermitBirlaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      types: this.svc.getTypes(),
      stats: this.svc.getStats(),
    }).subscribe({
      next: (data) => {
        this.permitTypes = data.types;
        this.stats = data.stats;
        this.loading = false;
        this.chartsDrawn = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  ngAfterViewChecked(): void {
    if (!this.loading && this.stats && !this.chartsDrawn && this.trendChartEl) {
      this.chartsDrawn = true;
      setTimeout(() => this.drawAllCharts(), 50);
    }
  }

  get totalPermits(): number {
    return this.stats?.statusCounts.reduce((a, b) => a + b.count, 0) || 0;
  }

  get avgPerDay(): string {
    const days = this.stats?.dailyCounts?.length || 1;
    const total = this.stats?.dailyCounts?.reduce((a, b) => a + b.count, 0) || 0;
    return (total / Math.max(days, 1)).toFixed(1);
  }

  get closureRate(): string {
    const closed = this.stats?.statusCounts.find(s => s.status === 'Closed')?.count || 0;
    const total = this.totalPermits || 1;
    return ((closed / total) * 100).toFixed(0);
  }

  get suspensionRate(): string {
    const suspended = this.stats?.statusCounts.find(s => s.status === 'Suspended')?.count || 0;
    const total = this.totalPermits || 1;
    return ((suspended / total) * 100).toFixed(1);
  }

  get topDept(): string {
    if (!this.stats?.departmentBreakdown?.length) return '—';
    return this.stats.departmentBreakdown[0].name;
  }

  get topType(): string {
    if (!this.stats?.typeCounts?.length) return '—';
    const sorted = [...this.stats.typeCounts].sort((a, b) => b.count - a.count);
    return sorted[0]?.short_label || '—';
  }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  private drawAllCharts(): void {
    this.drawTrendChart();
    this.drawStatusPie();
    this.drawDailyLine();
    this.drawTypeRadar();
  }

  private drawTrendChart(): void {
    const canvas = this.trendChartEl?.nativeElement;
    if (!canvas || !this.stats?.monthlyTrend?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.stats.monthlyTrend;
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    const pad = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map(d => d.count), 1);
    const barW = chartW / data.length * 0.35;
    const gap = chartW / data.length;

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + chartH - (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal / 4 * i)), pad.left - 5, y + 3);
    }

    data.forEach((d, i) => {
      const x = pad.left + i * gap + gap / 2;

      // Total bar
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
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(pad.left, h - 12, 10, 8);
    ctx.fillStyle = '#334155'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Created', pad.left + 14, h - 5);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(pad.left + 60, h - 12, 10, 8);
    ctx.fillStyle = '#334155';
    ctx.fillText('Closed', pad.left + 74, h - 5);
  }

  private drawDailyLine(): void {
    const canvas = this.dailyLineEl?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.stats!.dailyCounts || [];
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
      const found = data.find((dd: any) => dd.date === ds);
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
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    areaGrad.addColorStop(0, 'rgba(230, 81, 0, 0.15)');
    areaGrad.addColorStop(1, 'rgba(230, 81, 0, 0.01)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    days.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.count / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    days.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - (d.count / maxVal) * chartH;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // X labels
    days.forEach((d, i) => {
      if (i % 2 === 0 || i === days.length - 1) {
        const x = pad.left + i * stepX;
        ctx.fillStyle = '#94a3b8'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(new Date(d.date).getDate()), x, pad.top + chartH + 14);
      }
    });
  }

  private drawStatusPie(): void {
    const canvas = this.statusPieEl?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = (this.stats!.statusCounts || []).filter(s => s.count > 0);
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const total = data.reduce((a, b) => a + b.count, 0);
    const cx = w / 2, cy = h / 2 - 10;
    const r = Math.min(cx, cy) - 15;
    const statusColors: Record<string, string> = {
      Active: '#16a34a', Initiated: '#2563eb', Issued: '#7c3aed',
      Custodian_Approved: '#059669', Closed: '#6b7280',
      Suspended: '#dc2626', Extended: '#d97706', Cancelled: '#991b1b', Draft: '#94a3b8',
    };

    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const slice = (d.count / total) * 2 * Math.PI;
      const midAngle = startAngle + slice / 2;

      // Slight explosion for emphasis
      const ex = i === 0 ? 3 : 0;
      const ecx = cx + Math.cos(midAngle) * ex;
      const ecy = cy + Math.sin(midAngle) * ex;

      ctx.beginPath();
      ctx.moveTo(ecx, ecy);
      ctx.arc(ecx, ecy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = statusColors[d.status] || '#94a3b8';
      ctx.fill();

      // Percentage label
      const pct = ((d.count / total) * 100);
      if (pct > 8) {
        const labelR = r * 0.65;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pct.toFixed(0) + '%', lx, ly + 3);
      }

      startAngle += slice;
    });

    // Legend below
    const cols = Math.min(data.length, 4);
    const legendW = w / cols;
    data.forEach((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const lx = col * legendW + 12;
      const ly = h - 20 + row * 14;
      ctx.fillStyle = statusColors[d.status] || '#94a3b8';
      ctx.beginPath(); ctx.arc(lx, ly, 3, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
      const label = this.statusConfig[d.status]?.label || d.status;
      ctx.fillText(`${label} (${d.count})`, lx + 8, ly + 3);
    });
  }

  private drawTypeRadar(): void {
    const canvas = this.typeRadarEl?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = (this.stats!.typeCounts || []).filter(t => t.count > 0);
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    if (data.length < 3) return;

    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(cx, cy) - 30;
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const n = data.length;
    const angleStep = (2 * Math.PI) / n;

    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * maxR;
      ctx.beginPath();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5;
      for (let i = 0; i <= n; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axis lines
    data.forEach((_, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Data polygon
    ctx.beginPath();
    data.forEach((d, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (d.count / maxVal) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    ctx.stroke();

    // Dots and labels
    data.forEach((d, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (d.count / maxVal) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6'; ctx.fill();

      // Label
      const lx = cx + Math.cos(angle) * (maxR + 14);
      const ly = cy + Math.sin(angle) * (maxR + 14);
      ctx.fillStyle = '#475569'; ctx.font = '8px sans-serif';
      ctx.textAlign = angle > Math.PI / 2 && angle < 3 * Math.PI / 2 ? 'right' : angle === Math.PI / 2 || angle === -Math.PI / 2 ? 'center' : 'left';
      ctx.fillText(d.short_label, lx, ly + 3);
    });
  }
}
