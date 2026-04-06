import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService, VehicleEntry } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-reports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header">
          <button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
          <h1><span class="material-icons-round">assessment</span> Vehicle Reports</h1>
        </div>
        <div class="filters">
          <input type="date" [(ngModel)]="from" />
          <span>to</span>
          <input type="date" [(ngModel)]="to" />
          <select [(ngModel)]="reportType">
            <option value="">All Entries</option>
            <option value="inside">Currently Inside</option>
            <option value="completed">Completed</option>
          </select>
          <button class="btn-primary" (click)="load()"><span class="material-icons-round">search</span> Generate</button>
        </div>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading report...</div>
      }

      @if (summary) {
        <!-- Summary Cards -->
        <div class="summary-row">
          <div class="sum-card"><span class="sum-val">{{ summary.totalEntries }}</span><span class="sum-lbl">Total Entries</span></div>
          <div class="sum-card"><span class="sum-val">{{ summary.completed }}</span><span class="sum-lbl">Completed</span></div>
          <div class="sum-card"><span class="sum-val">{{ summary.stillInside }}</span><span class="sum-lbl">Still Inside</span></div>
          <div class="sum-card highlight"><span class="sum-val">{{ formatWeight(summary.totalGrossWeight) }}</span><span class="sum-lbl">Total Gross (kg)</span></div>
          <div class="sum-card highlight"><span class="sum-val">{{ formatWeight(summary.totalNetWeight) }}</span><span class="sum-lbl">Total Net (kg)</span></div>
          <div class="sum-card"><span class="sum-val">{{ summary.avgDurationMins || 0 }}m</span><span class="sum-lbl">Avg Duration</span></div>
        </div>

        <!-- Report Table -->
        <div class="card">
          <div class="card-header">
            <h3><span class="material-icons-round">table_chart</span> {{ entries.length }} entries ({{ from }} to {{ to }})</h3>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Entry #</th><th>Vehicle</th><th>Type</th><th>Driver</th>
                  <th>Supplier</th><th>Transporter</th><th>Purpose</th><th>Challan</th>
                  <th>Gross (kg)</th><th>Tare (kg)</th><th>Net (kg)</th>
                  <th>In Time</th><th>Out Time</th><th>Duration</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (e of entries; track e.id) {
                  <tr>
                    <td class="mono">{{ e.entry_no }}</td>
                    <td><strong>{{ e.vehicle_no }}</strong></td>
                    <td class="cap">{{ e.vehicle_type }}</td>
                    <td>{{ e.driver_name }}<br><small class="muted">{{ e.driver_phone }}</small></td>
                    <td>{{ e.supplier_name || '—' }}</td>
                    <td>{{ e.transporter_name || '—' }}</td>
                    <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                    <td class="mono">{{ e.challan_no || '—' }}</td>
                    <td class="weight">{{ e.gross_weight || '—' }}</td>
                    <td class="weight">{{ e.tare_weight || '—' }}</td>
                    <td class="weight bold">{{ e.net_weight || '—' }}</td>
                    <td>{{ formatDT(e.in_time) }}</td>
                    <td>{{ e.out_time ? formatDT(e.out_time) : '—' }}</td>
                    <td>{{ calcDuration(e) }}</td>
                    <td><span class="status-badge" [class]="e.status">{{ e.status }}</span></td>
                  </tr>
                }
                @if (!entries.length) { <tr><td colspan="15" class="empty">No entries for the selected period</td></tr> }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 12px;
      h1 { font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; margin: 0;
        .material-icons-round { color: #0ea5e9; font-size: 28px; }
      }
    }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
    .filters { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
      input, select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; &:focus { outline: none; border-color: #0ea5e9; } }
      span { color: #64748b; font-size: 0.85rem; }
    }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer;
      &:hover { transform: translateY(-1px); } .material-icons-round { font-size: 18px; }
    }
    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
    .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .sum-card { background: #fff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06); display: flex; flex-direction: column;
      .sum-val { font-size: 1.4rem; font-weight: 800; color: #0ea5e9; }
      .sum-lbl { font-size: 0.72rem; color: #64748b; margin-top: 2px; text-transform: uppercase; }
      &.highlight { border: 2px solid #0ea5e9; .sum-val { color: #0369a1; } }
    }
    .card { background: #fff; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .card-header { margin-bottom: 1rem;
      h3 { font-size: 0.9rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 0.4rem;
        .material-icons-round { font-size: 20px; color: #0ea5e9; }
      }
    }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    td { padding: 0.45rem 0.5rem; font-size: 0.8rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:hover td { background: #f8fafc; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .muted { color: #94a3b8; font-size: 0.72rem; }
    .cap { text-transform: capitalize; }
    .weight { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
    .bold { font-weight: 700; }
    .empty { text-align: center; padding: 2rem; color: #94a3b8; }
    .purpose-tag { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; text-transform: capitalize; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; text-transform: capitalize;
      &.in { background: #dcfce7; color: #166534; } &.out { background: #f1f5f9; color: #64748b; }
      &.with_officer { background: #fff7ed; color: #c2410c; } &.with_qa { background: #f0fdfa; color: #0f766e; }
      &.loading { background: #fef3c7; color: #92400e; } &.unloading { background: #fce7f3; color: #9d174d; }
      &.waiting_second_weight { background: #faf5ff; color: #7e22ce; } &.ready_to_exit { background: #fef2f2; color: #b91c1c; }
      &.cancelled { background: #fee2e2; color: #991b1b; }
    }
    @media (max-width: 768px) { .filters { flex-direction: column; } }
  `]
})
export class VehicleReportsComponent implements OnInit {
  from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);
  reportType = '';
  loading = false;
  entries: VehicleEntry[] = [];
  summary: any = null;

  constructor(private svc: VehicleService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  goBack() { this.router.navigate(['/vehicle/dashboard']); }

  load() {
    this.loading = true;
    this.svc.getReports(this.from, this.to, this.reportType).subscribe({
      next: (r) => {
        this.entries = r.entries;
        this.summary = r.summary;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  formatWeight(val: any): string {
    if (!val) return '0';
    const n = parseFloat(val);
    return n >= 1000 ? (n / 1000).toFixed(1) + 'T' : String(Math.round(n));
  }

  calcDuration(e: VehicleEntry): string {
    if (!e.in_time || !e.out_time) return '—';
    const diff = new Date(e.out_time).getTime() - new Date(e.in_time).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  formatDT(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
