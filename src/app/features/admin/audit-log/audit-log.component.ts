import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { AuditLogEntry } from '../models/admin.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  logs: AuditLogEntry[] = [];
  total = 0;
  page = 1;
  limit = 30;
  actionFilter = '';
  loading = true;

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.adminService.getAuditLog({
      page: this.page,
      limit: this.limit,
      action: this.actionFilter || undefined,
    }).subscribe({
      next: (data) => {
        this.logs = data.logs;
        this.total = data.total;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  onFilterAction(action: string): void {
    this.actionFilter = action;
    this.page = 1;
    this.loadLogs();
  }

  prevPage(): void { if (this.page > 1) { this.page--; this.loadLogs(); } }
  nextPage(): void { if (this.page * this.limit < this.total) { this.page++; this.loadLogs(); } }
  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  getActionIcon(action: string): string {
    if (action.includes('create') || action.includes('register')) return 'person_add';
    if (action.includes('update')) return 'edit';
    if (action.includes('delete')) return 'delete';
    if (action.includes('password')) return 'lock_reset';
    if (action.includes('login')) return 'login';
    if (action.includes('system')) return 'apps';
    return 'event';
  }

  getActionColor(action: string): string {
    if (action.includes('create') || action.includes('register')) return '#10b981';
    if (action.includes('update') || action.includes('system')) return '#3b82f6';
    if (action.includes('delete')) return '#ef4444';
    if (action.includes('password')) return '#f59e0b';
    return '#64748b';
  }
}
