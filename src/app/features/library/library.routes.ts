import { Routes } from '@angular/router';
import { LibraryLayoutComponent } from './layout/library-layout.component';

export const libraryRoutes: Routes = [
  {
    path: '',
    component: LibraryLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/library-dashboard.component').then(m => m.LibraryDashboardComponent) },
      { path: 'books', loadComponent: () => import('./pages/books/library-books.component').then(m => m.LibraryBooksComponent) },
      { path: 'members', loadComponent: () => import('./pages/members/library-members.component').then(m => m.LibraryMembersComponent) },
      { path: 'circulation', loadComponent: () => import('./pages/circulation/library-circulation.component').then(m => m.LibraryCirculationComponent) },
      { path: 'digital', loadComponent: () => import('./pages/digital/library-digital.component').then(m => m.LibraryDigitalComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/library-reports.component').then(m => m.LibraryReportsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/library-settings.component').then(m => m.LibrarySettingsComponent) },
    ],
  },
];
