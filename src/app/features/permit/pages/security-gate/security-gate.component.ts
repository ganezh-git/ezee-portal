import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../services/permit.service';
import { Permit, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-security-gate',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './security-gate.component.html',
  styleUrl: './security-gate.component.scss',
})
export class SecurityGateComponent implements OnInit {
  permits: Permit[] = [];
  loading = true;
  message = '';
  messageType: 'success' | 'error' = 'success';
  searchQuery = '';

  closingPermitKey: string | null = null;
  closeForm = { returnStatus: 'Permit Returned', securityName: '', remarks: '' };

  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;
  returnOptions = ['Permit Returned', 'Locked', 'Permit Returned with NC', 'Cancelled'];

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.permitService.getSecurityPermits().subscribe({
      next: (data) => { this.permits = data; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  get filtered(): Permit[] {
    if (!this.searchQuery) return this.permits;
    const q = this.searchQuery.toLowerCase();
    return this.permits.filter(p =>
      String(p.id).includes(q) || p.description?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) || p.permitOwner?.toLowerCase().includes(q)
    );
  }

  startClose(permit: Permit): void {
    this.closingPermitKey = `${permit.type}-${permit.id}`;
    this.closeForm = { returnStatus: 'Permit Returned', securityName: '', remarks: '' };
  }

  cancelClose(): void { this.closingPermitKey = null; }

  confirmClose(permit: Permit): void {
    if (!this.closeForm.securityName.trim()) {
      this.message = 'Security name is required';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return;
    }
    this.permitService.closePermit(permit.type, permit.id, this.closeForm).subscribe({
      next: () => {
        this.message = `Permit #${permit.id} closed successfully`;
        this.messageType = 'success';
        this.closingPermitKey = null;
        this.cdr.markForCheck();
        this.load();
      },
      error: () => {
        this.message = 'Failed to close permit';
        this.messageType = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  isClosing(permit: Permit): boolean {
    return this.closingPermitKey === `${permit.type}-${permit.id}`;
  }

  getStatusStyle(status: string) { return this.statusConfig[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' }; }
  getModeStyle(code: string) { return this.modeConfig[code] || { label: code, color: '#64748b', icon: 'help' }; }
}
