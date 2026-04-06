import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header">
          <button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
          <h1><span class="material-icons-round">settings</span> Vehicle Settings</h1>
        </div>
        <button class="btn-save" (click)="save()" [disabled]="saving">
          <span class="material-icons-round">save</span> {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      @if (saved) { <div class="alert success"><span class="material-icons-round">check_circle</span> Settings saved successfully</div> }

      <!-- Feature Toggles -->
      <div class="card">
        <h3>Feature Toggles</h3>
        <p class="subtitle">Enable or disable features for the vehicle entry process.</p>
        <div class="toggle-list">
          @for (f of features; track f.key) {
            <div class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-label">{{ f.label }}</span>
                <span class="toggle-desc">{{ f.desc }}</span>
              </div>
              <label class="switch">
                <input type="checkbox" [checked]="s[f.key] === 'yes'" (change)="s[f.key] = s[f.key] === 'yes' ? 'no' : 'yes'" />
                <span class="slider"></span>
              </label>
            </div>
          }
        </div>
      </div>

      <!-- General Settings -->
      <div class="card">
        <h3>General Settings</h3>
        <div class="setting-row">
          <label>Badge Prefix</label>
          <input [(ngModel)]="s['badge_prefix']" class="small-input" placeholder="e.g. VB-" />
        </div>
        <div class="setting-row">
          <label>Default Plant Entry Permission</label>
          <select [(ngModel)]="s['default_plant_entry']">
            <option value="permitted">Permitted</option>
            <option value="not_permitted">Not Permitted</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      <!-- Configurable Lists -->
      <div class="card">
        <h3>Configurable Lists</h3>
        <div class="setting-row">
          <label>Visitor Types <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['visitor_types']" rows="2" placeholder="visitor, vendor, amc_vendor, oem_vendor, employee, contractor"></textarea>
        </div>
        <div class="setting-row">
          <label>Vehicle Types <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['vehicle_types']" rows="2" placeholder="truck, van, car, two_wheeler, auto, other"></textarea>
        </div>
        <div class="setting-row">
          <label>Departments <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['departments']" rows="2" placeholder="Stores, Maintenance, Production, HR, Admin"></textarea>
        </div>
        <div class="setting-row">
          <label>Purpose Options <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['purposes']" rows="2" placeholder="delivery, pickup, service, visitor, maintenance, other"></textarea>
        </div>
        <div class="setting-row">
          <label>ID Types <small>(comma-separated)</small></label>
          <textarea [(ngModel)]="s['id_types']" rows="2" placeholder="aadhar, driving_license, pan, voter_id, passport, company_id"></textarea>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="card">
        <h3><span class="material-icons-round">history</span> Recent Activity Log</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Entry #</th><th>Vehicle</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
            <tbody>
              @for (l of logs; track l.id) {
                <tr>
                  <td>{{ formatDT(l.created_at) }}</td>
                  <td class="mono">{{ l.entry_no || '—' }}</td>
                  <td>{{ l.vehicle_no || '—' }}</td>
                  <td><span class="action-badge">{{ l.action }}</span></td>
                  <td>{{ l.performed_by || '—' }}</td>
                  <td class="details-cell">{{ l.details || '—' }}</td>
                </tr>
              }
              @if (!logs.length) { <tr><td colspan="6" class="empty">No activity logged yet</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
      h1 { font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; margin: 0;
        .material-icons-round { color: #0ea5e9; }
      }
    }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
    .btn-save { padding: 0.55rem 1rem; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
      .material-icons-round { font-size: 18px; }
      &:hover { transform: translateY(-1px); } &:disabled { opacity: 0.5; }
    }
    .alert.success { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 10px; margin-bottom: 1rem; font-size: 0.85rem;
      .material-icons-round { font-size: 20px; }
    }
    .card { background: #fff; border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;
      h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.5rem; display: flex; align-items: center; gap: 0.4rem;
        .material-icons-round { font-size: 20px; color: #0ea5e9; }
      }
      .subtitle { font-size: 0.8rem; color: #64748b; margin: 0 0 1rem; }
    }
    // Toggle switches
    .toggle-list { display: flex; flex-direction: column; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; }
    }
    .toggle-info { display: flex; flex-direction: column; }
    .toggle-label { font-size: 0.85rem; font-weight: 600; color: #334155; }
    .toggle-desc { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .switch { position: relative; width: 44px; height: 24px; flex-shrink: 0;
      input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; inset: 0; background: #e2e8f0; border-radius: 24px; cursor: pointer; transition: 0.2s;
        &::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
      }
      input:checked + .slider { background: #0ea5e9; }
      input:checked + .slider::before { transform: translateX(20px); }
    }
    // Settings rows
    .setting-row { display: flex; align-items: center; gap: 1rem; padding: 0.65rem 0; border-bottom: 1px solid #f8fafc;
      &:last-child { border-bottom: none; }
      label { flex: 1; font-size: 0.85rem; font-weight: 500; color: #334155;
        small { color: #94a3b8; font-weight: 400; }
      }
      input, select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; min-width: 200px;
        &:focus { outline: none; border-color: #0ea5e9; }
      }
      textarea { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.82rem; min-width: 300px; resize: vertical; font-family: inherit;
        &:focus { outline: none; border-color: #0ea5e9; }
      }
      .small-input { min-width: 100px; max-width: 150px; }
    }
    // Activity log table
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; padding: 0.5rem; border-bottom: 2px solid #e2e8f0; }
    td { padding: 0.45rem 0.5rem; font-size: 0.8rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .empty { text-align: center; padding: 1.5rem; color: #94a3b8; }
    .action-badge { display: inline-block; padding: 2px 8px; background: #e0f2fe; color: #0369a1; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; }
    .details-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem; color: #64748b; }
    @media (max-width: 768px) { .setting-row { flex-direction: column; align-items: flex-start; gap: 0.4rem; input, select, textarea { min-width: auto; width: 100%; } } }
  `]
})
export class VehicleSettingsComponent implements OnInit {
  s: Record<string, string> = {};
  saving = false;
  saved = false;
  logs: any[] = [];

  features = [
    { key: 'feature_ppe', label: 'PPE Tracking', desc: 'Track PPE issued and returned during entry/exit' },
    { key: 'feature_photo', label: 'Photo Capture', desc: 'Capture driver/visitor photo at entry' },
    { key: 'feature_id_proof', label: 'ID Proof Tracking', desc: 'Record driver ID type and number' },
    { key: 'feature_weighbridge', label: 'Weighbridge', desc: 'Record vehicle weight at entry and exit' },
    { key: 'feature_food', label: 'Food Requirement', desc: 'Track food/meal requirements for visitors' },
    { key: 'feature_plant_entry', label: 'Plant Entry Permission', desc: 'Show plant entry permission field (Permitted/Not Permitted)' },
    { key: 'feature_badge', label: 'Badge Number', desc: 'Auto-generate and assign badge numbers' },
    { key: 'feature_host', label: 'Host Information', desc: 'Track host name, department and phone' },
    { key: 'feature_visit_confirmation', label: 'Visit Confirmation', desc: 'Require host confirmation for visits' },
    { key: 'feature_pass_print', label: 'Pass Printing', desc: 'Enable visitor/vehicle pass printing' },
  ];

  constructor(private svc: VehicleService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getSettings().subscribe(s => { this.s = s; this.cdr.markForCheck(); });
    this.svc.getLog().subscribe(l => { this.logs = l; this.cdr.markForCheck(); });
  }

  goBack() { this.router.navigate(['/vehicle/dashboard']); }

  save() {
    this.saving = true;
    this.saved = false;
    this.svc.updateSettings(this.s).subscribe({
      next: () => { this.saving = false; this.saved = true; this.cdr.markForCheck(); setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 3000); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  formatDT(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
