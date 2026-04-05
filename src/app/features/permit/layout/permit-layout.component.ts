import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: number[]; // designation levels that can access (1=GWM ... 9=Security)
}

@Component({
  selector: 'app-permit-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './permit-layout.component.html',
  styleUrl: './permit-layout.component.scss',
})
export class PermitLayoutComponent {
  sidebarCollapsed = false;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { label: 'New Permit', icon: 'add_circle', route: 'create' },
    { label: 'My Permits', icon: 'assignment_ind', route: 'my-permits' },
    { label: 'All Permits', icon: 'list_alt', route: 'permits' },
    { label: 'Approvals', icon: 'fact_check', route: 'approvals' },
    { label: 'Security Gate', icon: 'security', route: 'security' },
    { label: 'Safety Admin', icon: 'admin_panel_settings', route: 'safety' },
    { label: 'Reports', icon: 'assessment', route: 'reports' },
    { label: 'Analytics', icon: 'analytics', route: 'analytics' },
  ];

  constructor(public auth: AuthService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
