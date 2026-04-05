import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { PermitService } from '../../services/permit.service';
import { PermitDashboard, Permit, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-permit-dashboard',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './permit-dashboard.component.html',
  styleUrl: './permit-dashboard.component.scss',
})
export class PermitDashboardComponent implements OnInit {
  dashboard: PermitDashboard | null = null;
  loading = true;
  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.permitService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  getStatusConfig(status: string) {
    return this.statusConfig[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' };
  }

  getModeConfig(code: string) {
    return this.modeConfig[code] || { label: code, color: '#64748b', icon: 'help' };
  }

  get typeEntries(): [string, number][] {
    if (!this.dashboard) return [];
    return Object.entries(this.dashboard.typeCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  }

  get statusEntries(): [string, number][] {
    if (!this.dashboard) return [];
    return Object.entries(this.dashboard.statusCounts).sort((a, b) => b[1] - a[1]);
  }

  get totalPermits(): number {
    return this.typeEntries.reduce((sum, [, v]) => sum + v, 0);
  }

  getTypePercent(count: number): number {
    return this.totalPermits ? Math.round((count / this.totalPermits) * 100) : 0;
  }
}
