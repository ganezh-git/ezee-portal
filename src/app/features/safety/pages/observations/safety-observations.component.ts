import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, SafetyObservation } from '../../services/safety.service';

@Component({
  selector: 'app-safety-observations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Behavior Based Safety (BBS) Observations</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">visibility</span>Log Observation</button>
      </div>

      <div class="obs-stats">
        <div class="os-card safe"><span class="material-icons-round">thumb_up</span><div><div class="os-val">{{ safeCount }}</div><div class="os-lbl">Safe Acts/Conditions</div></div></div>
        <div class="os-card unsafe"><span class="material-icons-round">thumb_down</span><div><div class="os-val">{{ unsafeCount }}</div><div class="os-lbl">Unsafe Acts/Conditions</div></div></div>
        <div class="os-card open"><span class="material-icons-round">pending</span><div><div class="os-val">{{ openCount }}</div><div class="os-lbl">Open Items</div></div></div>
        <div class="os-card ratio"><span class="material-icons-round">analytics</span><div><div class="os-val">{{ safetyRatio }}%</div><div class="os-lbl">Safety Compliance Rate</div></div></div>
      </div>

      <div class="filters">
        <input type="text" placeholder="Search observations..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="safe_act">Safe Act</option><option value="unsafe_act">Unsafe Act</option>
          <option value="safe_condition">Safe Condition</option><option value="unsafe_condition">Unsafe Condition</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="open">Open</option><option value="action_taken">Action Taken</option><option value="closed">Closed</option></select>
      </div>

      <div class="cards-grid">
        @for (o of observations; track o.id) {
          <div class="obs-card" [class.safe]="o.observation_type.includes('safe')" [class.unsafe]="o.observation_type.includes('unsafe')">
            <div class="oc-header">
              <span class="material-icons-round oc-icon">{{ o.observation_type.includes('safe') ? 'check_circle' : 'cancel' }}</span>
              <span class="oc-type">{{ formatType(o.observation_type) }}</span>
              <span class="badge" [attr.data-status]="o.status">{{ formatType(o.status) }}</span>
            </div>
            <p class="oc-desc">{{ o.description }}</p>
            <div class="oc-meta">
              <span><span class="material-icons-round">location_on</span>{{ o.location }}</span>
              <span><span class="material-icons-round">business</span>{{ o.department }}</span>
              <span><span class="material-icons-round">schedule</span>{{ o.created_at | date:'medium' }}</span>
            </div>
            <div class="oc-action" *ngIf="o.action_taken"><strong>Action:</strong> {{ o.action_taken }}</div>
            <button class="icon-btn" (click)="edit(o)"><span class="material-icons-round">edit</span></button>
          </div>
        }
        @if (!observations.length) { <p class="empty full-col">No observations found</p> }
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update' : 'Log' }} Observation</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field"><label>Type *</label><select [(ngModel)]="form.observation_type"><option value="safe_act">Safe Act</option><option value="unsafe_act">Unsafe Act</option><option value="safe_condition">Safe Condition</option><option value="unsafe_condition">Unsafe Condition</option></select></div>
            <div class="field"><label>Location *</label><input [(ngModel)]="form.location" placeholder="Area or location"></div>
            <div class="field"><label>Department *</label><input [(ngModel)]="form.department"></div>
            @if (editing) { <div class="field"><label>Status</label><select [(ngModel)]="form.status"><option value="open">Open</option><option value="action_taken">Action Taken</option><option value="closed">Closed</option></select></div> }
            <div class="field full"><label>Description *</label><textarea [(ngModel)]="form.description" rows="3" placeholder="Describe what was observed"></textarea></div>
            <div class="field full"><label>Action Taken</label><textarea [(ngModel)]="form.action_taken" rows="2"></textarea></div>
          </div></div>
          <div class="dialog-footer"><button class="btn btn-secondary" (click)="showForm=false">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button></div>
        </div></div>
      }
    </div>
  `,
  styleUrl: './safety-observations.component.scss',
})
export class SafetyObservationsComponent implements OnInit {
  observations: SafetyObservation[] = []; total = 0; page = 1; limit = 50;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: SafetyObservation | null = null; form: any = {};
  safeCount = 0; unsafeCount = 0; openCount = 0; safetyRatio = 0;

  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }

  load() {
    this.svc.getObservations({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => {
        this.observations = r.observations; this.total = r.total;
        this.safeCount = r.observations.filter(o => o.observation_type.includes('safe') && !o.observation_type.includes('unsafe')).length;
        this.unsafeCount = r.observations.filter(o => o.observation_type.includes('unsafe')).length;
        this.openCount = r.observations.filter(o => o.status === 'open').length;
        this.safetyRatio = this.total > 0 ? Math.round((this.safeCount / this.total) * 100) : 0;
        this.cdr.markForCheck();
      });
  }

  resetForm() { this.form = { observation_type: 'unsafe_act', location: '', department: '', description: '', action_taken: '', status: 'open' }; }
  edit(o: SafetyObservation) { this.editing = o; this.form = { ...o }; this.showForm = true; }
  save() { this.saving = true; const obs$ = this.editing ? this.svc.updateObservation(this.editing.id, this.form) : this.svc.createObservation(this.form); obs$.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } }); }
  formatType(t: string): string { return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
