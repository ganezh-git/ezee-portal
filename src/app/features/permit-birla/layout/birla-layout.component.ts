import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-birla-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="permit-layout" [class.collapsed]="collapsed">
      <aside class="sidebar">
        <div class="sidebar-header">
          @if (!collapsed) {
            <img src="birla-opus-logo.svg" alt="Birla Opus" class="brand-logo" />
          } @else {
            <span class="material-icons-round brand-icon">palette</span>
          }
          <button class="toggle-btn" (click)="collapsed = !collapsed">
            <span class="material-icons-round">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>
        <div class="color-strip">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
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
            <div class="user-info">
              <span class="material-icons-round">account_circle</span>
              <span class="user-name">{{ currentUser }}</span>
            </div>
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
  styleUrl: './birla-layout.component.scss',
})
export class BirlaLayoutComponent {
  collapsed = false;
  navItems = [
    { label: 'Dashboard',   icon: 'dashboard',        route: 'dashboard' },
    { label: 'New Permit',   icon: 'add_circle',       route: 'create' },
    { label: 'All Permits',  icon: 'list_alt',         route: 'permits' },
    { label: 'Approvals',    icon: 'approval',         route: 'approvals' },
    { label: 'Analytics',    icon: 'analytics',        route: 'analytics' },
    { label: 'Reports',      icon: 'summarize',        route: 'reports' },
    { label: 'Print Permit', icon: 'print',            route: 'print' },
  ];

  constructor(private auth: AuthService) {}

  get currentUser(): string {
    const user = this.auth.getUser();
    return user?.fullName || user?.username || 'User';
  }

  logout(): void {
    this.auth.logout();
  }
}
