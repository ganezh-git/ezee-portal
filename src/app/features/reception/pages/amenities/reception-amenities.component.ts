import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, AmenityRequest } from '../../services/reception.service';

@Component({
  selector: 'app-reception-amenities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Amenity Requests</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>New Request</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search request no, requester..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option *ngFor="let t of amenityTypes" [value]="t">{{ t | titlecase }}</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="requested">Requested</option><option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option><option value="rejected">Rejected</option></select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Request #</th><th>Requested By</th><th>Type</th><th>Location</th><th>Qty</th><th>Needed By</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (a of requests; track a.id) {
              <tr>
                <td class="mono">{{ a.request_no }}</td>
                <td class="fw-600">{{ a.requested_by }}<br><small class="text-muted">{{ a.department }}</small></td>
                <td><span class="badge type">
                  <span class="material-icons-round">{{ typeIcon(a.amenity_type) }}</span>{{ a.amenity_type }}</span></td>
                <td>{{ a.location || '—' }}</td>
                <td>{{ a.quantity }}</td>
                <td>{{ a.needed_by | date:'mediumDate' }}</td>
                <td><span class="badge" [attr.data-status]="a.status">{{ formatStatus(a.status) }}</span></td>
                <td>
                  @if (a.status === 'requested' || a.status === 'approved') {
                    <button class="action-btn fulfill" (click)="fulfill(a)"><span class="material-icons-round">check_circle</span></button>
                  }
                  <button class="icon-btn" (click)="edit(a)"><span class="material-icons-round">edit</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!requests.length) { <p class="empty">No amenity requests found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Request' : 'New Amenity Request' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field"><label>Requested By *</label><input [(ngModel)]="form.requested_by"></div>
                <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
                <div class="field"><label>Amenity Type *</label>
                  <select [(ngModel)]="form.amenity_type"><option *ngFor="let t of amenityTypes" [value]="t">{{ t | titlecase }}</option></select></div>
                <div class="field"><label>Quantity *</label><input type="number" [(ngModel)]="form.quantity" min="1"></div>
                <div class="field"><label>Location</label><input [(ngModel)]="form.location" placeholder="Room / Floor"></div>
                <div class="field"><label>Needed By</label><input type="date" [(ngModel)]="form.needed_by"></div>
                @if (editing) {
                  <div class="field"><label>Fulfilled By</label><input [(ngModel)]="form.fulfilled_by"></div>
                  <div class="field"><label>Status</label><select [(ngModel)]="form.status">
                    <option value="requested">Requested</option><option value="approved">Approved</option>
                    <option value="fulfilled">Fulfilled</option><option value="rejected">Rejected</option></select></div>
                }
                <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Submit') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-amenities.component.scss',
})
export class ReceptionAmenitiesComponent implements OnInit {
  requests: AmenityRequest[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: AmenityRequest | null = null; form: any = {};
  amenityTypes = ['water', 'tea_coffee', 'snacks', 'stationery', 'tissue', 'sanitizer', 'towels', 'flowers', 'projector', 'whiteboard', 'extension_board', 'other'];
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getAmenities({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.requests = r.requests; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() { this.form = { requested_by: '', department: '', amenity_type: 'water', quantity: 1, location: '', needed_by: '', remarks: '' }; }
  edit(a: AmenityRequest) { this.editing = a; this.form = { ...a }; this.showForm = true; }
  fulfill(a: AmenityRequest) {
    this.svc.updateAmenity(a.id, { status: 'fulfilled', fulfilled_by: 'Reception', fulfilled_at: new Date().toISOString() })
      .subscribe(() => this.load());
  }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateAmenity(this.editing.id, this.form) : this.svc.createAmenity(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  typeIcon(t: string): string {
    const icons: Record<string, string> = { water: 'water_drop', tea_coffee: 'coffee', snacks: 'lunch_dining', stationery: 'edit_note',
      tissue: 'cleaning_services', sanitizer: 'sanitizer', towels: 'dry_cleaning', flowers: 'local_florist',
      projector: 'videocam', whiteboard: 'dashboard', extension_board: 'power', other: 'category' };
    return icons[t] || 'category';
  }
}
