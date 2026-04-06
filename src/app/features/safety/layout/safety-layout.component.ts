import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-safety-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-layout" [class.collapsed]="collapsed">
      <aside class="sidebar">
        <div class="sidebar-header">
          @if (!collapsed) {
            <div class="brand-text"><span class="material-icons-round brand-icon">health_and_safety</span><span>Safety</span></div>
          } @else {
            <span class="material-icons-round brand-icon">health_and_safety</span>
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
  styleUrl: './safety-layout.component.scss',
})
export class SafetyLayoutComponent {
  collapsed = false;
  navItems = [
    { label: 'Dashboard',      icon: 'dashboard',          route: 'dashboard' },
    { label: 'Incidents',       icon: 'report_problem',     route: 'incidents' },
    { label: 'Work Permits',    icon: 'assignment_turned_in', route: 'permits' },
    { label: 'Inspections',     icon: 'fact_check',         route: 'inspections' },
    { label: 'Observations',    icon: 'visibility',         route: 'observations' },
    { label: 'Training',        icon: 'school',             route: 'training' },
    { label: 'PPE Tracker',     icon: 'masks',              route: 'ppe' },
    { label: 'Assets',          icon: 'inventory_2',        route: 'assets' },
    { label: 'Asset Inspections', icon: 'playlist_add_check', route: 'asset-inspections' },
    { label: 'Audits',          icon: 'verified',           route: 'audits' },
    { label: 'Reports',         icon: 'assessment',         route: 'reports' },
    { label: 'Settings',        icon: 'settings',           route: 'settings' },
  ];

  constructor(private auth: AuthService) {}
  get currentUser(): string { const u = this.auth.getUser(); return u?.fullName || u?.username || 'User'; }
  logout(): void { this.auth.logout(); }
}
