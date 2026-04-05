import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <a routerLink="/portal" class="brand-back">
            <span class="material-icons-round">arrow_back</span>
          </a>
          <div class="brand-text">
            <span class="brand-title">Admin</span>
            <span class="brand-sub">EZEE Portal</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item">
            <span class="material-icons-round">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <span class="material-icons-round">people</span>
            <span>Users</span>
          </a>
          <a routerLink="/admin/audit-log" routerLinkActive="active" class="nav-item">
            <span class="material-icons-round">history</span>
            <span>Audit Log</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/portal" class="nav-item">
            <span class="material-icons-round">exit_to_app</span>
            <span>Back to Portal</span>
          </a>
        </div>
      </aside>

      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {}
