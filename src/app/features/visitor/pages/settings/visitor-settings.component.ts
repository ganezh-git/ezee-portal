import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService } from '../../services/visitor.service';

@Component({
  selector: 'app-visitor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">settings</span> Admin Settings</h1></div>
        <button class="btn-save" (click)="save()" [disabled]="saving"><span class="material-icons-round">save</span> {{ saving ? 'Saving...' : 'Save Changes' }}</button>
      </div>

      <div *ngIf="saved" class="alert success">Settings saved successfully</div>

      <!-- Feature Toggles -->
      <div class="card">
        <h3>Feature Toggles</h3>
        <p class="subtitle">Control which features are enabled during visitor check-in. <strong>Off</strong> = hidden, <strong>Optional</strong> = shown but not required, <strong>Mandatory</strong> = required.</p>
        <table class="toggle-table">
          <thead><tr><th>Feature</th><th>Off</th><th>Optional</th><th>Mandatory</th></tr></thead>
          <tbody>
            <tr *ngFor="let f of features">
              <td>{{ f.label }}</td>
              <td><input type="radio" [name]="f.key" value="off" [(ngModel)]="s[f.key]"></td>
              <td><input type="radio" [name]="f.key" value="optional" [(ngModel)]="s[f.key]"></td>
              <td><input type="radio" [name]="f.key" value="mandatory" [(ngModel)]="s[f.key]"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Approval Settings -->
      <div class="card">
        <h3>Approval Settings</h3>
        <div class="setting-row">
          <label>Approval required by default for new visits?</label>
          <select [(ngModel)]="s['approval_default_required']">
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Allow reception/security to bypass approval?</label>
          <select [(ngModel)]="s['approval_bypass_allowed']">
            <option value="yes">Yes (with reason)</option><option value="no">No</option>
          </select>
        </div>
      </div>

      <!-- General Settings -->
      <div class="card">
        <h3>General Settings</h3>
        <div class="setting-row">
          <label>Company Name</label>
          <input [(ngModel)]="s['company_name']">
        </div>
        <div class="setting-row">
          <label>Badge Prefix</label>
          <input [(ngModel)]="s['badge_prefix']" class="small-input">
        </div>
        <div class="setting-row">
          <label>Auto-checkout enabled?</label>
          <select [(ngModel)]="s['auto_checkout_enabled']">
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
        <div class="setting-row" *ngIf="s['auto_checkout_enabled']==='yes'">
          <label>Auto-checkout Time</label>
          <input type="time" [(ngModel)]="s['auto_checkout_time']" class="small-input">
        </div>
        <div class="setting-row">
          <label>Default Visit Duration (hours)</label>
          <input type="number" [(ngModel)]="s['default_visit_duration_hours']" class="small-input" min="1">
        </div>
      </div>

      <!-- Lists -->
      <div class="card">
        <h3>Configurable Lists</h3>
        <div class="setting-row">
          <label>Visitor Categories <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['visitor_types']" rows="2"></textarea>
        </div>
        <div class="setting-row">
          <label>Departments <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['departments']" rows="2"></textarea>
        </div>
        <div class="setting-row">
          <label>ID Types <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['id_types']" rows="2"></textarea>
        </div>
        <div class="setting-row">
          <label>Gates <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['gates']" rows="2"></textarea>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; max-width: 900px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
      h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .btn-save { padding: 9px 20px; background: #8b5cf6; color: #fff; border: none; border-radius: 8px; font-size: .85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
      .material-icons-round { font-size: 18px; }
      &:hover { background: #7c3aed; } &:disabled { opacity: .5; }
    }
    .alert.success { padding: 10px 16px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 18px; font-size: .85rem; }
    .card { background: #fff; border-radius: 14px; padding: 20px 24px; margin-bottom: 18px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
      h3 { font-size: .95rem; font-weight: 600; margin: 0 0 6px; }
      .subtitle { font-size: .8rem; color: #64748b; margin: 0 0 16px; }
    }
    .toggle-table { width: 100%; border-collapse: collapse; font-size: .85rem;
      th { text-align: center; padding: 8px 12px; color: #64748b; font-weight: 600; font-size: .75rem; text-transform: uppercase; &:first-child { text-align: left; width: 50%; } }
      td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; &:first-child { text-align: left; font-weight: 500; } }
      input[type="radio"] { width: 18px; height: 18px; accent-color: #8b5cf6; }
    }
    .setting-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid #f8fafc;
      &:last-child { border-bottom: none; }
      label { flex: 1; font-size: .85rem; font-weight: 500; color: #334155;
        small { color: #94a3b8; font-weight: 400; }
      }
      input, select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; min-width: 200px;
        &:focus { outline: none; border-color: #8b5cf6; }
      }
      textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .82rem; min-width: 300px; resize: vertical;
        &:focus { outline: none; border-color: #8b5cf6; }
      }
      .small-input { min-width: 100px; max-width: 150px; }
    }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
  `]
})
export class VisitorSettingsComponent implements OnInit {
  s: Record<string, string> = {};
  saving = false;
  saved = false;

  features = [
    { key: 'feature_photo', label: 'Visitor Photo Capture' },
    { key: 'feature_id_proof', label: 'ID Proof Upload' },
    { key: 'feature_address_proof', label: 'Address Proof Upload' },
    { key: 'feature_nda', label: 'NDA / Agreement Signing' },
    { key: 'feature_covid_declaration', label: 'COVID Health Declaration' },
    { key: 'feature_vehicle_tracking', label: 'Vehicle Number Tracking' },
    { key: 'feature_items_tracking', label: 'Items / Materials Carried' },
    { key: 'feature_meeting_room', label: 'Meeting Room Assignment' },
    { key: 'feature_wifi_code', label: 'WiFi Access Code' },
    { key: 'feature_emergency_contact', label: 'Emergency Contact' },
    { key: 'feature_special_instructions', label: 'Special Instructions' },
  ];

  constructor(private svc: VisitorService, private router: Router) {}

  ngOnInit() { this.svc.getSettings().subscribe(s => this.s = s); }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  save() {
    this.saving = true;
    this.saved = false;
    this.svc.updateSettings(this.s).subscribe({
      next: () => { this.saving = false; this.saved = true; setTimeout(() => this.saved = false, 3000); },
      error: () => { this.saving = false; }
    });
  }
}
