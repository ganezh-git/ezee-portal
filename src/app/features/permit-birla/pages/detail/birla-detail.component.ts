import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PermitBirlaService } from '../../services/permit-birla.service';
import { BirlaPermit, Personnel, PERMIT_STATUS_CONFIG } from '../../models/permit-birla.models';
import { SignaturePadComponent } from '../../components/signature-pad.component';

@Component({
  selector: 'app-birla-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, SignaturePadComponent],
  templateUrl: './birla-detail.component.html',
  styleUrl: './birla-detail.component.scss',
})
export class BirlaDetailComponent implements OnInit {
  permit: BirlaPermit | null = null;
  loading = true;
  message = '';
  messageType: 'success' | 'error' = 'success';
  acting = false;
  statusConfig = PERMIT_STATUS_CONFIG;

  // Role-based access
  userRoles: string[] = [];

  // For workflow actions
  issuers: Personnel[] = [];
  custodians: Personnel[] = [];
  selectedIssuerId: number | null = null;
  selectedCustodianId: number | null = null;
  coPermitteeName = '';
  suspendReason = '';
  safetyHoldReason = '';
  // Closure
  closureDebris = false;
  closureTools = false;
  closureSolvent = false;
  closureLototo = false;
  closureEquipReady = false;
  closureAreaCordoned = false;
  closureComments = '';
  showAction = '';
  signature = '';

  constructor(private svc: PermitBirlaService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      permit: this.svc.getPermit(id),
      issuers: this.svc.getPersonnel('issuer'),
      custodians: this.svc.getPersonnel('custodian'),
      myRole: this.svc.getMyRole(),
    }).subscribe({
      next: (data) => {
        this.permit = data.permit;
        this.issuers = data.issuers;
        this.custodians = data.custodians;
        this.userRoles = data.myRole.roles || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  canApproveAsIssuer(): boolean {
    return this.userRoles.includes('issuer') || this.userRoles.includes('admin');
  }

  canApproveAsCustodian(): boolean {
    return this.userRoles.includes('custodian') || this.userRoles.includes('admin');
  }

  canActivate(): boolean {
    return this.userRoles.includes('co_permittee') || this.userRoles.includes('admin');
  }

  canSuspendOrClose(): boolean {
    return this.userRoles.includes('issuer') || this.userRoles.includes('custodian') || this.userRoles.includes('admin');
  }

  canSafetyHold(): boolean {
    return this.userRoles.includes('admin') || this.userRoles.includes('issuer') || this.userRoles.includes('custodian');
  }

  getStatusStyle(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: 'help' };
  }

  get workingGroupList(): string[] {
    if (!this.permit?.working_group_members) return [];
    try { return JSON.parse(this.permit.working_group_members); } catch { return []; }
  }

  approveAsIssuer(): void {
    if (!this.selectedIssuerId || !this.permit) return;
    this.acting = true;
    this.svc.approve(this.permit.id, 'issuer', this.selectedIssuerId, this.signature).subscribe({
      next: () => { this.msg('Approved by Issuer', 'success'); this.reload(); },
      error: () => { this.msg('Failed to approve', 'error'); this.acting = false; },
    });
  }

  approveAsCustodian(): void {
    if (!this.selectedCustodianId || !this.permit) return;
    this.acting = true;
    this.svc.approve(this.permit.id, 'custodian', this.selectedCustodianId, this.signature).subscribe({
      next: () => { this.msg('Approved by Custodian', 'success'); this.reload(); },
      error: () => { this.msg('Failed to approve', 'error'); this.acting = false; },
    });
  }

  activate(): void {
    if (!this.coPermitteeName.trim() || !this.permit) return;
    this.acting = true;
    this.svc.activate(this.permit.id, this.coPermitteeName, this.signature).subscribe({
      next: () => { this.msg('Permit activated', 'success'); this.reload(); },
      error: () => { this.msg('Failed to activate', 'error'); this.acting = false; },
    });
  }

  suspend(): void {
    if (!this.suspendReason.trim() || !this.permit) return;
    this.acting = true;
    this.svc.suspend(this.permit.id, this.suspendReason, 'Admin').subscribe({
      next: () => { this.msg('Permit suspended', 'success'); this.reload(); },
      error: () => { this.msg('Failed to suspend', 'error'); this.acting = false; },
    });
  }

  closePermit(): void {
    if (!this.permit) return;
    this.acting = true;
    this.svc.close(this.permit.id, {
      closure_debris_removed: this.closureDebris,
      closure_tools_removed: this.closureTools,
      closure_solvent_jumpers: this.closureSolvent,
      closure_lototo_removed: this.closureLototo,
      closure_equipment_ready: this.closureEquipReady,
      closure_area_cordoned: this.closureAreaCordoned,
      closure_comments: this.closureComments,
      signature: this.signature,
    }).subscribe({
      next: () => { this.msg('Permit closed', 'success'); this.reload(); },
      error: () => { this.msg('Failed to close', 'error'); this.acting = false; },
    });
  }

  doSafetyHold(): void {
    if (!this.safetyHoldReason.trim() || !this.permit) return;
    this.acting = true;
    this.svc.safetyHold(this.permit.id, this.safetyHoldReason).subscribe({
      next: () => { this.msg('Permit placed on safety hold', 'success'); this.safetyHoldReason = ''; this.reload(); },
      error: () => { this.msg('Failed to place safety hold', 'error'); this.acting = false; },
    });
  }

  doResume(): void {
    if (!this.permit) return;
    this.acting = true;
    this.svc.resumePermit(this.permit.id).subscribe({
      next: () => { this.msg('Permit resumed', 'success'); this.reload(); },
      error: () => { this.msg('Failed to resume permit', 'error'); this.acting = false; },
    });
  }

  printPermit(): void {
    window.open(`/permit-birla/print/${this.permit?.id}`, '_blank');
  }

  private reload(): void {
    this.acting = false;
    this.showAction = '';
    this.signature = '';
    this.svc.getPermit(this.permit!.id).subscribe(p => { this.permit = p; this.cdr.markForCheck(); });
  }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    this.cdr.markForCheck();
  }
}
