import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../services/permit.service';
import { Permit, PermitType, ReportResponse, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  loading = false;
  permitTypes: PermitType[] = [];
  results: ReportResponse | null = null;

  filters = {
    type: '',
    status: '',
    mode: '',
    department: '',
    from: '',
    to: '',
  };

  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;
  statusKeys = Object.keys(PERMIT_STATUS_CONFIG);

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.permitService.getTypes().subscribe(t => { this.permitTypes = t; this.cdr.markForCheck(); });
  }

  search(): void {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.filters.type) params['type'] = this.filters.type;
    if (this.filters.status) params['status'] = this.filters.status;
    if (this.filters.mode) params['mode'] = this.filters.mode;
    if (this.filters.department) params['department'] = this.filters.department;
    if (this.filters.from) params['from'] = this.filters.from;
    if (this.filters.to) params['to'] = this.filters.to;

    this.permitService.getReport(params).subscribe({
      next: (r) => { this.results = r; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  reset(): void {
    this.filters = { type: '', status: '', mode: '', department: '', from: '', to: '' };
    this.results = null;
  }

  get summaryEntries(): { label: string; value: number; color: string }[] {
    if (!this.results?.summary?.byType) return [];
    return Object.entries(this.results.summary.byType).map(([k, v]) => {
      const t = this.permitTypes.find(pt => pt.value === k);
      return { label: t?.label || k, value: v, color: t?.color || '#64748b' };
    });
  }

  get statusEntries(): { label: string; value: number; color: string }[] {
    if (!this.results?.summary?.byStatus) return [];
    return Object.entries(this.results.summary.byStatus).map(([k, v]) => {
      const s = this.statusConfig[k];
      return { label: s?.label || k, value: v, color: s?.color || '#64748b' };
    });
  }

  get maxTypeCount(): number {
    return Math.max(1, ...this.summaryEntries.map(e => e.value));
  }

  exportCsv(): void {
    if (!this.results?.permits?.length) return;
    const headers = ['ID', 'Type', 'Location', 'Description', 'Mode', 'Status', 'Owner', 'Department', 'Start Date', 'Close Date'];
    const rows = this.results.permits.map(p => [
      p.id, p.typeLabel, p.location, `"${(p.description || '').replace(/"/g, '""')}"`,
      p.mode, p.status, p.permitOwner, p.department, p.expectedStart, p.closeDate || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getStatusStyle(status: string) { return this.statusConfig[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' }; }
}
