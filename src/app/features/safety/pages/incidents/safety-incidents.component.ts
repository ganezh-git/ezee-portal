import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, Incident } from '../../services/safety.service';

@Component({
  selector: 'app-safety-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Incident Management</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add_alert</span>Report Incident</button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" placeholder="Search incidents..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option *ngFor="let t of incidentTypes" [value]="t.value">{{ t.label }}</option></select>
        <select [(ngModel)]="filterSeverity" (change)="load()"><option value="">All Severity</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="reported">Reported</option><option value="investigating">Investigating</option>
          <option value="action_taken">Action Taken</option><option value="closed">Closed</option></select>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>No.</th><th>Title</th><th>Type</th><th>Severity</th><th>Date</th>
            <th>Location</th><th>Department</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            @for (inc of incidents; track inc.id) {
              <tr [class.critical-row]="inc.severity === 'critical'">
                <td class="mono">{{ inc.incident_no }}</td>
                <td class="title-cell">{{ inc.title }}</td>
                <td><span class="badge type">{{ formatType(inc.incident_type) }}</span></td>
                <td><span class="badge" [attr.data-sev]="inc.severity">{{ inc.severity }}</span></td>
                <td>{{ inc.incident_date | date:'mediumDate' }}</td>
                <td>{{ inc.location }}</td>
                <td>{{ inc.department }}</td>
                <td><span class="badge status" [attr.data-status]="inc.status">{{ formatType(inc.status) }}</span></td>
                <td><button class="icon-btn" (click)="edit(inc)" title="Edit"><span class="material-icons-round">edit</span></button>
                  <button class="icon-btn" (click)="viewDetail(inc)" title="View"><span class="material-icons-round">visibility</span></button></td>
              </tr>
            }
          </tbody>
        </table>
        @if (!incidents.length) { <p class="empty">No incidents found</p> }
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      <!-- Form Dialog -->
      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editing ? 'Update Incident' : 'Report New Incident' }}</h2>
              <button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field full"><label>Title *</label><input [(ngModel)]="form.title" required placeholder="Brief incident description"></div>
                <div class="field"><label>Type *</label>
                  <select [(ngModel)]="form.incident_type"><option *ngFor="let t of incidentTypes" [value]="t.value">{{ t.label }}</option></select></div>
                <div class="field"><label>Severity *</label>
                  <select [(ngModel)]="form.severity"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                <div class="field"><label>Date *</label><input type="date" [(ngModel)]="form.incident_date"></div>
                <div class="field"><label>Time</label><input type="time" [(ngModel)]="form.incident_time"></div>
                <div class="field"><label>Location *</label><input [(ngModel)]="form.location" placeholder="e.g. Production Floor"></div>
                <div class="field"><label>Department *</label><input [(ngModel)]="form.department" placeholder="e.g. Production"></div>
                <div class="field"><label>Injured Person</label><input [(ngModel)]="form.injured_person" placeholder="Name (if any)"></div>
                <div class="field"><label>Injury Type</label><input [(ngModel)]="form.injury_type" placeholder="e.g. Cut, Burn"></div>
                <div class="field full"><label>Description *</label><textarea [(ngModel)]="form.description" rows="3" placeholder="Detailed description"></textarea></div>
                <div class="field full"><label>Immediate Action Taken</label><textarea [(ngModel)]="form.immediate_action" rows="2"></textarea></div>
                <div class="field full"><label>Root Cause</label><textarea [(ngModel)]="form.root_cause" rows="2"></textarea></div>
                <div class="field full"><label>Corrective Action</label><textarea [(ngModel)]="form.corrective_action" rows="2"></textarea></div>
                <div class="field full"><label>Preventive Action</label><textarea [(ngModel)]="form.preventive_action" rows="2"></textarea></div>
                <div class="field"><label>Witness Names</label><input [(ngModel)]="form.witness_names" placeholder="Comma separated"></div>
                <div class="field"><label>Investigation By</label><input [(ngModel)]="form.investigation_by"></div>
                @if (editing) {
                  <div class="field"><label>Status</label>
                    <select [(ngModel)]="form.status"><option value="reported">Reported</option><option value="investigating">Investigating</option>
                      <option value="action_taken">Action Taken</option><option value="closed">Closed</option></select></div>
                }
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Report') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Detail Dialog -->
      @if (detail) {
        <div class="overlay" (click)="detail = null">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ detail.incident_no }} — {{ detail.title }}</h2><button class="close-btn" (click)="detail = null"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body detail-view">
              <div class="detail-grid">
                <div><strong>Type:</strong> {{ formatType(detail.incident_type) }}</div>
                <div><strong>Severity:</strong> <span class="badge" [attr.data-sev]="detail.severity">{{ detail.severity }}</span></div>
                <div><strong>Date:</strong> {{ detail.incident_date | date:'mediumDate' }} {{ detail.incident_time }}</div>
                <div><strong>Location:</strong> {{ detail.location }}</div>
                <div><strong>Department:</strong> {{ detail.department }}</div>
                <div><strong>Status:</strong> <span class="badge status" [attr.data-status]="detail.status">{{ formatType(detail.status) }}</span></div>
                <div *ngIf="detail.injured_person"><strong>Injured Person:</strong> {{ detail.injured_person }}</div>
                <div *ngIf="detail.injury_type"><strong>Injury Type:</strong> {{ detail.injury_type }}</div>
              </div>
              <div class="detail-section" *ngIf="detail.description"><h4>Description</h4><p>{{ detail.description }}</p></div>
              <div class="detail-section" *ngIf="detail.immediate_action"><h4>Immediate Action</h4><p>{{ detail.immediate_action }}</p></div>
              <div class="detail-section" *ngIf="detail.root_cause"><h4>Root Cause Analysis</h4><p>{{ detail.root_cause }}</p></div>
              <div class="detail-section" *ngIf="detail.corrective_action"><h4>Corrective Action (CAPA)</h4><p>{{ detail.corrective_action }}</p></div>
              <div class="detail-section" *ngIf="detail.preventive_action"><h4>Preventive Action</h4><p>{{ detail.preventive_action }}</p></div>
              <div class="detail-section" *ngIf="detail.witness_names"><h4>Witnesses</h4><p>{{ detail.witness_names }}</p></div>
              <div class="detail-section" *ngIf="detail.investigation_by"><h4>Investigation</h4><p>{{ detail.investigation_by }} {{ detail.investigation_date ? '(' + (detail.investigation_date | date:'mediumDate') + ')' : '' }}</p></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './safety-incidents.component.scss',
})
export class SafetyIncidentsComponent implements OnInit {
  incidents: Incident[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterSeverity = ''; filterStatus = '';
  showForm = false; saving = false; editing: Incident | null = null; detail: Incident | null = null;
  form: any = {};

  incidentTypes = [
    { value: 'near_miss', label: 'Near Miss' }, { value: 'first_aid', label: 'First Aid' },
    { value: 'medical', label: 'Medical Treatment' }, { value: 'lost_time', label: 'Lost Time Injury' },
    { value: 'lti', label: 'LTI' }, { value: 'fatality', label: 'Fatality' },
    { value: 'property_damage', label: 'Property Damage' }, { value: 'fire', label: 'Fire' },
    { value: 'chemical_spill', label: 'Chemical Spill' }, { value: 'environmental', label: 'Environmental' },
    { value: 'other', label: 'Other' },
  ];

  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.svc.getIncidents({ search: this.search, type: this.filterType, severity: this.filterSeverity, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.incidents = r.incidents; this.total = r.total; this.cdr.markForCheck(); });
  }

  resetForm() {
    this.form = { title: '', incident_type: 'near_miss', severity: 'low', incident_date: new Date().toISOString().slice(0, 10), incident_time: '', location: '', department: '', injured_person: '', injury_type: '', description: '', immediate_action: '', root_cause: '', corrective_action: '', preventive_action: '', witness_names: '', investigation_by: '', status: 'reported' };
  }

  edit(inc: Incident) { this.editing = inc; this.form = { ...inc }; this.showForm = true; }
  viewDetail(inc: Incident) { this.detail = inc; }

  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateIncident(this.editing.id, this.form) : this.svc.createIncident(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }

  formatType(t: string): string { return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
