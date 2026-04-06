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

  // User profile & password change
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'My Profile - EZEE Portal',
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
    title: 'Permit Portal - EZEE Portal',
  },
  {
    path: 'permit-birla',
    loadChildren: () => import('./features/permit-birla/permit-birla.routes').then(m => m.permitBirlaRoutes),
    canActivate: [authGuard],
    title: 'Birla Opus PTW - EZEE Portal',
  },
  {
    path: 'vehicle',
    loadChildren: () => import('./features/vehicle/vehicle.routes').then(m => m.vehicleRoutes),
    canActivate: [authGuard],
    title: 'Vehicle Entry - EZEE Portal',
  },
  {
    path: 'visitor',
    loadChildren: () => import('./features/visitor/visitor.routes').then(m => m.visitorRoutes),
    canActivate: [authGuard],
    title: 'Visitor Pass - EZEE Portal',
  },
  {
    path: 'library',
    loadChildren: () => import('./features/library/library.routes').then(m => m.libraryRoutes),
    canActivate: [authGuard],
    title: 'Library - EZEE Portal',
  },
  {
    path: 'safety',
    loadChildren: () => import('./features/safety/safety.routes').then(m => m.safetyRoutes),
    canActivate: [authGuard],
    title: 'Safety Management - EZEE Portal',
  },
  // { path: 'inventory', loadChildren: ... , canActivate: [systemGuard('inventory')] },
  // { path: 'reception', loadChildren: ... , canActivate: [systemGuard('reception')] },
  // { path: 'stationery', loadChildren: ... , canActivate: [systemGuard('stationery')] },

  // Catch-all redirect
  { path: '**', redirectTo: '' },
];
