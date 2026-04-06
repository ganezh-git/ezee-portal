import { Routes } from '@angular/router';
import { ReceptionLayoutComponent } from './layout/reception-layout.component';

export const receptionRoutes: Routes = [
  {
    path: '',
    component: ReceptionLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/reception-dashboard.component').then(m => m.ReceptionDashboardComponent) },
      { path: 'visitors', loadComponent: () => import('./pages/visitors/reception-visitors.component').then(m => m.ReceptionVisitorsComponent) },
      { path: 'parcels', loadComponent: () => import('./pages/parcels/reception-parcels.component').then(m => m.ReceptionParcelsComponent) },
      { path: 'couriers', loadComponent: () => import('./pages/couriers/reception-couriers.component').then(m => m.ReceptionCouriersComponent) },
      { path: 'bookings', loadComponent: () => import('./pages/bookings/reception-bookings.component').then(m => m.ReceptionBookingsComponent) },
      { path: 'keys', loadComponent: () => import('./pages/keys/reception-keys.component').then(m => m.ReceptionKeysComponent) },
      { path: 'directory', loadComponent: () => import('./pages/directory/reception-directory.component').then(m => m.ReceptionDirectoryComponent) },
      { path: 'taxi', loadComponent: () => import('./pages/taxi/reception-taxi.component').then(m => m.ReceptionTaxiComponent) },
      { path: 'complaints', loadComponent: () => import('./pages/complaints/reception-complaints.component').then(m => m.ReceptionComplaintsComponent) },
      { path: 'amenities', loadComponent: () => import('./pages/amenities/reception-amenities.component').then(m => m.ReceptionAmenitiesComponent) },
    ],
  },
];
