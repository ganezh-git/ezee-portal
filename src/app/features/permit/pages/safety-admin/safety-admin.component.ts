import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../services/permit.service';
import { PermitLocation, Holiday, Permit, PERMIT_STATUS_CONFIG } from '../../models/permit.models';

@Component({
  selector: 'app-safety-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './safety-admin.component.html',
  styleUrl: './safety-admin.component.scss',
})
export class SafetyAdminComponent implements OnInit {
  activeTab: 'locked' | 'locations' | 'holidays' = 'locked';
  loading = true;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Locked permits
  lockedPermits: Permit[] = [];
  statusConfig = PERMIT_STATUS_CONFIG;

  // Locations
  locations: PermitLocation[] = [];
  newLocation = { loc: '', dept: '' };
  showAddLocation = false;

  // Holidays
  holidays: Holiday[] = [];
  newHoliday = { holiday_date: '', description: '' };
  showAddHoliday = false;

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadTab(); }

  switchTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    this.loading = true;
    this.message = '';
    switch (this.activeTab) {
      case 'locked':
        this.permitService.getLockedPermits().subscribe({
          next: d => { this.lockedPermits = d; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.loading = false; this.cdr.markForCheck(); },
        });
        break;
      case 'locations':
        this.permitService.getLocations().subscribe({
          next: d => { this.locations = d; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.loading = false; this.cdr.markForCheck(); },
        });
        break;
      case 'holidays':
        this.permitService.getHolidays().subscribe({
          next: d => { this.holidays = d; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.loading = false; this.cdr.markForCheck(); },
        });
        break;
    }
  }

  unlockPermit(p: Permit): void {
    const remark = prompt('Unlock reason:');
    if (remark === null) return;
    this.permitService.unlockPermit(p.type, p.id).subscribe({
      next: () => { this.showMsg('Permit unlocked', 'success'); this.loadTab(); },
      error: () => this.showMsg('Failed to unlock', 'error'),
    });
  }

  addLocation(): void {
    if (!this.newLocation.loc.trim()) return;
    this.permitService.addLocation(this.newLocation.loc, this.newLocation.dept).subscribe({
      next: () => {
        this.showMsg('Location added', 'success');
        this.newLocation = { loc: '', dept: '' };
        this.showAddLocation = false;
        this.loadTab();
      },
      error: () => this.showMsg('Failed to add location', 'error'),
    });
  }

  lockLocation(loc: PermitLocation): void {
    this.permitService.lockLocation(loc.id).subscribe({
      next: () => { this.showMsg(`${loc.loc} locked`, 'success'); this.loadTab(); },
      error: () => this.showMsg('Failed to lock location', 'error'),
    });
  }

  unlockLocation(loc: PermitLocation): void {
    this.permitService.unlockLocation(loc.id).subscribe({
      next: () => { this.showMsg(`${loc.loc} unlocked`, 'success'); this.loadTab(); },
      error: () => this.showMsg('Failed to unlock location', 'error'),
    });
  }

  addHoliday(): void {
    if (!this.newHoliday.holiday_date || !this.newHoliday.description.trim()) return;
    this.permitService.addHoliday(this.newHoliday.holiday_date, this.newHoliday.description).subscribe({
      next: () => {
        this.showMsg('Holiday added', 'success');
        this.newHoliday = { holiday_date: '', description: '' };
        this.showAddHoliday = false;
        this.loadTab();
      },
      error: () => this.showMsg('Failed to add holiday', 'error'),
    });
  }

  removeHoliday(h: Holiday): void {
    if (!confirm(`Remove holiday "${h.description}"?`)) return;
    this.permitService.removeHoliday(h.id).subscribe({
      next: () => { this.showMsg('Holiday removed', 'success'); this.loadTab(); },
      error: () => this.showMsg('Failed to remove holiday', 'error'),
    });
  }

  private showMsg(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    this.cdr.markForCheck();
  }
}
