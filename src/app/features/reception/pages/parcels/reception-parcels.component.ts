import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, Parcel } from '../../services/reception.service';

@Component({
  selector: 'app-reception-parcels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Parcel Management</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Log Parcel</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search tracking, sender, recipient..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="received">Received</option><option value="notified">Notified</option>
          <option value="collected">Collected</option><option value="returned">Returned</option></select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tracking No</th><th>Sender</th><th>Recipient</th><th>Dept</th><th>Type</th><th>Received</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (p of parcels; track p.id) {
              <tr>
                <td class="mono">{{ p.tracking_no }}</td>
                <td>{{ p.sender_name }}<br><small class="text-muted">{{ p.sender_company }}</small></td>
                <td class="fw-600">{{ p.recipient_name }}</td>
                <td>{{ p.recipient_dept }}</td>
                <td><span class="badge type">{{ p.parcel_type }}</span></td>
                <td>{{ p.received_at | date:'short' }}</td>
                <td><span class="badge" [attr.data-status]="p.status">{{ formatStatus(p.status) }}</span></td>
                <td class="actions-cell">
                  @if (p.status === 'received' || p.status === 'notified') {
                    <button class="action-btn collect" (click)="collect(p)" title="Mark Collected"><span class="material-icons-round">check_circle</span></button>
                  }
                  <button class="icon-btn" (click)="edit(p)" title="Edit"><span class="material-icons-round">edit</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!parcels.length) { <p class="empty">No parcels found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>
      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Parcel' : 'Log New Parcel' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field full"><label>Tracking No *</label><input [(ngModel)]="form.tracking_no" placeholder="Tracking/AWB number"></div>
                <div class="field"><label>Sender Name *</label><input [(ngModel)]="form.sender_name"></div>
                <div class="field"><label>Sender Company</label><input [(ngModel)]="form.sender_company"></div>
                <div class="field"><label>Recipient Name *</label><input [(ngModel)]="form.recipient_name"></div>
                <div class="field"><label>Recipient Dept *</label><input [(ngModel)]="form.recipient_dept"></div>
                <div class="field"><label>Parcel Type</label>
                  <select [(ngModel)]="form.parcel_type"><option value="document">Document</option><option value="box">Box</option>
                    <option value="envelope">Envelope</option><option value="other">Other</option></select></div>
                @if (editing) {
                  <div class="field"><label>Status</label>
                    <select [(ngModel)]="form.status"><option value="received">Received</option><option value="notified">Notified</option>
                      <option value="collected">Collected</option><option value="returned">Returned</option></select></div>
                }
                <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Log Parcel') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-parcels.component.scss',
})
export class ReceptionParcelsComponent implements OnInit {
  parcels: Parcel[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterStatus = '';
  showForm = false; saving = false; editing: Parcel | null = null;
  form: any = {};
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getParcels({ search: this.search, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.parcels = r.parcels; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() { this.form = { tracking_no: '', sender_name: '', sender_company: '', recipient_name: '', recipient_dept: '', parcel_type: 'box', remarks: '' }; }
  edit(p: Parcel) { this.editing = p; this.form = { ...p }; this.showForm = true; }
  collect(p: Parcel) { this.svc.updateParcel(p.id, { status: 'collected', collected_at: new Date().toISOString(), collected_by: 'Reception' }).subscribe(() => this.load()); }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateParcel(this.editing.id, this.form) : this.svc.createParcel(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
