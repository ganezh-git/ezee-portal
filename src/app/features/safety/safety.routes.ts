import { Routes } from '@angular/router';
import { SafetyLayoutComponent } from './layout/safety-layout.component';

export const safetyRoutes: Routes = [
  {
    path: '',
    component: SafetyLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/safety-dashboard.component').then(m => m.SafetyDashboardComponent) },
      { path: 'incidents', loadComponent: () => import('./pages/incidents/safety-incidents.component').then(m => m.SafetyIncidentsComponent) },
      { path: 'permits', loadComponent: () => import('./pages/permits/safety-permits.component').then(m => m.SafetyPermitsComponent) },
      { path: 'inspections', loadComponent: () => import('./pages/inspections/safety-inspections.component').then(m => m.SafetyInspectionsComponent) },
      { path: 'observations', loadComponent: () => import('./pages/observations/safety-observations.component').then(m => m.SafetyObservationsComponent) },
      { path: 'training', loadComponent: () => import('./pages/training/safety-training.component').then(m => m.SafetyTrainingComponent) },
      { path: 'ppe', loadComponent: () => import('./pages/ppe/safety-ppe.component').then(m => m.SafetyPpeComponent) },
      { path: 'assets', loadComponent: () => import('./pages/assets/safety-assets.component').then(m => m.SafetyAssetsComponent) },
      { path: 'asset-inspections', loadComponent: () => import('./pages/asset-inspections/asset-inspections.component').then(m => m.AssetInspectionsComponent) },
      { path: 'audits', loadComponent: () => import('./pages/audits/safety-audits.component').then(m => m.SafetyAuditsComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/safety-reports.component').then(m => m.SafetyReportsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/safety-settings.component').then(m => m.SafetySettingsComponent) },
    ],
  },
];
