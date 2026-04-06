import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, Complaint } from '../../services/reception.service';

@Component({
  selector: 'app-reception-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Complaint Register</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Log Complaint</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search complaint no, name..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterCategory" (change)="load()"><option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c">{{ c | titlecase }}</option></select>
        <select [(ngModel)]="filterPriority" (change)="load()"><option value="">All Priority</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Complaint #</th><th>Complainant</th><th>Category</th><th>Priority</th><th>Description</th><th>Assigned To</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            @for (c of complaints; track c.id) {
              <tr [class.high-priority]="c.priority === 'critical' || c.priority === 'high'">
                <td class="mono">{{ c.complaint_no }}</td>
                <td class="fw-600">{{ c.complainant_name }}<br><small class="text-muted">{{ c.department }}</small></td>
                <td><span class="badge cat">{{ c.category }}</span></td>
                <td><span class="badge" [attr.data-priority]="c.priority">{{ c.priority }}</span></td>
                <td class="desc-cell">{{ c.description }}</td>
                <td>{{ c.assigned_to || '—' }}</td>
                <td><span class="badge" [attr.data-status]="c.status">{{ formatStatus(c.status) }}</span></td>
                <td>{{ c.created_at | date:'mediumDate' }}</td>
                <td>
                  <button class="icon-btn" (click)="edit(c)"><span class="material-icons-round">edit</span></button>
                  <button class="icon-btn" (click)="viewDetail(c)"><span class="material-icons-round">visibility</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!complaints.length) { <p class="empty">No complaints found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Complaint' : 'Log Complaint' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field"><label>Complainant Name *</label><input [(ngModel)]="form.complainant_name"></div>
                <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
                <div class="field"><label>Category *</label>
                  <select [(ngModel)]="form.category"><option *ngFor="let c of categories" [value]="c">{{ c | titlecase }}</option></select></div>
                <div class="field"><label>Priority *</label>
                  <select [(ngModel)]="form.priority"><option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option></select></div>
                <div class="field"><label>Location</label><input [(ngModel)]="form.location"></div>
                <div class="field"><label>Assigned To</label><input [(ngModel)]="form.assigned_to"></div>
                <div class="field full"><label>Description *</label><textarea [(ngModel)]="form.description" rows="3" placeholder="Detailed description of the complaint"></textarea></div>
                @if (editing) {
                  <div class="field full"><label>Resolution</label><textarea [(ngModel)]="form.resolution" rows="2" placeholder="How was the complaint resolved?"></textarea></div>
                  <div class="field"><label>Status</label>
                    <select [(ngModel)]="form.status"><option value="open">Open</option><option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
                }
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Log') }}</button>
            </div>
          </div>
        </div>
      }

      @if (detail) {
        <div class="overlay" (click)="detail = null">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ detail.complaint_no }}</h2><button class="close-btn" (click)="detail = null"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body detail-view">
              <div class="detail-grid">
                <div><strong>Complainant:</strong> {{ detail.complainant_name }}</div>
                <div><strong>Department:</strong> {{ detail.department }}</div>
                <div><strong>Category:</strong> <span class="badge cat">{{ detail.category }}</span></div>
                <div><strong>Priority:</strong> <span class="badge" [attr.data-priority]="detail.priority">{{ detail.priority }}</span></div>
                <div><strong>Location:</strong> {{ detail.location || '—' }}</div>
                <div><strong>Assigned To:</strong> {{ detail.assigned_to || '—' }}</div>
                <div><strong>Status:</strong> <span class="badge" [attr.data-status]="detail.status">{{ formatStatus(detail.status) }}</span></div>
                <div><strong>Date:</strong> {{ detail.created_at | date:'medium' }}</div>
              </div>
              <div class="detail-section"><h4>Description</h4><p>{{ detail.description }}</p></div>
              <div class="detail-section" *ngIf="detail.resolution"><h4>Resolution</h4><p>{{ detail.resolution }}</p></div>
              <div class="detail-section" *ngIf="detail.resolved_at"><h4>Resolved At</h4><p>{{ detail.resolved_at | date:'medium' }}</p></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-complaints.component.scss',
})
export class ReceptionComplaintsComponent implements OnInit {
  complaints: Complaint[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterCategory = ''; filterPriority = ''; filterStatus = '';
  showForm = false; saving = false; editing: Complaint | null = null; detail: Complaint | null = null; form: any = {};
  categories = ['housekeeping', 'maintenance', 'security', 'parking', 'noise', 'temperature', 'elevator', 'restroom', 'cafeteria', 'other'];
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getComplaints({ search: this.search, category: this.filterCategory, priority: this.filterPriority, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.complaints = r.complaints; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() { this.form = { complainant_name: '', department: '', category: 'housekeeping', priority: 'medium', location: '', description: '', assigned_to: '', resolution: '', status: 'open' }; }
  edit(c: Complaint) { this.editing = c; this.form = { ...c }; this.showForm = true; }
  viewDetail(c: Complaint) { this.detail = c; }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateComplaint(this.editing.id, this.form) : this.svc.createComplaint(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
