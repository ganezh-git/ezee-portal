import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VehicleService, VehicleStats, VehicleEntry } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <span class="material-icons-round header-icon">local_shipping</span>
          <div><h1>Vehicle Entry Management</h1><p>Weighbridge & Workflow Dashboard</p></div>
        </div>
        <a routerLink="../entries" [queryParams]="{action:'new'}" class="btn-primary">
          <span class="material-icons-round">add_circle</span> New Entry
        </a>
      </div>
      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <!-- Top Stats -->
        <div class="stat-grid">
          <a routerLink="../entries" class="stat-card green"><div class="stat-icon"><span class="material-icons-round">login</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.activeEntries }}</span><span class="stat-lbl">Vehicles Inside</span></div></a>
          <div class="stat-card amber"><div class="stat-icon"><span class="material-icons-round">today</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.todayEntries }}</span><span class="stat-lbl">Today's Entries</span></div></div>
          <a routerLink="../entries" [queryParams]="{status:'with_officer'}" class="stat-card orange"><div class="stat-icon"><span class="material-icons-round">person</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.waitingOfficer }}</span><span class="stat-lbl">With Officer</span></div></a>
          <a routerLink="../entries" [queryParams]="{status:'waiting_second_weight'}" class="stat-card purple"><div class="stat-icon"><span class="material-icons-round">scale</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.waitingSecondWeight }}</span><span class="stat-lbl">Waiting 2nd Weight</span></div></a>
          <a routerLink="../entries" [queryParams]="{status:'ready_to_exit'}" class="stat-card red"><div class="stat-icon"><span class="material-icons-round">logout</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.readyToExit }}</span><span class="stat-lbl">Ready to Exit</span></div></a>
          <div class="stat-card blue"><div class="stat-icon"><span class="material-icons-round">directions_car</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.totalVehicles }}</span><span class="stat-lbl">Fleet Vehicles</span></div></div>
        </div>

        <!-- Workflow Pipeline -->
        <div class="card pipeline-card">
          <h3><span class="material-icons-round">account_tree</span> Workflow Pipeline</h3>
          <div class="pipeline">
            <div class="pipe-stage" [class.active]="gateInCount > 0">
              <div class="pipe-count">{{ gateInCount }}</div>
              <div class="pipe-label">Gate In</div>
            </div>
            <span class="material-icons-round pipe-arrow">arrow_forward</span>
            <div class="pipe-stage" [class.active]="(stats?.waitingOfficer || 0) > 0">
              <div class="pipe-count">{{ stats?.waitingOfficer }}</div>
              <div class="pipe-label">Officer Review</div>
            </div>
            <span class="material-icons-round pipe-arrow">arrow_forward</span>
            <div class="pipe-stage" [class.active]="qaCount > 0">
              <div class="pipe-count">{{ qaCount }}</div>
              <div class="pipe-label">QA Check</div>
            </div>
            <span class="material-icons-round pipe-arrow">arrow_forward</span>
            <div class="pipe-stage" [class.active]="loadingCount > 0">
              <div class="pipe-count">{{ loadingCount }}</div>
              <div class="pipe-label">Loading/Unloading</div>
            </div>
            <span class="material-icons-round pipe-arrow">arrow_forward</span>
            <div class="pipe-stage" [class.active]="(stats?.waitingSecondWeight || 0) > 0">
              <div class="pipe-count">{{ stats?.waitingSecondWeight }}</div>
              <div class="pipe-label">2nd Weighment</div>
            </div>
            <span class="material-icons-round pipe-arrow">arrow_forward</span>
            <div class="pipe-stage" [class.active]="(stats?.readyToExit || 0) > 0">
              <div class="pipe-count">{{ stats?.readyToExit }}</div>
              <div class="pipe-label">Ready to Exit</div>
            </div>
          </div>
        </div>

        <!-- Currently Inside -->
        @if (insideVehicles.length) {
          <div class="card">
            <div class="card-header"><h3><span class="material-icons-round">warehouse</span> Currently Inside ({{ insideVehicles.length }})</h3></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Entry #</th><th>Vehicle</th><th>Type</th><th>Driver</th><th>Supplier</th><th>Gross (kg)</th><th>Tare (kg)</th><th>Net (kg)</th><th>Purpose</th><th>In Since</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  @for (e of insideVehicles; track e.id) {
                    <tr>
                      <td class="mono">{{ e.entry_no }}</td>
                      <td><strong>{{ e.vehicle_no }}</strong></td>
                      <td class="cap">{{ e.vehicle_type }}</td>
                      <td>{{ e.driver_name }}<br><small class="muted">{{ e.driver_phone || e.driver_mobile || '' }}</small></td>
                      <td>{{ e.supplier_name || e.transporter_name || '—' }}</td>
                      <td class="weight">{{ e.gross_weight || '—' }}</td>
                      <td class="weight">{{ e.tare_weight || '—' }}</td>
                      <td class="weight bold">{{ e.net_weight || '—' }}</td>
                      <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                      <td>{{ formatTime(e.in_time) }}</td>
                      <td class="duration">{{ calcDuration(e.in_time) }}</td>
                      <td><span class="status-badge" [class]="e.status">{{ statusLabel(e.status) }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Purpose Breakdown + Fleet Status -->
        <div class="cards-row">
          <div class="card">
            <h3><span class="material-icons-round">pie_chart</span> Entry by Purpose</h3>
            <div class="purpose-list">
              @for (p of stats?.purposeBreakdown || []; track p.purpose) {
                <div class="purpose-row">
                  <span class="purpose-label">{{ p.purpose }}</span>
                  <div class="purpose-bar-wrap"><div class="purpose-bar" [style.width.%]="getBarWidth(p.count)"></div></div>
                  <span class="purpose-count">{{ p.count }}</span>
                </div>
              }
            </div>
          </div>
          <div class="card">
            <h3><span class="material-icons-round">garage</span> Fleet Status</h3>
            <div class="purpose-list">
              @for (s of stats?.vehicleStatus || []; track s.status) {
                <div class="purpose-row">
                  <span class="status-badge" [class]="s.status">{{ s.status }}</span>
                  <span class="purpose-count">{{ s.count }}</span>
                </div>
              }
              @if (!stats?.vehicleStatus?.length) {
                <div class="empty">No vehicles registered</div>
              }
            </div>
          </div>
        </div>

        <!-- Recent Entries -->
        <div class="card">
          <div class="card-header"><h3><span class="material-icons-round">history</span> Recent Vehicle Entries</h3>
            <a routerLink="../entries" class="view-all">View All <span class="material-icons-round">arrow_forward</span></a>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Entry #</th><th>Vehicle</th><th>Driver</th><th>Supplier</th><th>Purpose</th><th>Gross</th><th>Net</th><th>In Time</th><th>Status</th></tr></thead>
              <tbody>
                @for (e of stats?.recentEntries || []; track e.id) {
                  <tr>
                    <td class="mono">{{ e.entry_no }}</td>
                    <td><strong>{{ e.vehicle_no }}</strong></td>
                    <td>{{ e.driver_name }}</td>
                    <td>{{ e.supplier_name || '—' }}</td>
                    <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                    <td class="weight">{{ e.gross_weight || '—' }}</td>
                    <td class="weight bold">{{ e.net_weight || '—' }}</td>
                    <td>{{ formatTime(e.in_time) }}</td>
                    <td><span class="status-badge" [class]="e.status">{{ statusLabel(e.status) }}</span></td>
                  </tr>
                }
                @if (!stats?.recentEntries?.length) {
                  <tr><td colspan="9" class="empty">No entries yet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './vehicle-dashboard.component.scss',
})
export class VehicleDashboardComponent implements OnInit {
  loading = true;
  stats: VehicleStats | null = null;
  insideVehicles: VehicleEntry[] = [];
  gateInCount = 0;
  qaCount = 0;
  loadingCount = 0;

  constructor(private svc: VehicleService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getStats().subscribe({
      next: (s) => { this.stats = s; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
    this.svc.getCurrentlyInside().subscribe({
      next: (v) => {
        this.insideVehicles = v;
        this.gateInCount = v.filter(e => e.status === 'in').length;
        this.qaCount = v.filter(e => e.status === 'with_qa').length;
        this.loadingCount = v.filter(e => e.status === 'loading' || e.status === 'unloading').length;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      waiting_entry: 'Waiting Entry', in: 'Gate In', with_officer: 'With Officer',
      with_qa: 'With QA', loading: 'Loading', unloading: 'Unloading',
      waiting_second_weight: '2nd Weight', ready_to_exit: 'Ready Exit',
      out: 'Out', cancelled: 'Cancelled'
    };
    return map[s] || s;
  }

  getBarWidth(count: number): number {
    const max = Math.max(...(this.stats?.purposeBreakdown?.map(p => p.count) || [1]));
    return (count / max) * 100;
  }

  calcDuration(inTime: string): string {
    if (!inTime) return '—';
    const diff = Date.now() - new Date(inTime).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  formatTime(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
