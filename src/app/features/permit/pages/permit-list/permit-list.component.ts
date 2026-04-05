import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { PermitService } from '../../services/permit.service';
import { Permit, PermitType, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';
import { DEPARTMENTS } from '../../../../core/constants/reference-data';

@Component({
  selector: 'app-permit-list',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './permit-list.component.html',
  styleUrl: './permit-list.component.scss',
})
export class PermitListComponent implements OnInit {
  permits: Permit[] = [];
  types: PermitType[] = [];
  departments = DEPARTMENTS;
  total = 0;
  page = 1;
  limit = 20;
  loading = true;
  scope: 'my' | 'all' = 'all';

  // Filters
  filterType = 'all';
  filterStatus = 'all';
  filterMode = 'all';
  filterDept = 'all';
  searchQuery = '';

  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;

  statuses = [
    'Waiting for Dept. Mgr Approval', 'Waiting for Sr. Mgr Approval', 'Waiting for GWM Approval',
    'Permit Pending for Confirm', 'Printable and permit to be surrender', 'Permit Returned',
    'Locked', 'Permit Returned with NC', 'Lock Released', 'Cancelled',
  ];

  constructor(private permitService: PermitService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.scope = this.route.snapshot.data['scope'] || 'all';
    this.permitService.getTypes().subscribe(t => this.types = t);
    this.loadPermits();
  }

  loadPermits(): void {
    this.loading = true;
    if (this.scope === 'my') {
      this.permitService.getMyPermits().subscribe({
        next: (permits) => { this.permits = permits; this.total = permits.length; this.loading = false; this.cdr.markForCheck(); },
        error: () => { this.loading = false; this.cdr.markForCheck(); },
      });
    } else {
      this.permitService.getPermits({
        type: this.filterType !== 'all' ? this.filterType : undefined,
        status: this.filterStatus !== 'all' ? this.filterStatus : undefined,
        mode: this.filterMode !== 'all' ? this.filterMode : undefined,
        department: this.filterDept !== 'all' ? this.filterDept : undefined,
        search: this.searchQuery || undefined,
        page: this.page, limit: this.limit,
      }).subscribe({
        next: (data) => {
          this.permits = data.permits; this.total = data.total; this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); },
      });
    }
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadPermits();
  }

  onFilterChange(): void { this.page = 1; this.loadPermits(); }

  prevPage(): void { if (this.page > 1) { this.page--; this.loadPermits(); } }
  nextPage(): void { if (this.page * this.limit < this.total) { this.page++; this.loadPermits(); } }
  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  getStatusStyle(status: string) { return this.statusConfig[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' }; }
  getModeStyle(code: string) { return this.modeConfig[code] || { label: code, color: '#64748b', icon: 'help' }; }
}
