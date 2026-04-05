import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PermitBirlaService } from '../../services/permit-birla.service';
import {
  PermitType, Department, WorkLocation, Personnel,
  HazardType, PpeType, PERMIT_TYPE_ICONS,
} from '../../models/permit-birla.models';

@Component({
  selector: 'app-birla-create',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './birla-create.component.html',
  styleUrl: './birla-create.component.scss',
})
export class BirlaCreateComponent implements OnInit {
  step = 1;
  loading = true;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Master data
  permitTypes: PermitType[] = [];
  departments: Department[] = [];
  locations: WorkLocation[] = [];
  initiators: Personnel[] = [];
  hazardTypes: HazardType[] = [];
  ppeTypes: PpeType[] = [];
  typeIcons = PERMIT_TYPE_ICONS;

  // Form fields
  selectedTypeCode = '';
  selectedType: PermitType | null = null;
  departmentId: number | null = null;
  locationId: number | null = null;
  locationText = '';
  isProject = false;
  crossRef = '';
  issuedDate = '';
  issuedTime = '09:00';
  validDate = '';
  validTime = '17:00';
  workDescription = '';
  hasAdditionalPermit = false;
  additionalPermitDetails = '';
  specificHazards = '';
  selectedHazards: Set<number> = new Set();
  selectedPpe: Set<number> = new Set();
  harnessIdNumber = '';
  // Isolation
  isoElectrical: 'YES' | 'NA' = 'NA';
  isoElecDrive = '';
  isoElecHow = '';
  isoServices: 'YES' | 'NA' = 'NA';
  isoServicesType = '';
  isoServicesHow = '';
  isoProcess: 'YES' | 'NA' = 'NA';
  isoProcessEquip = '';
  isoProcessHow = '';
  isoRequestedBy = '';
  lototoOwner = '';
  // Additional
  additionalPrecautions = '';
  fireWatcherName = '';
  fireWatcherMobile = '';
  workingGroupMembers: string[] = [''];
  initiatorId: number | null = null;
  // Precautions
  precautions: Record<string, boolean> = {};

  constructor(private svc: PermitBirlaService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const today = new Date();
    this.issuedDate = today.toISOString().split('T')[0];
    this.validDate = this.issuedDate;

    forkJoin({
      types: this.svc.getTypes(),
      depts: this.svc.getDepartments(),
      locs: this.svc.getLocations(),
      initiators: this.svc.getPersonnel('initiator'),
      hazards: this.svc.getHazardTypes(),
      ppe: this.svc.getPpeTypes(),
    }).subscribe({
      next: (data) => {
        this.permitTypes = data.types;
        this.departments = data.depts;
        this.locations = data.locs;
        this.initiators = data.initiators;
        this.hazardTypes = data.hazards;
        this.ppeTypes = data.ppe;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  selectType(code: string): void {
    this.selectedTypeCode = code;
    this.selectedType = this.permitTypes.find(t => t.code === code) || null;
    this.step = 2;
    this.cdr.markForCheck();
  }

  toggleHazard(id: number): void {
    if (this.selectedHazards.has(id)) this.selectedHazards.delete(id);
    else this.selectedHazards.add(id);
  }

  togglePpe(id: number): void {
    if (this.selectedPpe.has(id)) this.selectedPpe.delete(id);
    else this.selectedPpe.add(id);
  }

  addMember(): void { this.workingGroupMembers.push(''); }
  removeMember(i: number): void { this.workingGroupMembers.splice(i, 1); }

  nextStep(): void { if (this.step < 4) this.step++; this.cdr.markForCheck(); }
  prevStep(): void { if (this.step > 1) this.step--; this.cdr.markForCheck(); }

  submit(): void {
    if (!this.workDescription.trim()) {
      this.message = 'Work description is required'; this.messageType = 'error'; this.cdr.markForCheck(); return;
    }
    this.saving = true;
    this.message = '';

    const body: Record<string, any> = {
      permit_type_code: this.selectedTypeCode,
      department_id: this.departmentId,
      location_id: this.locationId,
      location_text: this.locationText,
      is_project: this.isProject,
      cross_ref: this.crossRef,
      issued_date: this.issuedDate,
      issued_time: this.issuedTime,
      valid_until_date: this.validDate,
      valid_until_time: this.validTime,
      work_description: this.workDescription,
      has_additional_permit: this.hasAdditionalPermit,
      additional_permit_details: this.additionalPermitDetails,
      specific_hazards: this.specificHazards,
      hazards: [...this.selectedHazards].map(id => ({ id })),
      ppe: [...this.selectedPpe].map(id => ({ id, harness_id_number: this.harnessIdNumber || null })),
      initiator_id: this.initiatorId,
      isolation_electrical: this.isoElectrical,
      isolation_electrical_drive: this.isoElecDrive,
      isolation_electrical_how: this.isoElecHow,
      isolation_services: this.isoServices,
      isolation_services_type: this.isoServicesType,
      isolation_services_how: this.isoServicesHow,
      isolation_process: this.isoProcess,
      isolation_process_equip: this.isoProcessEquip,
      isolation_process_how: this.isoProcessHow,
      isolation_requested_by: this.isoRequestedBy,
      lototo_owner_name: this.lototoOwner,
      additional_precautions: this.additionalPrecautions,
      fire_watcher_name: this.fireWatcherName,
      fire_watcher_mobile: this.fireWatcherMobile,
      working_group_members: this.workingGroupMembers.filter(m => m.trim()),
      precautions: this.precautions,
    };

    this.svc.createPermit(body).subscribe({
      next: (res) => {
        this.saving = false;
        this.message = `Permit ${res.permit_no} created successfully!`;
        this.messageType = 'success';
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/permit-birla/permits', res.id]), 1500);
      },
      error: (err) => {
        this.saving = false;
        this.message = err.error?.error || 'Failed to create permit';
        this.messageType = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  trackByIndex(i: number): number { return i; }
}
