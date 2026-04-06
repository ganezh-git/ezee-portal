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
          <div><h1>Vehicle Entry Management</h1><p>Dashboard — Real-time overview</p></div>
        </div>
        <a routerLink="../entries" [queryParams]="{action:'new'}" class="btn-primary">
          <span class="material-icons-round">add_circle</span> New Entry
        </a>
      </div>
      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <div class="stat-grid">
          <div class="stat-card blue"><div class="stat-icon"><span class="material-icons-round">directions_car</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.totalVehicles }}</span><span class="stat-lbl">Fleet Vehicles</span></div></div>
          <a routerLink="../entries" class="stat-card green"><div class="stat-icon"><span class="material-icons-round">login</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.activeEntries }}</span><span class="stat-lbl">Vehicles Inside</span></div></a>
          <div class="stat-card amber"><div class="stat-icon"><span class="material-icons-round">today</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.todayEntries }}</span><span class="stat-lbl">Today's Entries</span></div></div>
          <a routerLink="../trips" class="stat-card purple"><div class="stat-icon"><span class="material-icons-round">pending_actions</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.pendingTrips }}</span><span class="stat-lbl">Pending Trips</span></div></a>
          <a routerLink="../gate-log" class="stat-card red"><div class="stat-icon"><span class="material-icons-round">swap_horiz</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.currentlyOut }}</span><span class="stat-lbl">Vehicles Out</span></div></a>
          <div class="stat-card teal"><div class="stat-icon"><span class="material-icons-round">pending</span></div>
            <div class="stat-info"><span class="stat-val">{{ pendingConfirmations.length }}</span><span class="stat-lbl">Pending Confirms</span></div></div>
        </div>

        <!-- Currently Inside -->
        @if (insideVehicles.length) {
          <div class="card">
            <div class="card-header"><h3><span class="material-icons-round">warehouse</span> Currently Inside ({{ insideVehicles.length }})</h3></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Badge</th><th>Vehicle</th><th>Driver</th><th>Company</th><th>Purpose</th><th>Host</th><th>PPE</th><th>In Since</th><th>Duration</th></tr></thead>
                <tbody>
                  @for (e of insideVehicles; track e.id) {
                    <tr>
                      <td><span class="badge-tag">{{ e.badge_no || '—' }}</span></td>
                      <td><strong>{{ e.vehicle_no }}</strong><br><small class="muted cap">{{ e.vehicle_type }}</small></td>
                      <td>{{ e.driver_name }}<br><small class="muted">{{ e.driver_phone }}</small></td>
                      <td>{{ e.company || '—' }}</td>
                      <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                      <td>{{ e.host_name || '—' }}</td>
                      <td>{{ e.ppe_issued ? 'Yes' : '—' }}</td>
                      <td>{{ formatTime(e.in_time) }}</td>
                      <td class="duration">{{ calcDuration(e.in_time) }}</td>
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

        <!-- Pending Confirmations -->
        @if (pendingConfirmations.length) {
          <div class="card alert-card">
            <div class="card-header"><h3><span class="material-icons-round">verified</span> Pending Visit Confirmations</h3></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Entry #</th><th>Vehicle</th><th>Driver</th><th>Host</th><th>In Time</th><th>Action</th></tr></thead>
                <tbody>
                  @for (e of pendingConfirmations; track e.id) {
                    <tr>
                      <td class="mono">{{ e.entry_no }}</td>
                      <td><strong>{{ e.vehicle_no }}</strong></td>
                      <td>{{ e.driver_name }}</td>
                      <td>{{ e.host_name || '—' }} <small class="muted">{{ e.host_department || '' }}</small></td>
                      <td>{{ formatTime(e.in_time) }}</td>
                      <td><button class="btn-confirm" (click)="confirmVisit(e)"><span class="material-icons-round">check</span> Confirm</button></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Recent Entries -->
        <div class="card">
          <div class="card-header"><h3><span class="material-icons-round">history</span> Recent Vehicle Entries</h3>
            <a routerLink="../entries" class="view-all">View All <span class="material-icons-round">arrow_forward</span></a>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Entry #</th><th>Vehicle</th><th>Driver</th><th>Company</th><th>Purpose</th><th>In Time</th><th>Status</th></tr></thead>
              <tbody>
                @for (e of stats?.recentEntries || []; track e.id) {
                  <tr>
                    <td class="mono">{{ e.entry_no }}</td>
                    <td><strong>{{ e.vehicle_no }}</strong></td>
                    <td>{{ e.driver_name }}</td>
                    <td>{{ e.company || '—' }}</td>
                    <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                    <td>{{ formatTime(e.in_time) }}</td>
                    <td><span class="status-badge" [class]="e.status">{{ e.status }}</span></td>
                  </tr>
                }
                @if (!stats?.recentEntries?.length) {
                  <tr><td colspan="7" class="empty">No entries yet</td></tr>
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
  pendingConfirmations: VehicleEntry[] = [];

  constructor(private svc: VehicleService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getStats().subscribe({
      next: (s) => { this.stats = s; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
    this.svc.getCurrentlyInside().subscribe({
      next: (v) => { this.insideVehicles = v; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.svc.getPendingConfirmations().subscribe({
      next: (v) => { this.pendingConfirmations = v; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  confirmVisit(e: VehicleEntry) {
    this.svc.confirmVisit(e.id).subscribe({
      next: () => {
        this.pendingConfirmations = this.pendingConfirmations.filter(p => p.id !== e.id);
        this.cdr.markForCheck();
      },
      error: () => { alert('Failed'); this.cdr.markForCheck(); }
    });
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
