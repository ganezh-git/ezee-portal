import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard - EZEE Portal',
      },
      {
        path: 'users',
        loadComponent: () => import('./users/user-management.component').then(m => m.UserManagementComponent),
        title: 'User Management - EZEE Portal',
      },
      {
        path: 'audit-log',
        loadComponent: () => import('./audit-log/audit-log.component').then(m => m.AuditLogComponent),
        title: 'Audit Log - EZEE Portal',
      },
    ],
  },
];
