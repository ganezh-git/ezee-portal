import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReceptionService, ReceptionStats } from '../../services/reception.service';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Reception Dashboard</h1>
          <p class="subtitle">Real-time front desk operations overview</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="../visitors"><span class="material-icons-round">person_add</span>Check In Visitor</button>
        </div>
      </div>

      <!-- Hero KPI Strip -->
      <div class="hero-strip">
        <div class="hero-card visitors-card">
          <div class="hero-number">{{ stats?.visitorsToday ?? 0 }}</div>
          <div class="hero-label">Visitors Today</div>
          <div class="hero-sub">{{ stats?.checkedIn ?? 0 }} currently in</div>
          <span class="material-icons-round hero-icon">groups</span>
        </div>
        <div class="hero-card" [class.alert]="(stats?.parcelsUncollected ?? 0) > 3">
          <div class="hero-number">{{ stats?.parcelsToday ?? 0 }}</div>
          <div class="hero-label">Parcels Today</div>
          <div class="hero-sub">{{ stats?.parcelsUncollected ?? 0 }} uncollected</div>
          <span class="material-icons-round hero-icon">inventory_2</span>
        </div>
        <div class="hero-card">
          <div class="hero-number">{{ stats?.bookingsToday ?? 0 }}</div>
          <div class="hero-label">Room Bookings</div>
          <span class="material-icons-round hero-icon">meeting_room</span>
        </div>
        <div class="hero-card" [class.alert]="(stats?.complaintsOpen ?? 0) > 0">
          <div class="hero-number">{{ stats?.complaintsOpen ?? 0 }}</div>
          <div class="hero-label">Open Complaints</div>
          <span class="material-icons-round hero-icon">feedback</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card teal">
          <span class="material-icons-round">local_shipping</span>
          <div><div class="stat-val">{{ stats?.couriersToday ?? 0 }}</div><div class="stat-lbl">Couriers Today</div></div>
          <span class="mini-badge" *ngIf="(stats?.couriersUncollected ?? 0) > 0">{{ stats?.couriersUncollected }} pending</span>
        </div>
        <div class="stat-card amber">
          <span class="material-icons-round">vpn_key</span>
          <div><div class="stat-val">{{ stats?.keysIssued ?? 0 }}</div><div class="stat-lbl">Keys Issued</div></div>
        </div>
        <div class="stat-card blue">
          <span class="material-icons-round">local_taxi</span>
          <div><div class="stat-val">{{ stats?.taxiToday ?? 0 }}</div><div class="stat-lbl">Taxi Bookings</div></div>
        </div>
        <div class="stat-card purple">
          <span class="material-icons-round">room_service</span>
          <div><div class="stat-val">{{ stats?.amenitiesPending ?? 0 }}</div><div class="stat-lbl">Amenities Pending</div></div>
        </div>
        <div class="stat-card green">
          <span class="material-icons-round">badge</span>
          <div><div class="stat-val">{{ stats?.badgesAvailable ?? 0 }}</div><div class="stat-lbl">Badges Available</div></div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Recent Visitors -->
        <div class="card">
          <h3><span class="material-icons-round">person</span>Recent Visitors</h3>
          <div class="visitor-list">
            @for (v of stats?.recentVisitors ?? []; track v.id) {
              <div class="visitor-item">
                <div class="vi-avatar"><span class="material-icons-round">{{ v.visitor_type === 'VIP' ? 'star' : 'person' }}</span></div>
                <div class="vi-info">
                  <div class="vi-name">{{ v.visitor_name }}</div>
                  <div class="vi-meta">{{ v.company || 'Walk-in' }} · Host: {{ v.host_name }}</div>
                </div>
                <span class="badge" [attr.data-status]="v.status">{{ v.status === 'checked_in' ? 'In' : v.status === 'checked_out' ? 'Out' : v.status }}</span>
              </div>
            }
            @if (!(stats?.recentVisitors?.length)) { <p class="empty">No visitors today</p> }
          </div>
          <a routerLink="../visitors" class="card-link">View all visitors →</a>
        </div>

        <!-- Today's Bookings -->
        <div class="card">
          <h3><span class="material-icons-round">event</span>Today's Room Bookings</h3>
          <div class="booking-list">
            @for (b of stats?.todayBookings ?? []; track b.id) {
              <div class="booking-item">
                <div class="bi-time">{{ b.start_time?.slice(0,5) }} - {{ b.end_time?.slice(0,5) }}</div>
                <div class="bi-info">
                  <div class="bi-room">{{ b.room_name || 'Room ' + b.room_id }}</div>
                  <div class="bi-meta">{{ b.booked_by }} · {{ b.purpose }}</div>
                </div>
                <span class="badge" [attr.data-status]="b.status">{{ b.status }}</span>
              </div>
            }
            @if (!(stats?.todayBookings?.length)) { <p class="empty">No bookings today</p> }
          </div>
          <a routerLink="../bookings" class="card-link">View all bookings →</a>
        </div>
      </div>

      <div class="grid-2">
        <!-- Pending Parcels -->
        <div class="card">
          <h3><span class="material-icons-round">inventory_2</span>Pending Parcels</h3>
          <div class="parcel-list">
            @for (p of stats?.pendingParcels ?? []; track p.id) {
              <div class="parcel-item">
                <span class="material-icons-round pi-icon">{{ p.parcel_type === 'document' ? 'description' : 'package_2' }}</span>
                <div class="pi-info">
                  <div class="pi-track">{{ p.tracking_no }}</div>
                  <div class="pi-meta">For: {{ p.recipient_name }} ({{ p.recipient_dept }}) · From: {{ p.sender_name }}</div>
                </div>
                <span class="badge" [attr.data-status]="p.status">{{ formatStatus(p.status) }}</span>
              </div>
            }
            @if (!(stats?.pendingParcels?.length)) { <p class="empty">All parcels collected</p> }
          </div>
          <a routerLink="../parcels" class="card-link">View all parcels →</a>
        </div>

        <!-- Open Complaints -->
        <div class="card">
          <h3><span class="material-icons-round">feedback</span>Open Complaints</h3>
          <div class="complaint-list">
            @for (c of stats?.openComplaints ?? []; track c.id) {
              <div class="complaint-item">
                <span class="priority-dot" [attr.data-priority]="c.priority"></span>
                <div class="ci-info">
                  <div class="ci-no">{{ c.complaint_no }} · {{ c.category | titlecase }}</div>
                  <div class="ci-desc">{{ c.description | slice:0:80 }}{{ c.description.length > 80 ? '...' : '' }}</div>
                </div>
                <span class="badge" [attr.data-priority]="c.priority">{{ c.priority }}</span>
              </div>
            }
            @if (!(stats?.openComplaints?.length)) { <p class="empty">No open complaints</p> }
          </div>
          <a routerLink="../complaints" class="card-link">View all complaints →</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './reception-dashboard.component.scss',
})
export class ReceptionDashboardComponent implements OnInit {
  stats: ReceptionStats | null = null;
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.svc.getStats().subscribe(s => { this.stats = s; this.cdr.markForCheck(); }); }
  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
