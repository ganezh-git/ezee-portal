import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, Inspection } from '../../services/safety.service';

@Component({
  selector: 'app-safety-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Safety Inspections</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">fact_check</span>New Inspection</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search inspections..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="routine">Routine</option><option value="scheduled">Scheduled</option><option value="surprise">Surprise</option><option value="audit">Audit</option><option value="pre_work">Pre-Work</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="planned">Planned</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="follow_up">Follow Up</option></select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>No.</th><th>Type</th><th>Area</th><th>Department</th><th>Date</th><th>Inspector</th><th>Score</th><th>NCs</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          @for (i of inspections; track i.id) {
            <tr>
              <td class="mono">{{ i.inspection_no }}</td>
              <td><span class="badge type">{{ formatType(i.inspection_type) }}</span></td>
              <td>{{ i.area }}</td><td>{{ i.department }}</td>
              <td>{{ i.inspection_date | date:'mediumDate' }}</td>
              <td>{{ i.inspector_name }}</td>
              <td><span class="score" [class.good]="i.overall_score >= 80" [class.warn]="i.overall_score >= 50 && i.overall_score < 80" [class.bad]="i.overall_score < 50 && i.overall_score != null">{{ i.overall_score != null ? i.overall_score + '%' : '—' }}</span></td>
              <td><span [class.nc-red]="i.non_conformities > 0">{{ i.non_conformities }}</span></td>
              <td><span class="badge" [attr.data-status]="i.status">{{ formatType(i.status) }}</span></td>
              <td><button class="icon-btn" (click)="edit(i)"><span class="material-icons-round">edit</span></button></td>
            </tr>
          }
        </tbody>
      </table>
      @if (!inspections.length) { <p class="empty">No inspections found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit"><button [disabled]="page<=1" (click)="page=page-1;load()">Prev</button><span>{{ page }}/{{ totalPages }}</span><button [disabled]="page>=totalPages" (click)="page=page+1;load()">Next</button></div>
      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog large" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update' : 'New' }} Inspection</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field"><label>Type *</label><select [(ngModel)]="form.inspection_type"><option value="routine">Routine</option><option value="scheduled">Scheduled</option><option value="surprise">Surprise</option><option value="audit">Audit</option><option value="pre_work">Pre-Work</option></select></div>
            <div class="field"><label>Date *</label><input type="date" [(ngModel)]="form.inspection_date"></div>
            <div class="field"><label>Area *</label><input [(ngModel)]="form.area" placeholder="Inspection area"></div>
            <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
            <div class="field"><label>Inspector</label><input [(ngModel)]="form.inspector_name"></div>
            <div class="field"><label>Overall Score (%)</label><input type="number" min="0" max="100" [(ngModel)]="form.overall_score"></div>
            <div class="field"><label>Observations</label><input type="number" [(ngModel)]="form.observations"></div>
            <div class="field"><label>Non-Conformities</label><input type="number" [(ngModel)]="form.non_conformities"></div>
            <div class="field"><label>Due Date</label><input type="date" [(ngModel)]="form.due_date"></div>
            <div class="field"><label>Status</label><select [(ngModel)]="form.status"><option value="planned">Planned</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="follow_up">Follow Up</option></select></div>
            <div class="field full"><label>Findings</label><textarea [(ngModel)]="form.findings" rows="3" placeholder="Key findings..."></textarea></div>
            <div class="field full"><label>Corrective Actions</label><textarea [(ngModel)]="form.corrective_actions" rows="2"></textarea></div>
            <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
          </div></div>
          <div class="dialog-footer"><button class="btn btn-secondary" (click)="showForm=false">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button></div>
        </div></div>
      }
    </div>
  `,
  styleUrl: './safety-inspections.component.scss',
})
export class SafetyInspectionsComponent implements OnInit {
  inspections: Inspection[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: Inspection | null = null; form: any = {};
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getInspections({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page }).subscribe(r => { this.inspections = r.inspections; this.total = r.total; this.cdr.markForCheck(); }); }
  resetForm() { this.form = { inspection_type: 'routine', inspection_date: new Date().toISOString().slice(0, 10), area: '', department: '', inspector_name: '', overall_score: null, observations: 0, non_conformities: 0, due_date: '', status: 'planned', findings: '', corrective_actions: '', remarks: '' }; }
  edit(i: Inspection) { this.editing = i; this.form = { ...i }; this.showForm = true; }
  save() { this.saving = true; const o = this.editing ? this.svc.updateInspection(this.editing.id, this.form) : this.svc.createInspection(this.form); o.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } }); }
  formatType(t: string): string { return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
