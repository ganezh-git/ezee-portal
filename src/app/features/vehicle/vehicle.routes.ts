import { Routes } from '@angular/router';
import { VehicleLayoutComponent } from './layout/vehicle-layout.component';

export const vehicleRoutes: Routes = [
  {
    path: '',
    component: VehicleLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/vehicle-dashboard.component').then(m => m.VehicleDashboardComponent) },
      { path: 'entries', loadComponent: () => import('./pages/entries/vehicle-entries.component').then(m => m.VehicleEntriesComponent) },
      { path: 'fleet', loadComponent: () => import('./pages/fleet/vehicle-fleet.component').then(m => m.VehicleFleetComponent) },
      { path: 'gate-log', loadComponent: () => import('./pages/gate-log/gate-log.component').then(m => m.GateLogComponent) },
      { path: 'trips', loadComponent: () => import('./pages/trips/trip-requests.component').then(m => m.TripRequestsComponent) },
    ],
  },
];
