import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, Courier } from '../../services/reception.service';

@Component({
  selector: 'app-reception-couriers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Courier Log</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Log Courier</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search tracking, company, sender..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All</option><option value="inbound">Inbound</option><option value="outbound">Outbound</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="received">Received</option><option value="notified">Notified</option><option value="collected">Collected</option>
          <option value="dispatched">Dispatched</option><option value="returned">Returned</option></select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tracking</th><th>Courier</th><th>Dir</th><th>From</th><th>To</th><th>AWB</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (c of couriers; track c.id) {
              <tr>
                <td class="mono">{{ c.tracking_no }}</td>
                <td>{{ c.courier_company }}</td>
                <td><span class="badge dir" [class.inbound]="c.type==='inbound'" [class.outbound]="c.type==='outbound'">
                  <span class="material-icons-round">{{ c.type === 'inbound' ? 'call_received' : 'call_made' }}</span>{{ c.type }}</span></td>
                <td>{{ c.sender_name }}<br><small class="text-muted">{{ c.sender_company }}</small></td>
                <td>{{ c.recipient_name }}<br><small class="text-muted">{{ c.recipient_dept }}</small></td>
                <td class="mono">{{ c.awb_no || '—' }}</td>
                <td><span class="badge" [attr.data-status]="c.status">{{ formatStatus(c.status) }}</span></td>
                <td class="actions-cell">
                  @if (c.type === 'inbound' && (c.status === 'received' || c.status === 'notified')) {
                    <button class="action-btn collect" (click)="markCollected(c)"><span class="material-icons-round">check_circle</span></button>
                  }
                  @if (c.type === 'outbound' && c.status === 'received') {
                    <button class="action-btn dispatch" (click)="markDispatched(c)"><span class="material-icons-round">send</span></button>
                  }
                  <button class="icon-btn" (click)="edit(c)"><span class="material-icons-round">edit</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!couriers.length) { <p class="empty">No courier entries found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>
      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Courier' : 'Log Courier' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field"><label>Tracking No *</label><input [(ngModel)]="form.tracking_no"></div>
                <div class="field"><label>Courier Company *</label><input [(ngModel)]="form.courier_company" placeholder="BlueDart, DTDC, etc."></div>
                <div class="field"><label>Direction *</label><select [(ngModel)]="form.type"><option value="inbound">Inbound</option><option value="outbound">Outbound</option></select></div>
                <div class="field"><label>AWB No</label><input [(ngModel)]="form.awb_no"></div>
                <div class="field"><label>Sender Name *</label><input [(ngModel)]="form.sender_name"></div>
                <div class="field"><label>Sender Company</label><input [(ngModel)]="form.sender_company"></div>
                <div class="field"><label>Sender Phone</label><input [(ngModel)]="form.sender_phone"></div>
                <div class="field"><label>Recipient Name *</label><input [(ngModel)]="form.recipient_name"></div>
                <div class="field"><label>Recipient Dept</label><input [(ngModel)]="form.recipient_dept"></div>
                <div class="field"><label>Weight (kg)</label><input [(ngModel)]="form.weight" type="number" step="0.1"></div>
                <div class="field full"><label>Description</label><textarea [(ngModel)]="form.description" rows="2"></textarea></div>
                @if (editing) {
                  <div class="field"><label>Status</label><select [(ngModel)]="form.status">
                    <option value="received">Received</option><option value="notified">Notified</option><option value="collected">Collected</option>
                    <option value="dispatched">Dispatched</option><option value="returned">Returned</option></select></div>
                }
                <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Log') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-couriers.component.scss',
})
export class ReceptionCouriersComponent implements OnInit {
  couriers: Courier[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: Courier | null = null; form: any = {};
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getCouriers({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.couriers = r.couriers; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() { this.form = { tracking_no: '', courier_company: '', type: 'inbound', sender_name: '', sender_company: '', sender_phone: '', recipient_name: '', recipient_dept: '', description: '', weight: '', awb_no: '', remarks: '' }; }
  edit(c: Courier) { this.editing = c; this.form = { ...c }; this.showForm = true; }
  markCollected(c: Courier) { this.svc.updateCourier(c.id, { status: 'collected', collected_at: new Date().toISOString(), collected_by: 'Reception' }).subscribe(() => this.load()); }
  markDispatched(c: Courier) { this.svc.updateCourier(c.id, { status: 'dispatched', dispatched_at: new Date().toISOString() }).subscribe(() => this.load()); }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateCourier(this.editing.id, this.form) : this.svc.createCourier(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
