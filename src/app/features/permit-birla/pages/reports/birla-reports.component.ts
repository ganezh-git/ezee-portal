import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermitBirlaService } from '../../services/permit-birla.service';
import { PermitType, Department, PERMIT_STATUS_CONFIG, PERMIT_TYPE_ICONS } from '../../models/permit-birla.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-birla-reports',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './birla-reports.component.html',
  styleUrl: './birla-reports.component.scss',
})
export class BirlaReportsComponent implements OnInit {
  loading = true;
  exporting = false;
  types: PermitType[] = [];
  departments: Department[] = [];
  statusConfig = PERMIT_STATUS_CONFIG;
  typeIcons = PERMIT_TYPE_ICONS;

  // Filters
  fromDate = '';
  toDate = '';
  filterStatus = '';
  filterType = '';
  filterDept = '';

  // Results
  reportData: any[] = [];
  showResults = false;

  statuses = ['Initiated', 'Issued', 'Custodian_Approved', 'Active', 'Extended', 'Suspended', 'Closed', 'Cancelled'];

  constructor(private svc: PermitBirlaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const now = new Date();
    this.toDate = now.toISOString().split('T')[0];
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    this.fromDate = from.toISOString().split('T')[0];

    forkJoin({
      types: this.svc.getTypes(),
      depts: this.svc.getDepartments(),
    }).subscribe({
      next: (d) => {
        this.types = d.types;
        this.departments = d.depts;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  generateReport(): void {
    this.exporting = true;
    this.svc.getReportData({
      from: this.fromDate, to: this.toDate,
      status: this.filterStatus, type: this.filterType, department: this.filterDept,
    }).subscribe({
      next: (data) => {
        this.reportData = data;
        this.showResults = true;
        this.exporting = false;
        this.cdr.markForCheck();
      },
      error: () => { this.exporting = false; this.cdr.markForCheck(); },
    });
  }

  downloadCsv(): void {
    if (!this.reportData.length) return;
    const headers = ['Permit No', 'Type', 'Status', 'Department', 'Location', 'Work Description', 'Issued Date', 'Valid Until', 'Created'];
    const rows = this.reportData.map((r: any) => [
      r.permit_no, r.type_label || r.permit_type_code, r.status,
      r.department_name || '', r.location_name || r.location_text || '',
      `"${(r.work_description || '').replace(/"/g, '""')}"`,
      `${r.issued_date || ''} ${r.issued_time || ''}`,
      `${r.valid_until_date || ''} ${r.valid_until_time || ''}`,
      r.created_at || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permit-report-${this.fromDate}-to-${this.toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  get summaryStats() {
    const total = this.reportData.length;
    const active = this.reportData.filter(r => r.status === 'Active' || r.status === 'Extended').length;
    const closed = this.reportData.filter(r => r.status === 'Closed').length;
    const pending = this.reportData.filter(r => ['Initiated', 'Issued', 'Custodian_Approved'].includes(r.status)).length;
    return { total, active, closed, pending };
  }
}
