import { Routes } from '@angular/router';
import { BirlaLayoutComponent } from './layout/birla-layout.component';

export const permitBirlaRoutes: Routes = [
  {
    path: '',
    component: BirlaLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/birla-dashboard.component').then(m => m.BirlaDashboardComponent) },
      { path: 'create', loadComponent: () => import('./pages/create/birla-create.component').then(m => m.BirlaCreateComponent) },
      { path: 'permits', loadComponent: () => import('./pages/list/birla-list.component').then(m => m.BirlaListComponent) },
      { path: 'permits/:id', loadComponent: () => import('./pages/detail/birla-detail.component').then(m => m.BirlaDetailComponent) },
      { path: 'approvals', loadComponent: () => import('./pages/approvals/birla-approvals.component').then(m => m.BirlaApprovalsComponent) },
      { path: 'analytics', loadComponent: () => import('./pages/analytics/birla-analytics.component').then(m => m.BirlaAnalyticsComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/birla-reports.component').then(m => m.BirlaReportsComponent) },
      { path: 'print', loadComponent: () => import('./pages/print/permit-birla-print.component').then(m => m.PermitBirlaPrintComponent) },
      { path: 'print/:id', loadComponent: () => import('./pages/print/permit-birla-print.component').then(m => m.PermitBirlaPrintComponent) },
    ],
  },
];
