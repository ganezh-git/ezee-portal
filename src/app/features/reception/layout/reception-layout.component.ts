import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reception-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-layout" [class.collapsed]="collapsed">
      <aside class="sidebar">
        <div class="sidebar-header">
          @if (!collapsed) {
            <div class="brand-text"><span class="material-icons-round brand-icon">concierge</span><span>Reception</span></div>
          } @else {
            <span class="material-icons-round brand-icon">concierge</span>
          }
          <button class="toggle-btn" (click)="collapsed = !collapsed">
            <span class="material-icons-round">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>
        <div class="color-strip"><span></span><span></span><span></span><span></span><span></span></div>
        <nav class="nav">
          @for (item of navItems; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-item" [title]="item.label">
              <span class="material-icons-round">{{ item.icon }}</span>
              @if (!collapsed) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>
        <div class="sidebar-footer">
          @if (!collapsed) {
            <div class="user-info"><span class="material-icons-round">account_circle</span><span class="user-name">{{ currentUser }}</span></div>
          }
          <a routerLink="/portal" class="nav-item" title="Back to Portal">
            <span class="material-icons-round">arrow_back</span>
            @if (!collapsed) { <span>Back to Portal</span> }
          </a>
          <button class="nav-item logout-btn" title="Logout" (click)="logout()">
            <span class="material-icons-round">logout</span>
            @if (!collapsed) { <span>Logout</span> }
          </button>
        </div>
      </aside>
      <main class="content"><router-outlet /></main>
    </div>
  `,
  styleUrl: './reception-layout.component.scss',
})
export class ReceptionLayoutComponent {
  collapsed = false;
  navItems = [
    { label: 'Dashboard',       icon: 'dashboard',          route: 'dashboard' },
    { label: 'Visitors',        icon: 'badge',              route: 'visitors' },
    { label: 'Parcels',         icon: 'inventory_2',        route: 'parcels' },
    { label: 'Couriers',        icon: 'local_shipping',     route: 'couriers' },
    { label: 'Room Bookings',   icon: 'meeting_room',       route: 'bookings' },
    { label: 'Key Register',    icon: 'vpn_key',            route: 'keys' },
    { label: 'Phone Directory', icon: 'contact_phone',      route: 'directory' },
    { label: 'Taxi Bookings',   icon: 'local_taxi',         route: 'taxi' },
    { label: 'Complaints',      icon: 'feedback',           route: 'complaints' },
    { label: 'Amenity Requests',icon: 'room_service',       route: 'amenities' },
  ];

  constructor(private auth: AuthService) {}
  get currentUser(): string { const u = this.auth.getUser(); return u?.fullName || u?.username || 'User'; }
  logout(): void { this.auth.logout(); }
}
