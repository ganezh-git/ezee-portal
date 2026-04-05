import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { User, PORTAL_SYSTEMS, SystemAccess } from '../../core/models/user.model';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [RouterLink, MatMenuModule, MatDividerModule, MatIconModule, TitleCasePipe],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.scss',
})
export class PortalComponent implements OnInit {
  user: User | null = null;
  accessibleSystems: SystemAccess[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    this.accessibleSystems = PORTAL_SYSTEMS.filter(s => this.auth.hasSystemAccess(s.slug));
  }

  isAdmin(): boolean {
    return this.auth.hasRole('super_admin', 'admin');
  }

  logout(): void {
    this.auth.logout();
  }

  navigateToSystem(system: SystemAccess): void {
    this.router.navigate([system.route]);
  }
}
