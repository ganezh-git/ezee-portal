import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, Visitor, Badge } from '../../services/reception.service';

@Component({
  selector: 'app-reception-visitors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Visitor Management</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">person_add</span>New Visitor</button>
      </div>

      <div class="filters">
        <input type="text" placeholder="Search name, company, host..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="visitor">Visitor</option><option value="contractor">Contractor</option>
          <option value="vendor">Vendor</option><option value="interview">Interview</option><option value="VIP">VIP</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="pre_registered">Pre-Registered</option><option value="checked_in">Checked In</option><option value="checked_out">Checked Out</option></select>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Name</th><th>Type</th><th>Company</th><th>Host</th><th>Badge</th>
            <th>Check In</th><th>Check Out</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            @for (v of visitors; track v.id) {
              <tr [class.vip-row]="v.visitor_type === 'VIP'">
                <td class="name-cell">
                  <span class="material-icons-round vi-type-icon" [class.vip]="v.visitor_type === 'VIP'">{{ v.visitor_type === 'VIP' ? 'star' : 'person' }}</span>
                  {{ v.visitor_name }}
                </td>
                <td><span class="badge type">{{ v.visitor_type }}</span></td>
                <td>{{ v.company || '—' }}</td>
                <td>{{ v.host_name }}<br><small class="text-muted">{{ v.host_department }}</small></td>
                <td class="mono">{{ v.badge_no || '—' }}</td>
                <td>{{ v.check_in ? (v.check_in | date:'shortTime') : '—' }}</td>
                <td>{{ v.check_out ? (v.check_out | date:'shortTime') : '—' }}</td>
                <td><span class="badge" [attr.data-status]="v.status">{{ formatStatus(v.status) }}</span></td>
                <td class="actions-cell">
                  @if (v.status === 'pre_registered') {
                    <button class="action-btn checkin" (click)="checkIn(v)" title="Check In"><span class="material-icons-round">login</span></button>
                  }
                  @if (v.status === 'checked_in') {
                    <button class="action-btn checkout" (click)="checkOut(v)" title="Check Out"><span class="material-icons-round">logout</span></button>
                  }
                  <button class="icon-btn" (click)="edit(v)" title="Edit"><span class="material-icons-round">edit</span></button>
                  <button class="icon-btn" (click)="viewDetail(v)" title="View"><span class="material-icons-round">visibility</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!visitors.length) { <p class="empty">No visitors found</p> }
      </div>

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
              <h2>{{ editing ? 'Update Visitor' : 'Register Visitor' }}</h2>
              <button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field full"><label>Visitor Name *</label><input [(ngModel)]="form.visitor_name" placeholder="Full name"></div>
                <div class="field"><label>Type *</label>
                  <select [(ngModel)]="form.visitor_type"><option value="visitor">Visitor</option><option value="contractor">Contractor</option>
                    <option value="vendor">Vendor</option><option value="interview">Interview</option><option value="VIP">VIP</option></select></div>
                <div class="field"><label>Company</label><input [(ngModel)]="form.company" placeholder="Company name"></div>
                <div class="field"><label>Phone *</label><input [(ngModel)]="form.phone" placeholder="Mobile number"></div>
                <div class="field"><label>Email</label><input type="email" [(ngModel)]="form.email" placeholder="Email address"></div>
                <div class="field"><label>ID Type</label>
                  <select [(ngModel)]="form.id_type"><option value="">Select</option><option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option><option value="Passport">Passport</option><option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option></select></div>
                <div class="field"><label>ID Number</label><input [(ngModel)]="form.id_number" placeholder="ID number"></div>
                <div class="field"><label>Purpose *</label><input [(ngModel)]="form.purpose" placeholder="Meeting, Delivery, etc."></div>
                <div class="field"><label>Host Name *</label><input [(ngModel)]="form.host_name" placeholder="Person to meet"></div>
                <div class="field"><label>Host Department *</label><input [(ngModel)]="form.host_department" placeholder="Department"></div>
                <div class="field"><label>Vehicle No</label><input [(ngModel)]="form.vehicle_no" placeholder="e.g. MH02AB1234"></div>
                <div class="field"><label>Items Carried</label><input [(ngModel)]="form.items_carried" placeholder="Laptop, Bag, etc."></div>
                <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
                @if (editing) {
                  <div class="field"><label>Badge No</label>
                    <select [(ngModel)]="form.badge_no"><option value="">None</option>
                      <option *ngFor="let b of availableBadges" [value]="b.badge_no">{{ b.badge_no }} ({{ b.badge_type }})</option>
                      @if (editing?.badge_no) { <option [value]="editing.badge_no">{{ editing.badge_no }} (current)</option> }
                    </select></div>
                  <div class="field"><label>Status</label>
                    <select [(ngModel)]="form.status"><option value="pre_registered">Pre-Registered</option>
                      <option value="checked_in">Checked In</option><option value="checked_out">Checked Out</option></select></div>
                }
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Register') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Detail Dialog -->
      @if (detail) {
        <div class="overlay" (click)="detail = null">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>Visitor Details</h2>
              <button class="close-btn" (click)="detail = null"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body detail-view">
              <div class="visitor-card-detail">
                <div class="vcd-avatar"><span class="material-icons-round">{{ detail.visitor_type === 'VIP' ? 'star' : 'person' }}</span></div>
                <div><h3>{{ detail.visitor_name }}</h3><span class="badge type">{{ detail.visitor_type }}</span></div>
              </div>
              <div class="detail-grid">
                <div><strong>Company:</strong> {{ detail.company || '—' }}</div>
                <div><strong>Phone:</strong> {{ detail.phone }}</div>
                <div><strong>Email:</strong> {{ detail.email || '—' }}</div>
                <div><strong>ID:</strong> {{ detail.id_type }} - {{ detail.id_number }}</div>
                <div><strong>Purpose:</strong> {{ detail.purpose }}</div>
                <div><strong>Host:</strong> {{ detail.host_name }} ({{ detail.host_department }})</div>
                <div><strong>Badge:</strong> {{ detail.badge_no || 'Not assigned' }}</div>
                <div><strong>Vehicle:</strong> {{ detail.vehicle_no || '—' }}</div>
                <div><strong>Items:</strong> {{ detail.items_carried || '—' }}</div>
                <div><strong>Status:</strong> <span class="badge" [attr.data-status]="detail.status">{{ formatStatus(detail.status) }}</span></div>
                <div><strong>Check In:</strong> {{ detail.check_in ? (detail.check_in | date:'medium') : '—' }}</div>
                <div><strong>Check Out:</strong> {{ detail.check_out ? (detail.check_out | date:'medium') : '—' }}</div>
              </div>
              <div class="detail-section" *ngIf="detail.remarks"><h4>Remarks</h4><p>{{ detail.remarks }}</p></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-visitors.component.scss',
})
export class ReceptionVisitorsComponent implements OnInit {
  visitors: Visitor[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: Visitor | null = null; detail: Visitor | null = null;
  form: any = {}; availableBadges: Badge[] = [];

  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); this.loadBadges(); }

  load() {
    this.svc.getVisitors({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.visitors = r.visitors; this.total = r.total; this.cdr.markForCheck(); });
  }

  loadBadges() { this.svc.getBadges().subscribe(b => { this.availableBadges = b.filter(x => x.is_available); this.cdr.markForCheck(); }); }

  resetForm() {
    this.form = { visitor_name: '', visitor_type: 'visitor', company: '', phone: '', email: '', id_type: '', id_number: '', purpose: '', host_name: '', host_department: '', vehicle_no: '', items_carried: '', remarks: '', badge_no: '', status: 'pre_registered' };
  }

  edit(v: Visitor) { this.editing = v; this.form = { ...v }; this.showForm = true; }
  viewDetail(v: Visitor) { this.detail = v; }

  checkIn(v: Visitor) {
    const badge = this.availableBadges[0];
    this.svc.updateVisitor(v.id, { status: 'checked_in', badge_no: badge?.badge_no || '', check_in: new Date().toISOString() })
      .subscribe(() => { this.load(); this.loadBadges(); });
  }

  checkOut(v: Visitor) {
    this.svc.updateVisitor(v.id, { status: 'checked_out', check_out: new Date().toISOString() })
      .subscribe(() => { this.load(); this.loadBadges(); });
  }

  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateVisitor(this.editing.id, this.form) : this.svc.createVisitor(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.loadBadges(); this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }

  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
