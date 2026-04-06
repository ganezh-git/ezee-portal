import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, WorkPermit } from '../../services/safety.service';

@Component({
  selector: 'app-safety-permits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Work Permits</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add_task</span>New Permit</button>
      </div>

      <div class="permit-stats">
        @for (s of statusCounts; track s.status) {
          <div class="ps-card" [attr.data-status]="s.status" (click)="filterStatus = filterStatus === s.status ? '' : s.status; load()">
            <div class="ps-count">{{ s.count }}</div>
            <div class="ps-label">{{ formatType(s.status) }}</div>
          </div>
        }
      </div>

      <div class="filters">
        <input type="text" placeholder="Search permits..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="hot_work">Hot Work</option><option value="confined_space">Confined Space</option>
          <option value="height">Height</option><option value="electrical">Electrical</option>
          <option value="excavation">Excavation</option><option value="general">General</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="pending">Pending</option><option value="approved">Approved</option><option value="active">Active</option>
          <option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select>
      </div>

      <div class="cards-grid">
        @for (p of permits; track p.id) {
          <div class="permit-card" [attr.data-type]="p.permit_type">
            <div class="pc-header">
              <span class="badge" [attr.data-status]="p.status">{{ formatType(p.status) }}</span>
              <span class="pc-type"><span class="material-icons-round">{{ typeIcon(p.permit_type) }}</span>{{ formatType(p.permit_type) }}</span>
              <span class="pc-no">{{ p.permit_no }}</span>
            </div>
            <h3 class="pc-title">{{ p.title }}</h3>
            <div class="pc-meta">
              <div><span class="material-icons-round">location_on</span>{{ p.location || 'N/A' }}</div>
              <div><span class="material-icons-round">business</span>{{ p.department || 'N/A' }}</div>
              <div><span class="material-icons-round">calendar_today</span>{{ p.start_date | date:'mediumDate' }} {{ p.start_time }}</div>
              <div *ngIf="p.contractor_name"><span class="material-icons-round">engineering</span>{{ p.contractor_name }}</div>
              <div *ngIf="p.requested_by"><span class="material-icons-round">person</span>{{ p.requested_by }}</div>
            </div>
            <div class="pc-hazards" *ngIf="p.hazards"><strong>Hazards:</strong> {{ p.hazards }}</div>
            <div class="pc-actions">
              <button class="icon-btn" (click)="edit(p)"><span class="material-icons-round">edit</span></button>
              @if (p.status === 'pending') {
                <button class="btn btn-sm btn-approve" (click)="approve(p)">Approve</button>
              }
              @if (p.status === 'approved' || p.status === 'active') {
                <button class="btn btn-sm btn-close" (click)="closePermit(p)">Close</button>
              }
            </div>
          </div>
        }
        @if (!permits.length) { <p class="empty full-col">No permits found</p> }
      </div>

      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Work Permit' : 'New Work Permit' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field full"><label>Title *</label><input [(ngModel)]="form.title" placeholder="Work description"></div>
                <div class="field"><label>Permit Type *</label>
                  <select [(ngModel)]="form.permit_type"><option value="hot_work">Hot Work</option><option value="confined_space">Confined Space</option>
                    <option value="height">Height Work</option><option value="electrical">Electrical</option>
                    <option value="excavation">Excavation</option><option value="general">General</option></select></div>
                <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
                <div class="field"><label>Location</label><input [(ngModel)]="form.location" placeholder="Work area"></div>
                <div class="field"><label>Requested By</label><input [(ngModel)]="form.requested_by"></div>
                <div class="field"><label>Contractor Name</label><input [(ngModel)]="form.contractor_name"></div>
                <div class="field"><label>Safety Officer</label><input [(ngModel)]="form.safety_officer"></div>
                <div class="field"><label>Start Date *</label><input type="date" [(ngModel)]="form.start_date"></div>
                <div class="field"><label>Start Time</label><input type="time" [(ngModel)]="form.start_time"></div>
                <div class="field"><label>End Date</label><input type="date" [(ngModel)]="form.end_date"></div>
                <div class="field"><label>End Time</label><input type="time" [(ngModel)]="form.end_time"></div>
                <div class="field full"><label>Description</label><textarea [(ngModel)]="form.description" rows="2"></textarea></div>
                <div class="field full"><label>Hazards Identified</label><textarea [(ngModel)]="form.hazards" rows="2" placeholder="List all identified hazards"></textarea></div>
                <div class="field full"><label>Precautions Required</label><textarea [(ngModel)]="form.precautions" rows="2" placeholder="Safety measures to be taken"></textarea></div>
                <div class="field full"><label>PPE Required</label><input [(ngModel)]="form.ppe_required" placeholder="e.g. Hard hat, Safety goggle, Harness"></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Create') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './safety-permits.component.scss',
})
export class SafetyPermitsComponent implements OnInit {
  permits: WorkPermit[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: WorkPermit | null = null;
  form: any = {};
  statusCounts: { status: string; count: number }[] = [];

  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.svc.getPermits({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => {
        this.permits = r.permits; this.total = r.total;
        this.statusCounts = this.calcStatusCounts(r.permits);
        this.cdr.markForCheck();
      });
  }

  calcStatusCounts(permits: WorkPermit[]): { status: string; count: number }[] {
    const m = new Map<string, number>();
    ['pending', 'approved', 'active', 'completed', 'cancelled'].forEach(s => m.set(s, 0));
    permits.forEach(p => m.set(p.status, (m.get(p.status) || 0) + 1));
    return [...m.entries()].map(([status, count]) => ({ status, count }));
  }

  resetForm() {
    this.form = { title: '', permit_type: 'general', department: '', location: '', requested_by: '', contractor_name: '', safety_officer: '', start_date: new Date().toISOString().slice(0, 10), start_time: '', end_date: '', end_time: '', description: '', hazards: '', precautions: '', ppe_required: '' };
  }

  edit(p: WorkPermit) { this.editing = p; this.form = { ...p }; this.showForm = true; }

  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updatePermit(this.editing.id, this.form) : this.svc.createPermit(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }

  approve(p: WorkPermit) { this.svc.updatePermit(p.id, { ...p, status: 'approved' }).subscribe(() => this.load()); }
  closePermit(p: WorkPermit) { this.svc.updatePermit(p.id, { ...p, status: 'completed' }).subscribe(() => this.load()); }

  formatType(t: string): string { return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  typeIcon(t: string): string {
    const m: Record<string, string> = { hot_work: 'local_fire_department', confined_space: 'sensor_door', height: 'height', electrical: 'electrical_services', excavation: 'construction', general: 'assignment' };
    return m[t] || 'assignment';
  }
}
