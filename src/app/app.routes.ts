import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Home page - main landing (replaces home.php)
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'EZEE Portal - Home',
  },

  // Login page (replaces index.php)
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Sign In - EZEE Portal',
  },

  // Portal dashboard (replaces portal.php) — requires authentication
  {
    path: 'portal',
    loadComponent: () => import('./features/portal/portal.component').then(m => m.PortalComponent),
    canActivate: [authGuard],
    title: 'Dashboard - EZEE Portal',
  },

  // Admin console — requires super_admin or admin role
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [roleGuard('super_admin', 'admin')],
    title: 'Admin Console - EZEE Portal',
  },

  // Feature modules (will be added as we migrate each one)
  {
    path: 'permit',
    loadChildren: () => import('./features/permit/permit.routes').then(m => m.permitRoutes),
    canActivate: [authGuard],
    title: 'Permit System - EZEE Portal',
  },
  {
    path: 'permit-birla',
    loadChildren: () => import('./features/permit-birla/permit-birla.routes').then(m => m.permitBirlaRoutes),
    canActivate: [authGuard],
    title: 'Birla Opus - Permit to Work',
  },
  // { path: 'inventory', loadChildren: ... , canActivate: [systemGuard('inventory')] },
  // { path: 'vehicle', loadChildren: ... , canActivate: [systemGuard('vehicle')] },
  // { path: 'safety', loadChildren: ... , canActivate: [systemGuard('safety')] },
  // { path: 'visitor', loadChildren: ... , canActivate: [systemGuard('visitor')] },
  // { path: 'reception', loadChildren: ... , canActivate: [systemGuard('reception')] },
  // { path: 'stationery', loadChildren: ... , canActivate: [systemGuard('stationery')] },

  // Catch-all redirect
  { path: '**', redirectTo: '' },
];
