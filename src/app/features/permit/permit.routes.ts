import { Routes } from '@angular/router';
import { PermitLayoutComponent } from './layout/permit-layout.component';

export const permitRoutes: Routes = [
  {
    path: '',
    component: PermitLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/permit-dashboard.component').then(m => m.PermitDashboardComponent) },
      { path: 'create', loadComponent: () => import('./pages/create-permit/create-permit.component').then(m => m.CreatePermitComponent) },
      { path: 'my-permits', loadComponent: () => import('./pages/permit-list/permit-list.component').then(m => m.PermitListComponent), data: { scope: 'my' } },
      { path: 'permits', loadComponent: () => import('./pages/permit-list/permit-list.component').then(m => m.PermitListComponent), data: { scope: 'all' } },
      { path: 'permits/:type/:id', loadComponent: () => import('./pages/permit-detail/permit-detail.component').then(m => m.PermitDetailComponent) },
      { path: 'approvals', loadComponent: () => import('./pages/approvals/approvals.component').then(m => m.ApprovalsComponent) },
      { path: 'security', loadComponent: () => import('./pages/security-gate/security-gate.component').then(m => m.SecurityGateComponent) },
      { path: 'safety', loadComponent: () => import('./pages/safety-admin/safety-admin.component').then(m => m.SafetyAdminComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
    ],
  },
];
