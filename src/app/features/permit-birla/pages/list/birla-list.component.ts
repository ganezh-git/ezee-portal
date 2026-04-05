import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PermitBirlaService, MyBirlaRole } from '../../services/permit-birla.service';
import { BirlaPermit, PERMIT_STATUS_CONFIG, PERMIT_TYPE_ICONS } from '../../models/permit-birla.models';

@Component({
  selector: 'app-birla-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './birla-list.component.html',
  styleUrl: './birla-list.component.scss',
})
export class BirlaListComponent implements OnInit {
  permits: BirlaPermit[] = [];
  loading = true;
  total = 0;
  page = 1;
  limit = 20;
  statusFilter = '';
  typeFilter = '';
  statusConfig = PERMIT_STATUS_CONFIG;
  typeIcons = PERMIT_TYPE_ICONS;
  myRoles: string[] = [];

  constructor(private svc: PermitBirlaService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.svc.getMyRole().subscribe(r => { this.myRoles = r.roles || []; this.cdr.markForCheck(); });
    this.route.queryParams.subscribe(p => {
      if (p['type']) this.typeFilter = p['type'];
      if (p['status']) this.statusFilter = p['status'];
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.svc.getPermits({ status: this.statusFilter, type: this.typeFilter, page: this.page, limit: this.limit }).subscribe({
      next: (res) => { this.permits = res.permits; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  onFilter(): void { this.page = 1; this.load(); }
  nextPage(): void { if (this.page * this.limit < this.total) { this.page++; this.load(); } }
  prevPage(): void { if (this.page > 1) { this.page--; this.load(); } }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  canApprove(p: BirlaPermit): boolean {
    const isAdmin = this.myRoles.includes('admin');
    if (p.status === 'Initiated' && (isAdmin || this.myRoles.includes('issuer'))) return true;
    if (p.status === 'Issued' && (isAdmin || this.myRoles.includes('custodian'))) return true;
    if (p.status === 'Custodian_Approved' && (isAdmin || this.myRoles.includes('co_permittee'))) return true;
    return false;
  }

  getApproveLabel(status: string): string {
    if (status === 'Initiated') return 'Approve';
    if (status === 'Issued') return 'Approve';
    if (status === 'Custodian_Approved') return 'Activate';
    return '';
  }
}
