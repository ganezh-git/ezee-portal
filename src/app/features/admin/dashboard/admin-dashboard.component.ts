import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { DashboardStats } from '../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: (data) => { this.stats = data; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  getBarWidth(count: number): number {
    if (!this.stats) return 0;
    const max = Math.max(...this.stats.systemCounts.map(s => s.user_count), 1);
    return (count / max) * 100;
  }
}
