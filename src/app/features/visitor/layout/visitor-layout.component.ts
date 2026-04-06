import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-visitor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span class="material-icons-round brand-icon">badge</span>
          <div><h2>Visitor Pass</h2><small>Management System</small></div>
        </div>
        <nav>
          <a routerLink="dashboard" routerLinkActive="active"><span class="material-icons-round">dashboard</span> Live Dashboard</a>
          <a routerLink="analytics" routerLinkActive="active"><span class="material-icons-round">bar_chart</span> Analytics</a>
          <a routerLink="book" routerLinkActive="active"><span class="material-icons-round">edit_calendar</span> Book Visit</a>
          <a routerLink="entry" routerLinkActive="active"><span class="material-icons-round">login</span> Visitor Entry</a>
          <a routerLink="approvals" routerLinkActive="active"><span class="material-icons-round">fact_check</span> Approvals</a>
          <a routerLink="exit" routerLinkActive="active"><span class="material-icons-round">logout</span> Visitor Exit</a>
          <a routerLink="all-visits" routerLinkActive="active"><span class="material-icons-round">list_alt</span> All Visits</a>
          <a routerLink="watchlist" routerLinkActive="active"><span class="material-icons-round">visibility</span> Watchlist</a>
          <a routerLink="settings" routerLinkActive="active"><span class="material-icons-round">settings</span> Settings</a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/portal"><span class="material-icons-round">arrow_back</span> Back to Portal</a>
        </div>
      </aside>
      <main class="content"><router-outlet /></main>
    </div>
  `,
  styleUrl: './visitor-layout.component.scss',
})
export class VisitorLayoutComponent {}
