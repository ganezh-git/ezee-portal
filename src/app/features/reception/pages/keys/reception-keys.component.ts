import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, KeyEntry } from '../../services/reception.service';

@Component({
  selector: 'app-reception-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Key Register</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Add Key</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search key tag, label, location..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="room">Room</option><option value="cabinet">Cabinet</option><option value="locker">Locker</option>
          <option value="vehicle">Vehicle</option><option value="gate">Gate</option><option value="safe">Safe</option>
          <option value="drawer">Drawer</option><option value="master">Master</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="available">Available</option><option value="issued">Issued</option><option value="lost">Lost</option></select>
      </div>
      <div class="key-grid">
        @for (k of keys; track k.id) {
          <div class="key-card" [class.issued]="k.status === 'issued'" [class.lost]="k.status === 'lost'">
            <div class="kc-header">
              <span class="material-icons-round kc-icon">vpn_key</span>
              <span class="badge" [attr.data-status]="k.status">{{ k.status }}</span>
            </div>
            <div class="kc-tag">{{ k.key_tag }}</div>
            <div class="kc-label">{{ k.key_label }}</div>
            <div class="kc-meta"><span class="badge type">{{ k.key_type }}</span> · {{ k.location }}</div>
            @if (k.status === 'issued') {
              <div class="kc-issued">
                <span class="material-icons-round">person</span>
                <span>{{ k.issued_to }} · {{ k.issued_at | date:'short' }}</span>
              </div>
            }
            <div class="kc-actions">
              @if (k.status === 'available') {
                <button class="action-btn issue" (click)="issueKey(k)"><span class="material-icons-round">output</span>Issue</button>
              }
              @if (k.status === 'issued') {
                <button class="action-btn return" (click)="returnKey(k)"><span class="material-icons-round">input</span>Return</button>
              }
              <button class="icon-btn" (click)="edit(k)"><span class="material-icons-round">edit</span></button>
            </div>
          </div>
        }
      </div>
      @if (!keys.length) { <p class="empty">No keys found</p> }
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Key' : 'Add New Key' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field"><label>Key Tag *</label><input [(ngModel)]="form.key_tag" placeholder="e.g. K-101"></div>
                <div class="field"><label>Key Label *</label><input [(ngModel)]="form.key_label" placeholder="e.g. Server Room Key"></div>
                <div class="field"><label>Type *</label>
                  <select [(ngModel)]="form.key_type"><option value="room">Room</option><option value="cabinet">Cabinet</option><option value="locker">Locker</option>
                    <option value="vehicle">Vehicle</option><option value="gate">Gate</option><option value="safe">Safe</option>
                    <option value="drawer">Drawer</option><option value="master">Master</option></select></div>
                <div class="field"><label>Location</label><input [(ngModel)]="form.location" placeholder="Building / Floor"></div>
                @if (editing) {
                  <div class="field"><label>Issued To</label><input [(ngModel)]="form.issued_to"></div>
                  <div class="field"><label>Status</label><select [(ngModel)]="form.status">
                    <option value="available">Available</option><option value="issued">Issued</option><option value="lost">Lost</option></select></div>
                }
                <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Add') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Issue Dialog -->
      @if (issueDialog) {
        <div class="overlay" (click)="issueDialog = null">
          <div class="dialog small" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>Issue Key: {{ issueDialog.key_tag }}</h2><button class="close-btn" (click)="issueDialog = null"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="field"><label>Issued To *</label><input [(ngModel)]="issueTo" placeholder="Person name"></div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="issueDialog = null">Cancel</button>
              <button class="btn btn-primary" (click)="confirmIssue()" [disabled]="!issueTo">Issue Key</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-keys.component.scss',
})
export class ReceptionKeysComponent implements OnInit {
  keys: KeyEntry[] = []; total = 0; page = 1; limit = 30;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; saving = false; editing: KeyEntry | null = null; form: any = {};
  issueDialog: KeyEntry | null = null; issueTo = '';
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getKeys({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.keys = r.keys; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() { this.form = { key_tag: '', key_label: '', key_type: 'room', location: '', remarks: '' }; }
  edit(k: KeyEntry) { this.editing = k; this.form = { ...k }; this.showForm = true; }
  issueKey(k: KeyEntry) { this.issueDialog = k; this.issueTo = ''; }
  confirmIssue() {
    if (!this.issueDialog) return;
    this.svc.updateKey(this.issueDialog.id, { status: 'issued', issued_to: this.issueTo, issued_at: new Date().toISOString(), issued_by: 'Reception' })
      .subscribe(() => { this.issueDialog = null; this.load(); });
  }
  returnKey(k: KeyEntry) {
    this.svc.updateKey(k.id, { status: 'available', returned_at: new Date().toISOString(), returned_to: 'Reception' })
      .subscribe(() => this.load());
  }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateKey(this.editing.id, this.form) : this.svc.createKey(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
}
