import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, Training } from '../../services/safety.service';

@Component({
  selector: 'app-safety-training',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Safety Training Records</h1>
        <button class="btn btn-primary" (click)="showForm=true;editing=null;resetForm()"><span class="material-icons-round">school</span>Schedule Training</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search trainings..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option *ngFor="let t of trainingTypes" [value]="t.value">{{ t.label }}</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="planned">Planned</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
      </div>
      <div class="cards-grid">
        @for (t of trainings; track t.id) {
          <div class="training-card" [class.completed]="t.status==='completed'" [class.upcoming]="t.status==='planned'||t.status==='scheduled'">
            <div class="tc-header">
              <span class="badge" [attr.data-status]="t.status">{{ formatType(t.status) }}</span>
              <span class="tc-type"><span class="material-icons-round">{{ typeIcon(t.training_type) }}</span>{{ formatType(t.training_type) }}</span>
              <span class="tc-no">{{ t.training_no }}</span>
            </div>
            <h3 class="tc-title">{{ t.title }}</h3>
            <div class="tc-meta">
              <div><span class="material-icons-round">person</span>Trainer: {{ t.trainer_name }}</div>
              <div><span class="material-icons-round">calendar_today</span>{{ t.training_date | date:'mediumDate' }}</div>
              <div *ngIf="t.duration_hours"><span class="material-icons-round">schedule</span>{{ t.duration_hours }} hrs</div>
              <div><span class="material-icons-round">group</span>{{ t.attendees_count }} attendees</div>
              <div *ngIf="t.location"><span class="material-icons-round">location_on</span>{{ t.location }}</div>
              <div *ngIf="t.department"><span class="material-icons-round">business</span>{{ t.department }}</div>
            </div>
            <div class="tc-topics" *ngIf="t.topics_covered"><strong>Topics:</strong> {{ t.topics_covered }}</div>
            <button class="icon-btn" (click)="edit(t)" style="position:absolute;top:8px;right:8px"><span class="material-icons-round">edit</span></button>
          </div>
        }
        @if (!trainings.length) { <p class="empty" style="grid-column:1/-1">No trainings found</p> }
      </div>
      <div class="pagination" *ngIf="total>limit"><button [disabled]="page<=1" (click)="page=page-1;load()">Prev</button><span>{{ page }}/{{ totalPages }}</span><button [disabled]="page>=totalPages" (click)="page=page+1;load()">Next</button></div>
      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog large" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update' : 'Schedule' }} Training</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field full"><label>Title *</label><input [(ngModel)]="form.title" placeholder="Training topic"></div>
            <div class="field"><label>Type *</label><select [(ngModel)]="form.training_type"><option *ngFor="let t of trainingTypes" [value]="t.value">{{ t.label }}</option></select></div>
            <div class="field"><label>Trainer *</label><input [(ngModel)]="form.trainer_name"></div>
            <div class="field"><label>Date *</label><input type="date" [(ngModel)]="form.training_date"></div>
            <div class="field"><label>Duration (hrs)</label><input type="number" step="0.5" [(ngModel)]="form.duration_hours"></div>
            <div class="field"><label>Location</label><input [(ngModel)]="form.location"></div>
            <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
            <div class="field"><label>Attendees Count</label><input type="number" [(ngModel)]="form.attendees_count"></div>
            <div class="field"><label>Status</label><select [(ngModel)]="form.status"><option value="planned">Planned</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <div class="field full"><label>Attendees (names)</label><textarea [(ngModel)]="form.attendees" rows="2" placeholder="Comma separated names"></textarea></div>
            <div class="field full"><label>Topics Covered</label><textarea [(ngModel)]="form.topics_covered" rows="2"></textarea></div>
            <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
          </div></div>
          <div class="dialog-footer"><button class="btn btn-secondary" (click)="showForm=false">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving?'Saving...':'Save' }}</button></div>
        </div></div>
      }
    </div>
  `,
  styleUrl: './safety-training.component.scss',
})
export class SafetyTrainingComponent implements OnInit {
  trainings: Training[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: Training | null = null; form: any = {};
  trainingTypes = [
    { value: 'induction', label: 'Induction' }, { value: 'toolbox_talk', label: 'Toolbox Talk' },
    { value: 'fire_safety', label: 'Fire Safety' }, { value: 'first_aid', label: 'First Aid' },
    { value: 'ppe', label: 'PPE Usage' }, { value: 'hazmat', label: 'HAZMAT' },
    { value: 'electrical', label: 'Electrical Safety' }, { value: 'height', label: 'Working at Height' },
    { value: 'confined_space', label: 'Confined Space' }, { value: 'general', label: 'General Safety' },
    { value: 'safety', label: 'Safety Awareness' }, { value: 'skill', label: 'Skill Development' },
    { value: 'refresher', label: 'Refresher' }, { value: 'emergency', label: 'Emergency Response' },
  ];
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getTrainings({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page }).subscribe(r => { this.trainings = r.trainings; this.total = r.total; this.cdr.markForCheck(); }); }
  resetForm() { this.form = { title: '', training_type: 'general', trainer_name: '', training_date: new Date().toISOString().slice(0, 10), duration_hours: null, location: '', department: '', attendees_count: 0, attendees: '', topics_covered: '', remarks: '', status: 'planned' }; }
  edit(t: Training) { this.editing = t; this.form = { ...t }; this.showForm = true; }
  save() { this.saving = true; const o = this.editing ? this.svc.updateTraining(this.editing.id, this.form) : this.svc.createTraining(this.form); o.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } }); }
  formatType(t: string): string { return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  typeIcon(t: string) { const m: Record<string, string> = { induction: 'person_add', toolbox_talk: 'handyman', fire_safety: 'local_fire_department', first_aid: 'medical_services', ppe: 'masks', hazmat: 'science', electrical: 'electrical_services', height: 'height', confined_space: 'sensor_door', emergency: 'emergency' }; return m[t] || 'school'; }
}
