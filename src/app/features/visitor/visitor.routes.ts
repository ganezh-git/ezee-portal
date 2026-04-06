import { Routes } from '@angular/router';
import { VisitorLayoutComponent } from './layout/visitor-layout.component';

export const visitorRoutes: Routes = [
  {
    path: '',
    component: VisitorLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/visitor-dashboard.component').then(m => m.VisitorDashboardComponent) },
      { path: 'analytics', loadComponent: () => import('./pages/analytics/visitor-analytics.component').then(m => m.VisitorAnalyticsComponent) },
      { path: 'book', loadComponent: () => import('./pages/book/book-visit.component').then(m => m.BookVisitComponent) },
      { path: 'entry', loadComponent: () => import('./pages/entry/visitor-entry.component').then(m => m.VisitorEntryComponent) },
      { path: 'approvals', loadComponent: () => import('./pages/approvals/visitor-approvals.component').then(m => m.VisitorApprovalsComponent) },
      { path: 'exit', loadComponent: () => import('./pages/exit/visitor-exit.component').then(m => m.VisitorExitComponent) },
      { path: 'all-visits', loadComponent: () => import('./pages/all-visits/all-visits.component').then(m => m.AllVisitsComponent) },
      { path: 'watchlist', loadComponent: () => import('./pages/watchlist/visitor-watchlist.component').then(m => m.VisitorWatchlistComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/visitor-settings.component').then(m => m.VisitorSettingsComponent) },
    ],
  },
];
