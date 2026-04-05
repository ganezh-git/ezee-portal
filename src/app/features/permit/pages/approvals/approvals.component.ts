import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermitService } from '../../services/permit.service';
import { Permit, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss',
})
export class ApprovalsComponent implements OnInit {
  pendingPermits: Permit[] = [];
  loading = true;
  processing = new Set<string>();
  message = '';
  messageType: 'success' | 'error' = 'success';
  activeTab: 'department' | 'all' | 'gwm' | 'unplanned' = 'department';

  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadApprovals(); }

  loadApprovals(): void {
    this.loading = true;
    this.permitService.getApprovals(this.activeTab).subscribe({
      next: (permits) => { this.pendingPermits = permits; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  switchTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    this.loadApprovals();
  }

  approve(permit: Permit): void {
    const key = `${permit.type}-${permit.id}`;
    this.processing.add(key);
    this.permitService.approvePermit(permit.type, permit.id).subscribe({
      next: () => {
        this.message = `Permit #${permit.id} approved`;
        this.messageType = 'success';
        this.processing.delete(key);
        this.loadApprovals();
      },
      error: () => {
        this.message = 'Failed to approve';
        this.messageType = 'error';
        this.processing.delete(key);
        this.cdr.markForCheck();
      },
    });
  }

  reject(permit: Permit): void {
    const remark = prompt('Rejection reason:');
    if (remark === null) return;
    const key = `${permit.type}-${permit.id}`;
    this.processing.add(key);
    this.permitService.rejectPermit(permit.type, permit.id, remark).subscribe({
      next: () => {
        this.message = `Permit #${permit.id} rejected`;
        this.messageType = 'success';
        this.processing.delete(key);
        this.loadApprovals();
      },
      error: () => {
        this.message = 'Failed to reject';
        this.messageType = 'error';
        this.processing.delete(key);
        this.cdr.markForCheck();
      },
    });
  }

  isProcessing(permit: Permit): boolean {
    return this.processing.has(`${permit.type}-${permit.id}`);
  }

  getStatusStyle(status: string) { return this.statusConfig[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' }; }
  getModeStyle(code: string) { return this.modeConfig[code] || { label: code, color: '#64748b', icon: 'help' }; }
}
