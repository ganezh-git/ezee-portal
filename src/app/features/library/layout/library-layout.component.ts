import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-library-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-layout" [class.collapsed]="collapsed">
      <aside class="sidebar">
        <div class="sidebar-header">
          @if (!collapsed) {
            <div class="brand-text"><span class="material-icons-round brand-icon">local_library</span><span>Library</span></div>
          } @else {
            <span class="material-icons-round brand-icon">local_library</span>
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
  styleUrl: './library-layout.component.scss',
})
export class LibraryLayoutComponent {
  collapsed = false;
  navItems = [
    { label: 'Dashboard',     icon: 'dashboard',        route: 'dashboard' },
    { label: 'Books Catalog',  icon: 'menu_book',       route: 'books' },
    { label: 'Members',        icon: 'people',          route: 'members' },
    { label: 'Circulation',    icon: 'swap_horiz',      route: 'circulation' },
    { label: 'Digital Library', icon: 'cloud_download', route: 'digital' },
    { label: 'Reports',        icon: 'assessment',      route: 'reports' },
    { label: 'Settings',       icon: 'settings',        route: 'settings' },
  ];

  constructor(private auth: AuthService) {}
  get currentUser(): string { const u = this.auth.getUser(); return u?.fullName || u?.username || 'User'; }
  logout(): void { this.auth.logout(); }
}
