import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService } from '../../services/visitor.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-book-visit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
      <h1><span class="material-icons-round">edit_calendar</span> Book a Visit</h1></div>

      <div *ngIf="success" class="alert success">
        <span class="material-icons-round">check_circle</span>
        Visit <strong>{{ successNo }}</strong> booked successfully! Status: {{ successStatus }}
        <button (click)="reset()">Book Another</button>
      </div>

      <form *ngIf="!success" class="form-grid" (ngSubmit)="submit()">
        <!-- Visitor Info -->
        <fieldset>
          <legend>Visitor Details</legend>
          <div class="row">
            <div class="field"><label>Visitor Name *</label><input [(ngModel)]="f.visitor_name" name="vn" required></div>
            <div class="field"><label>Category *</label>
              <select [(ngModel)]="f.visitor_type" name="vt">
                <option *ngFor="let t of visitorTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div class="field"><label>Company</label><input [(ngModel)]="f.visitor_company" name="vc"></div>
            <div class="field"><label>Phone</label><input [(ngModel)]="f.visitor_phone" name="vp"></div>
            <div class="field"><label>Email</label><input [(ngModel)]="f.visitor_email" name="ve" type="email"></div>
          </div>
          <div class="row">
            <div class="field"><label>Headcount</label><input [(ngModel)]="f.visitor_count" name="cnt" type="number" min="1"></div>
            <div class="field" *ngIf="s['feature_vehicle_tracking']!=='off'">
              <label>Vehicle No {{ s['feature_vehicle_tracking']==='mandatory' ? '*' : '' }}</label>
              <input [(ngModel)]="f.vehicle_no" name="veh">
            </div>
            <div class="field" *ngIf="s['feature_emergency_contact']!=='off'">
              <label>Emergency Contact</label><input [(ngModel)]="f.emergency_contact" name="ec">
            </div>
          </div>
        </fieldset>

        <!-- Visit Info -->
        <fieldset>
          <legend>Visit Schedule</legend>
          <div class="row">
            <div class="field"><label>Purpose *</label><input [(ngModel)]="f.purpose" name="purpose" required></div>
          </div>
          <div class="row">
            <div class="field"><label>From Date *</label><input type="date" [(ngModel)]="f.visit_date" name="vd" required></div>
            <div class="field"><label>To Date <small>(optional, max 5 days)</small></label><input type="date" [(ngModel)]="f.visit_date_to" name="vdt" [min]="f.visit_date" [max]="maxEndDate"></div>
          </div>
          <div class="row">
            <div class="field"><label>Expected Arrival</label><input type="time" [(ngModel)]="f.expected_arrival" name="ea"></div>
            <div class="field"><label>Expected Departure</label><input type="time" [(ngModel)]="f.expected_departure" name="ed"></div>
          </div>
          <div class="row" *ngIf="s['feature_meeting_room']!=='off'">
            <div class="field"><label>Meeting Room</label><input [(ngModel)]="f.meeting_room" name="mr"></div>
          </div>
          <div class="row" *ngIf="s['feature_items_tracking']!=='off'">
            <div class="field full"><label>Items to Carry</label><textarea [(ngModel)]="f.items_carried" name="items" rows="2"></textarea></div>
          </div>
          <div class="row" *ngIf="s['feature_special_instructions']!=='off'">
            <div class="field full"><label>Special Instructions</label><textarea [(ngModel)]="f.special_instructions" name="si" rows="2"></textarea></div>
          </div>
        </fieldset>

        <!-- Host Info (auto-filled from login) -->
        <fieldset>
          <legend>Host Information</legend>
          <div class="row">
            <div class="field"><label>Host Name *</label><input [(ngModel)]="f.host_name" name="hn" required></div>
            <div class="field"><label>Department *</label>
              <select [(ngModel)]="f.host_department" name="hd" required>
                <option value="">Select...</option>
                <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div class="field"><label>Host Phone</label><input [(ngModel)]="f.host_phone" name="hp"></div>
            <div class="field"><label>Host Email</label><input [(ngModel)]="f.host_email" name="he"></div>
          </div>
        </fieldset>

        <!-- Approval -->
        <fieldset>
          <legend>Approval</legend>
          <div class="row">
            <div class="field">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="f.requires_approval" name="ra">
                Requires Approval
              </label>
            </div>
            <div class="field" *ngIf="s['approval_bypass_allowed']==='yes'">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="f.bypass_approval" name="ba" [disabled]="!f.requires_approval">
                Bypass Approval (oral/verbal)
              </label>
            </div>
          </div>
          <div class="row" *ngIf="f.bypass_approval">
            <div class="field full"><label>Bypass Reason *</label><input [(ngModel)]="f.bypass_reason" name="br" required placeholder="e.g. Verbal approval from HOD"></div>
          </div>
          <div class="row">
            <div class="field"><label>Booked By Role</label>
              <select [(ngModel)]="f.booked_by_role" name="br2">
                <option value="staff">Staff</option>
                <option value="reception">Reception</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div *ngIf="error" class="alert error"><span class="material-icons-round">error</span> {{ error }}</div>

        <div class="actions">
          <button type="submit" class="btn-submit" [disabled]="saving">
            <span class="material-icons-round">send</span> {{ saving ? 'Saving...' : 'Book Visit' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; max-width: 900px; }
    .page-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      &:hover { background: #f1f5f9; }
      .material-icons-round { font-size: 20px; color: #64748b; }
    }
    h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
      .material-icons-round { color: #8b5cf6; }
    }
    .form-grid { display: flex; flex-direction: column; gap: 20px; }
    fieldset { border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px 14px; background: #fff;
      legend { font-weight: 600; font-size: .9rem; color: #8b5cf6; padding: 0 8px; }
    }
    .row { display: flex; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
    .field { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 4px;
      &.full { flex: 100%; }
      label { font-size: .78rem; font-weight: 600; color: #475569; }
      input, select, textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; &:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,.1); } }
      small { color: #94a3b8; }
    }
    .toggle-label { display: flex; align-items: center; gap: 8px; font-size: .85rem; cursor: pointer; padding-top: 18px;
      input[type="checkbox"] { width: 18px; height: 18px; accent-color: #8b5cf6; }
    }
    .actions { display: flex; justify-content: flex-end; padding-top: 8px; }
    .btn-submit { padding: 10px 28px; background: #8b5cf6; color: #fff; border: none; border-radius: 10px; font-size: .9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
      &:hover { background: #7c3aed; } &:disabled { opacity: .5; }
    }
    .alert { padding: 14px 18px; border-radius: 10px; display: flex; align-items: center; gap: 10px; font-size: .88rem; margin-bottom: 18px;
      &.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
      &.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
      button { margin-left: auto; padding: 6px 14px; border: 1px solid currentColor; background: transparent; border-radius: 6px; cursor: pointer; font-size: .8rem; color: inherit; }
    }
  `]
})
export class BookVisitComponent implements OnInit {
  f: any = { visitor_type: 'Visitor', visitor_count: 1, requires_approval: false, bypass_approval: false, booked_by_role: 'staff', visit_date: new Date().toISOString().slice(0, 10) };
  s: Record<string, string> = {};
  visitorTypes: string[] = [];
  departments: string[] = [];
  saving = false;
  success = false;
  successNo = '';
  successStatus = '';
  error = '';

  constructor(private svc: VisitorService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Load settings
    this.svc.getSettings().subscribe(s => {
      this.s = s;
      this.visitorTypes = (s['visitor_types'] || '').split(',').map((t: string) => t.trim()).filter(Boolean);
      this.departments = (s['departments'] || '').split(',').map((d: string) => d.trim()).filter(Boolean);
      this.f.requires_approval = s['approval_default_required'] === 'yes';
    });

    // Auto-fill host from login
    this.svc.getMyProfile().subscribe(p => {
      if (p.fullName) this.f.host_name = p.fullName;
      if (p.department) this.f.host_department = p.department;
    });
  }

  get maxEndDate(): string {
    if (!this.f.visit_date) return '';
    const d = new Date(this.f.visit_date);
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  submit() {
    if (!this.f.visitor_name || !this.f.purpose || !this.f.visit_date || !this.f.host_name || !this.f.host_department) {
      this.error = 'Please fill all required fields';
      return;
    }
    if (this.f.bypass_approval && !this.f.bypass_reason) {
      this.error = 'Please provide bypass reason';
      return;
    }
    this.saving = true;
    this.error = '';
    this.svc.bookVisit(this.f).subscribe({
      next: (r) => { this.success = true; this.successNo = r.visit_no; this.successStatus = r.status; this.saving = false; },
      error: (e) => { this.error = e.error?.error || 'Failed to book'; this.saving = false; }
    });
  }

  reset() {
    this.success = false;
    this.f = { visitor_type: 'Visitor', visitor_count: 1, requires_approval: this.s['approval_default_required'] === 'yes', bypass_approval: false, booked_by_role: 'staff', visit_date: new Date().toISOString().slice(0, 10) };
    this.svc.getMyProfile().subscribe(p => {
      if (p.fullName) this.f.host_name = p.fullName;
      if (p.department) this.f.host_department = p.department;
    });
  }
}
