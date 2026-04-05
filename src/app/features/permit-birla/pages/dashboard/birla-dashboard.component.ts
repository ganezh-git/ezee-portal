import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PermitBirlaService, BirlaStats, BirlaNotification } from '../../services/permit-birla.service';
import { BirlaPermit, PermitType, PERMIT_STATUS_CONFIG, PERMIT_TYPE_ICONS } from '../../models/permit-birla.models';

@Component({
  selector: 'app-birla-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './birla-dashboard.component.html',
  styleUrl: './birla-dashboard.component.scss',
})
export class BirlaDashboardComponent implements OnInit, AfterViewChecked {
  loading = true;
  permitTypes: PermitType[] = [];
  recentPermits: BirlaPermit[] = [];
  stats: BirlaStats | null = null;
  notifications: BirlaNotification[] = [];
  statusConfig = PERMIT_STATUS_CONFIG;
  typeIcons = PERMIT_TYPE_ICONS;
  showNotifPanel = false;
  private chartsDrawn = false;

  @ViewChild('dailyChart') dailyChartEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart') typeChartEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartEl!: ElementRef<HTMLCanvasElement>;

  constructor(private svc: PermitBirlaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      types: this.svc.getTypes(),
      stats: this.svc.getStats(),
      notifications: this.svc.getNotifications(),
      permits: this.svc.getPermits({ limit: 200 }),
    }).subscribe({
      next: (data) => {
        this.permitTypes = data.types;
        this.stats = data.stats;
        this.notifications = data.notifications;
        this.recentPermits = data.permits.permits.slice(0, 8);
        this.loading = false;
        this.chartsDrawn = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  ngAfterViewChecked(): void {
    if (!this.loading && this.stats && !this.chartsDrawn && this.dailyChartEl) {
      this.chartsDrawn = true;
      setTimeout(() => this.drawCharts(), 50);
    }
  }

  get totalPermits(): number {
    if (!this.stats) return 0;
    return this.stats.statusCounts.reduce((a, b) => a + b.count, 0);
  }

  get activeCount(): number {
    if (!this.stats) return 0;
    return this.stats.statusCounts
      .filter(s => s.status === 'Active' || s.status === 'Extended')
      .reduce((a, b) => a + b.count, 0);
  }

  get pendingCount(): number {
    if (!this.stats) return 0;
    return this.stats.statusCounts
      .filter(s => ['Initiated', 'Issued', 'Custodian_Approved'].includes(s.status))
      .reduce((a, b) => a + b.count, 0);
  }

  get closedCount(): number {
    if (!this.stats) return 0;
    return this.stats.statusCounts
      .filter(s => s.status === 'Closed')
      .reduce((a, b) => a + b.count, 0);
  }

  get suspendedCount(): number {
    if (!this.stats) return 0;
    return this.stats.statusCounts
      .filter(s => s.status === 'Suspended')
      .reduce((a, b) => a + b.count, 0);
  }

  get overdueCount(): number {
    return this.stats?.overdue?.length || 0;
  }

  get dangerNotifs(): BirlaNotification[] {
    return this.notifications.filter(n => n.type === 'danger');
  }

  get warningNotifs(): BirlaNotification[] {
    return this.notifications.filter(n => n.type === 'warning');
  }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  getTypeCount(code: string): number {
    if (!this.stats) return 0;
    const found = this.stats.typeCounts.find(t => t.code === code);
    return found ? found.count : 0;
  }

  toggleNotifPanel(): void {
    this.showNotifPanel = !this.showNotifPanel;
    this.cdr.markForCheck();
  }

  // ─── Chart Drawing ──────────────────────────────────────────
  private drawCharts(): void {
    this.drawDailyChart();
    this.drawTypeChart();
    this.drawStatusDonut();
  }

  private drawDailyChart(): void {
    const canvas = this.dailyChartEl?.nativeElement;
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
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const found = data.find((dd: any) => dd.date === ds);
      days.push({ date: ds, count: found ? found.count : 0 });
    }

    const maxVal = Math.max(...days.map(d => d.count), 1);
    const stepY = chartH / maxVal;

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + chartH - (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal / 4 * i)), pad.left - 5, y + 3);
    }

    // Bars with gradient
    const barW = chartW / days.length * 0.6;
    const gap = chartW / days.length;
    days.forEach((d, i) => {
      const x = pad.left + i * gap + (gap - barW) / 2;
      const barH = d.count * stepY;
      const y = pad.top + chartH - barH;
      const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(new Date(d.date).getDate()), x + barW / 2, pad.top + chartH + 14);
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Last 15 Days', w / 2, h - 3);
  }

  private drawTypeChart(): void {
    const canvas = this.typeChartEl?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = (this.stats!.typeCounts || []).filter(t => t.count > 0);
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    const pad = { top: 10, right: 10, bottom: 10, left: 80 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const maxVal = Math.max(...data.map(d => d.count), 1);
    const barH = Math.min(20, chartH / data.length * 0.7);
    const gap = chartH / data.length;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

    data.forEach((d, i) => {
      const y = pad.top + i * gap + (gap - barH) / 2;
      const bw = (d.count / maxVal) * chartW;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.roundRect(pad.left, y, bw, barH, [0, 4, 4, 0]);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(d.short_label, pad.left - 5, y + barH / 2 + 3);
      if (bw > 20) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(String(d.count), pad.left + 5, y + barH / 2 + 3);
      } else {
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'left';
        ctx.fillText(String(d.count), pad.left + bw + 5, y + barH / 2 + 3);
      }
    });
  }

  private drawStatusDonut(): void {
    const canvas = this.statusChartEl?.nativeElement;
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
    const cx = w * 0.35, cy = h / 2;
    const outerR = Math.min(cx, cy) - 10;
    const innerR = outerR * 0.55;
    const statusColors: Record<string, string> = {
      Active: '#16a34a', Initiated: '#2563eb', Issued: '#7c3aed',
      Custodian_Approved: '#059669', Closed: '#6b7280',
      Suspended: '#dc2626', Extended: '#d97706', Cancelled: '#991b1b', Draft: '#94a3b8',
    };

    let startAngle = -Math.PI / 2;
    data.forEach(d => {
      const slice = (d.count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = statusColors[d.status] || '#94a3b8';
      ctx.fill();
      startAngle += slice;
    });

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(total), cx, cy + 2);
    ctx.fillStyle = '#64748b';
    ctx.font = '8px sans-serif';
    ctx.fillText('Total', cx, cy + 14);

    const legendX = w * 0.65;
    let legendY = 15;
    data.forEach(d => {
      ctx.fillStyle = statusColors[d.status] || '#94a3b8';
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      const label = this.statusConfig[d.status]?.label || d.status;
      ctx.fillText(`${label}: ${d.count}`, legendX + 10, legendY + 3);
      legendY += 18;
    });
  }
}
