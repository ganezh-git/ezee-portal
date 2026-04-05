import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PermitBirlaService, MyBirlaRole } from '../../services/permit-birla.service';
import { BirlaPermit, Personnel, PERMIT_STATUS_CONFIG, PERMIT_TYPE_ICONS } from '../../models/permit-birla.models';
import { SignaturePadComponent } from '../../components/signature-pad.component';

@Component({
  selector: 'app-birla-approvals',
  standalone: true,
  imports: [RouterLink, FormsModule, SignaturePadComponent],
  templateUrl: './birla-approvals.component.html',
  styleUrl: './birla-approvals.component.scss',
})
export class BirlaApprovalsComponent implements OnInit {
  loading = true;
  acting = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  myRoles: string[] = [];
  permits: BirlaPermit[] = [];
  issuers: Personnel[] = [];
  custodians: Personnel[] = [];
  statusConfig = PERMIT_STATUS_CONFIG;
  typeIcons = PERMIT_TYPE_ICONS;

  // Current action state
  activePermitId: number | null = null;
  activeAction = '';
  selectedIssuerId: number | null = null;
  selectedCustodianId: number | null = null;
  coPermitteeName = '';
  signature = '';

  constructor(private svc: PermitBirlaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      myRole: this.svc.getMyRole(),
      permits: this.svc.getPermits({ limit: 200 }),
      issuers: this.svc.getPersonnel('issuer'),
      custodians: this.svc.getPersonnel('custodian'),
    }).subscribe({
      next: (data) => {
        this.myRoles = data.myRole.roles || [];
        this.issuers = data.issuers;
        this.custodians = data.custodians;
        // Filter to only permits that need approval actions
        this.permits = data.permits.permits.filter(p => this.canActOn(p));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  canActOn(p: BirlaPermit): boolean {
    if (p.status === 'Initiated' && this.canIssuerApprove()) return true;
    if (p.status === 'Issued' && this.canCustodianApprove()) return true;
    if (p.status === 'Custodian_Approved' && this.canActivate()) return true;
    return false;
  }

  canIssuerApprove(): boolean {
    return this.myRoles.includes('issuer') || this.myRoles.includes('admin');
  }

  canCustodianApprove(): boolean {
    return this.myRoles.includes('custodian') || this.myRoles.includes('admin');
  }

  canActivate(): boolean {
    return this.myRoles.includes('co_permittee') || this.myRoles.includes('admin');
  }

  getActionLabel(status: string): string {
    switch (status) {
      case 'Initiated': return 'Approve as Issuer';
      case 'Issued': return 'Approve as Custodian';
      case 'Custodian_Approved': return 'Activate Permit';
      default: return '';
    }
  }

  getActionIcon(status: string): string {
    switch (status) {
      case 'Initiated': return 'verified';
      case 'Issued': return 'gavel';
      case 'Custodian_Approved': return 'play_circle';
      default: return 'check';
    }
  }

  getActionColor(status: string): string {
    switch (status) {
      case 'Initiated': return 'blue';
      case 'Issued': return 'purple';
      case 'Custodian_Approved': return 'green';
      default: return 'gray';
    }
  }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  openAction(permit: BirlaPermit): void {
    this.activePermitId = permit.id;
    this.activeAction = permit.status;
    this.selectedIssuerId = null;
    this.selectedCustodianId = null;
    this.coPermitteeName = '';
    this.signature = '';
    this.cdr.markForCheck();
  }

  cancelAction(): void {
    this.activePermitId = null;
    this.activeAction = '';
    this.cdr.markForCheck();
  }

  confirmAction(): void {
    if (!this.activePermitId) return;
    this.acting = true;
    this.message = '';

    if (this.activeAction === 'Initiated' && this.selectedIssuerId) {
      this.svc.approve(this.activePermitId, 'issuer', this.selectedIssuerId, this.signature).subscribe({
        next: () => this.onSuccess('Approved by Issuer'),
        error: (e) => this.onError(e),
      });
    } else if (this.activeAction === 'Issued' && this.selectedCustodianId) {
      this.svc.approve(this.activePermitId, 'custodian', this.selectedCustodianId, this.signature).subscribe({
        next: () => this.onSuccess('Approved by Custodian'),
        error: (e) => this.onError(e),
      });
    } else if (this.activeAction === 'Custodian_Approved' && this.coPermitteeName.trim()) {
      this.svc.activate(this.activePermitId, this.coPermitteeName, this.signature).subscribe({
        next: () => this.onSuccess('Permit Activated'),
        error: (e) => this.onError(e),
      });
    }
  }

  private onSuccess(msg: string): void {
    this.acting = false;
    this.message = msg;
    this.messageType = 'success';
    this.activePermitId = null;
    this.activeAction = '';
    this.cdr.markForCheck();
    this.loadData();
  }

  private onError(err: any): void {
    this.acting = false;
    this.message = err.error?.error || 'Action failed';
    this.messageType = 'error';
    this.cdr.markForCheck();
  }

  get isConfirmDisabled(): boolean {
    if (this.acting) return true;
    if (this.activeAction === 'Initiated') return !this.selectedIssuerId;
    if (this.activeAction === 'Issued') return !this.selectedCustodianId;
    if (this.activeAction === 'Custodian_Approved') return !this.coPermitteeName.trim();
    return true;
  }

  get initiatedCount(): number {
    return this.permits.filter(p => p.status === 'Initiated').length;
  }

  get issuedCount(): number {
    return this.permits.filter(p => p.status === 'Issued').length;
  }

  get custodianApprovedCount(): number {
    return this.permits.filter(p => p.status === 'Custodian_Approved').length;
  }
}
