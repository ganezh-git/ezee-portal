import { Component, OnInit } from '@angular/core';
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
        </div>
        <!-- Purpose Breakdown -->
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

  constructor(private svc: VehicleService) {}

  ngOnInit() {
    this.svc.getStats().subscribe({
      next: (s) => { this.stats = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  getBarWidth(count: number): number {
    const max = Math.max(...(this.stats?.purposeBreakdown?.map(p => p.count) || [1]));
    return (count / max) * 100;
  }

  formatTime(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
