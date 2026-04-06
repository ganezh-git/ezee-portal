import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService } from '../../services/safety.service';

@Component({
  selector: 'app-safety-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Safety Settings</h1>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving"><span class="material-icons-round">save</span>{{ saving ? 'Saving...' : 'Save Changes' }}</button>
      </div>

      @if (saved) {
        <div class="alert success"><span class="material-icons-round">check_circle</span>Settings saved successfully</div>
      }

      <div class="settings-grid">
        <!-- General Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">business</span><h2>General</h2></div>
          <div class="setting-item">
            <label>Company Name</label>
            <input [(ngModel)]="settings['company_name']" placeholder="Company name">
          </div>
          <div class="setting-item">
            <label>Safety Officer</label>
            <input [(ngModel)]="settings['safety_officer']" placeholder="Safety officer name">
          </div>
          <div class="setting-item">
            <label>Safety Officer Contact</label>
            <input [(ngModel)]="settings['safety_officer_contact']" placeholder="Phone / Email">
          </div>
          <div class="setting-item">
            <label>Emergency Contact</label>
            <input [(ngModel)]="settings['emergency_contact']" placeholder="Emergency number">
          </div>
          <div class="setting-item">
            <label>Safety Policy Document URL</label>
            <input [(ngModel)]="settings['safety_policy_url']" placeholder="https://...">
          </div>
        </div>

        <!-- Incidents Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">report_problem</span><h2>Incidents</h2></div>
          <div class="setting-item">
            <label>Auto Incident No Prefix</label>
            <input [(ngModel)]="settings['incident_prefix']" placeholder="INC">
          </div>
          <div class="setting-item">
            <label>Critical Incident Notification Emails</label>
            <textarea [(ngModel)]="settings['critical_notification_emails']" rows="2" placeholder="email1@company.com, email2@company.com"></textarea>
          </div>
          <div class="setting-item">
            <label>Investigation Deadline (Days)</label>
            <input type="number" [(ngModel)]="settings['investigation_deadline_days']" placeholder="7">
          </div>
        </div>

        <!-- Permits Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">assignment_turned_in</span><h2>Work Permits</h2></div>
          <div class="setting-item">
            <label>Permit Types (comma separated)</label>
            <input [(ngModel)]="settings['permit_types']" placeholder="hot_work, confined_space, height, electrical, excavation, general">
          </div>
          <div class="setting-item">
            <label>Permit Validity (Hours)</label>
            <input type="number" [(ngModel)]="settings['permit_validity_hours']" placeholder="8">
          </div>
          <div class="setting-item">
            <label>Auto Permit No Prefix</label>
            <input [(ngModel)]="settings['permit_prefix']" placeholder="PTW">
          </div>
        </div>

        <!-- Departments Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">domain</span><h2>Departments</h2></div>
          <div class="setting-item">
            <label>Departments (comma separated)</label>
            <textarea [(ngModel)]="settings['departments']" rows="3" placeholder="Production, Maintenance, Warehouse, Logistics, Admin, HR, EHS"></textarea>
          </div>
          <div class="setting-item">
            <label>Locations (comma separated)</label>
            <textarea [(ngModel)]="settings['locations']" rows="3" placeholder="Main Plant, Warehouse A, Gate 1, Office Block"></textarea>
          </div>
        </div>

        <!-- PPE Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">masks</span><h2>PPE Management</h2></div>
          <div class="setting-item">
            <label>PPE Items (comma separated)</label>
            <textarea [(ngModel)]="settings['ppe_items']" rows="3" placeholder="helmet, safety_glasses, gloves, safety_shoes, ear_plugs, face_shield, respirator, harness, coverall, hi_vis_vest"></textarea>
          </div>
          <div class="setting-item">
            <label>PPE Expiry Reminder (Days Before)</label>
            <input type="number" [(ngModel)]="settings['ppe_expiry_reminder_days']" placeholder="30">
          </div>
        </div>

        <!-- Training Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">school</span><h2>Training</h2></div>
          <div class="setting-item">
            <label>Training Types (comma separated)</label>
            <textarea [(ngModel)]="settings['training_types']" rows="3" placeholder="induction, toolbox_talk, fire_safety, first_aid, chemical_handling, ppe_usage, confined_space, height_work, electrical_safety, emergency_response, hazmat, crane_operation, defensive_driving, ergonomics"></textarea>
          </div>
          <div class="setting-item">
            <label>Mandatory Refresher Period (Months)</label>
            <input type="number" [(ngModel)]="settings['refresher_period_months']" placeholder="12">
          </div>
        </div>

        <!-- Audit Section -->
        <div class="settings-section">
          <div class="section-header"><span class="material-icons-round">verified</span><h2>Audits</h2></div>
          <div class="setting-item">
            <label>Minimum Audit Score (%)</label>
            <input type="number" [(ngModel)]="settings['min_audit_score']" placeholder="70">
          </div>
          <div class="setting-item">
            <label>Audit Frequency (Days)</label>
            <input type="number" [(ngModel)]="settings['audit_frequency_days']" placeholder="30">
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./safety-settings.component.scss']
})
export class SafetySettingsComponent implements OnInit {
  settings: Record<string, string> = {};
  saving = false; saved = false;

  constructor(private svc: SafetyService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getSettings().subscribe(s => { this.settings = s || {}; this.cd.markForCheck(); });
  }

  save() {
    this.saving = true; this.saved = false;
    this.svc.saveSettings(this.settings).subscribe({
      next: () => { this.saving = false; this.saved = true; this.cd.markForCheck(); setTimeout(() => { this.saved = false; this.cd.markForCheck(); }, 3000); },
      error: () => { this.saving = false; this.cd.markForCheck(); }
    });
  }
}
