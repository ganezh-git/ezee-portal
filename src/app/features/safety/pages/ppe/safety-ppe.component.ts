import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, PpeRecord } from '../../services/safety.service';

@Component({
  selector: 'app-safety-ppe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>PPE Tracker</h1>
        <button class="btn btn-primary" (click)="showForm=true;editing=null;resetForm()"><span class="material-icons-round">masks</span>Issue PPE</button>
      </div>

      <!-- PPE Summary Cards -->
      <div class="ppe-summary" *ngIf="summary.length">
        @for (s of summary; track s.ppe_item) {
          <div class="ppe-sum-card">
            <span class="material-icons-round ppe-icon">{{ ppeIcon(s.ppe_item) }}</span>
            <div class="ppe-sum-name">{{ s.ppe_item }}</div>
            <div class="ppe-sum-stats">
              <span>Issued: {{ s.total_issued }}</span>
              <span class="active">Active: {{ s.active }}</span>
              <span class="expired" *ngIf="s.expired > 0">Expired: {{ s.expired }}</span>
            </div>
          </div>
        }
      </div>

      <div class="filters">
        <input type="text" placeholder="Search employee, PPE item..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterItem" (change)="load()"><option value="">All PPE Items</option>
          <option *ngFor="let p of ppeItems" [value]="p">{{ p }}</option></select>
      </div>

      <div class="table-wrap"><table>
        <thead><tr><th>Employee</th><th>ID</th><th>Dept</th><th>PPE Item</th><th>Qty</th><th>Issued</th><th>Expiry</th><th>Condition</th><th>Returned</th><th>Actions</th></tr></thead>
        <tbody>
          @for (r of records; track r.id) {
            <tr [class.expired-row]="isExpired(r)">
              <td>{{ r.employee_name }}</td>
              <td class="mono">{{ r.employee_id || '—' }}</td>
              <td>{{ r.department || '—' }}</td>
              <td><span class="material-icons-round ppe-tbl-icon">{{ ppeIcon(r.ppe_item) }}</span>{{ r.ppe_item }}</td>
              <td>{{ r.quantity }}</td>
              <td>{{ r.issue_date | date:'mediumDate' }}</td>
              <td [class.expiry-warn]="isExpiringSoon(r)" [class.expiry-danger]="isExpired(r)">{{ r.expiry_date ? (r.expiry_date | date:'mediumDate') : '—' }}</td>
              <td><span class="badge" [attr.data-cond]="r.condition_on_issue">{{ r.condition_on_issue }}</span></td>
              <td>{{ r.returned_date ? (r.returned_date | date:'mediumDate') : '—' }}</td>
              <td><button class="icon-btn" (click)="edit(r)"><span class="material-icons-round">edit</span></button></td>
            </tr>
          }
        </tbody>
      </table>
      @if (!records.length) { <p class="empty">No PPE records found</p> }
      </div>
      <div class="pagination" *ngIf="total>limit"><button [disabled]="page<=1" (click)="page=page-1;load()">Prev</button><span>{{ page }}/{{ totalPages }}</span><button [disabled]="page>=totalPages" (click)="page=page+1;load()">Next</button></div>

      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update PPE Record' : 'Issue PPE' }}</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field"><label>Employee Name *</label><input [(ngModel)]="form.employee_name"></div>
            <div class="field"><label>Employee ID</label><input [(ngModel)]="form.employee_id"></div>
            <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
            <div class="field"><label>PPE Item *</label><select [(ngModel)]="form.ppe_item"><option *ngFor="let p of ppeItems" [value]="p">{{ p }}</option></select></div>
            <div class="field"><label>Quantity</label><input type="number" [(ngModel)]="form.quantity" min="1"></div>
            <div class="field"><label>Issue Date *</label><input type="date" [(ngModel)]="form.issue_date"></div>
            <div class="field"><label>Expiry Date</label><input type="date" [(ngModel)]="form.expiry_date"></div>
            <div class="field"><label>Condition</label><select [(ngModel)]="form.condition_on_issue"><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option></select></div>
            @if (editing) {
              <div class="field"><label>Return Date</label><input type="date" [(ngModel)]="form.returned_date"></div>
              <div class="field"><label>Return Condition</label><select [(ngModel)]="form.condition_on_return"><option value="">—</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option><option value="lost">Lost</option></select></div>
            }
            <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
          </div></div>
          <div class="dialog-footer"><button class="btn btn-secondary" (click)="showForm=false">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving?'Saving...':'Save' }}</button></div>
        </div></div>
      }
    </div>
  `,
  styleUrl: './safety-ppe.component.scss',
})
export class SafetyPpeComponent implements OnInit {
  records: PpeRecord[] = []; total = 0; page = 1; limit = 20; summary: any[] = [];
  search = ''; filterItem = '';
  showForm = false; saving = false; editing: PpeRecord | null = null; form: any = {};
  ppeItems = ['Safety Helmet', 'Safety Shoes', 'Safety Goggles', 'Ear Plugs', 'Gloves', 'Hi-Vis Vest', 'Face Shield', 'Respirator', 'Harness', 'Fire Suit', 'Dust Mask', 'Welding Shield', 'Chemical Suit', 'Knee Pads'];
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getPpe({ search: this.search, item: this.filterItem, page: this.page }).subscribe(r => { this.records = r.records; this.total = r.total; this.summary = r.summary || []; this.cdr.markForCheck(); }); }
  resetForm() { this.form = { employee_name: '', employee_id: '', department: '', ppe_item: 'Safety Helmet', quantity: 1, issue_date: new Date().toISOString().slice(0, 10), expiry_date: '', condition_on_issue: 'new', returned_date: '', condition_on_return: '', remarks: '' }; }
  edit(r: PpeRecord) { this.editing = r; this.form = { ...r }; this.showForm = true; }
  save() { this.saving = true; const o = this.editing ? this.svc.updatePpe(this.editing.id, this.form) : this.svc.createPpe(this.form); o.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } }); }
  isExpired(r: PpeRecord) { return r.expiry_date && !r.returned_date && new Date(r.expiry_date) < new Date(); }
  isExpiringSoon(r: PpeRecord) { if (!r.expiry_date || r.returned_date) return false; const d = new Date(r.expiry_date); const now = new Date(); return d > now && d.getTime() - now.getTime() < 30 * 86400000; }
  ppeIcon(item: string) { const m: Record<string, string> = { 'Safety Helmet': 'hard_hat', 'Safety Shoes': 'footprint', 'Safety Goggles': 'visibility', 'Ear Plugs': 'hearing', 'Gloves': 'pan_tool', 'Hi-Vis Vest': 'checkroom', 'Face Shield': 'face_retouching_natural', 'Respirator': 'masks', 'Harness': 'accessibility', 'Fire Suit': 'local_fire_department' }; return m[item] || 'masks'; }
}
