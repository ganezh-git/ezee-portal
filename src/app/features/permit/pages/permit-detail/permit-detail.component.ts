import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PermitService } from '../../services/permit.service';
import { Permit, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-permit-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './permit-detail.component.html',
  styleUrl: './permit-detail.component.scss',
})
export class PermitDetailComponent implements OnInit {
  permit: Permit | null = null;
  loading = true;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showConfirmForm = false;
  confirmForm!: FormGroup;
  saving = false;

  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;

  constructor(
    private route: ActivatedRoute,
    private permitService: PermitService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.confirmForm = this.fb.group({
      permitNumber: [''], permitOwner2: [''], permitOwner3: [''],
      permitUser1: [''], permitUser2: [''], permitUser3: [''],
      loto: [''], ladder: [''],
      c1: [''], c2: [''], c3: [''], c4: [''], c5: [''], c6: [''], c7: [''],
      remarks: [''],
    });

    const type = this.route.snapshot.params['type'];
    const id = +this.route.snapshot.params['id'];
    this.permitService.getPermit(type, id).subscribe({
      next: (p) => { this.permit = p; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  get statusStyle() {
    return this.statusConfig[this.permit?.status || ''] || { label: this.permit?.status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' };
  }

  get modeStyle() {
    return this.modeConfig[this.permit?.modeCode || ''] || { label: this.permit?.mode, color: '#64748b', icon: 'help' };
  }

  get canConfirm(): boolean {
    return this.permit?.status === 'Permit Pending for Confirm';
  }

  onConfirm(): void {
    if (!this.permit) return;
    this.saving = true;
    this.permitService.confirmPermit(this.permit.type, this.permit.id, this.confirmForm.value).subscribe({
      next: () => {
        this.message = 'Permit confirmed and issued!';
        this.messageType = 'success';
        this.saving = false;
        this.showConfirmForm = false;
        this.reload();
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to confirm';
        this.messageType = 'error';
        this.saving = false;
      },
    });
  }

  private reload(): void {
    if (!this.permit) return;
    this.permitService.getPermit(this.permit.type, this.permit.id).subscribe(p => this.permit = p);
  }
}
