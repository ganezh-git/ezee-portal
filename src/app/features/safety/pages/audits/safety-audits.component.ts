import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, SafetyAudit } from '../../services/safety.service';

@Component({
  selector: 'app-safety-audits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Safety Audits</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">verified</span>New Audit</button>
      </div>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="stat-pill"><span class="material-icons-round">verified</span><strong>{{ totalAudits }}</strong> Total</div>
        <div class="stat-pill green"><span class="material-icons-round">check_circle</span><strong>{{ completed }}</strong> Completed</div>
        <div class="stat-pill blue"><span class="material-icons-round">schedule</span><strong>{{ scheduled }}</strong> Scheduled</div>
        <div class="stat-pill amber"><span class="material-icons-round">warning</span><strong>{{ criticalFindings }}</strong> Critical Findings</div>
        <div class="stat-pill purple"><span class="material-icons-round">speed</span>Avg Score: <strong>{{ avgScore }}%</strong></div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" placeholder="Search audits..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="internal">Internal</option><option value="external">External</option><option value="regulatory">Regulatory</option><option value="management">Management</option><option value="iso">ISO</option><option value="ohsas">OHSAS</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="follow_up">Follow Up</option></select>
      </div>

      <!-- Table -->
      <div class="table-wrap"><table>
        <thead><tr><th>Audit No.</th><th>Type</th><th>Department</th><th>Date</th><th>Auditor</th><th>Score</th><th>Findings</th><th>Critical</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          @for (a of audits; track a.id) {
            <tr [class.critical-row]="a.critical_findings > 0">
              <td class="mono">{{ a.audit_no }}</td>
              <td><span class="badge type" [attr.data-audit]="a.audit_type">{{ formatType(a.audit_type) }}</span></td>
              <td>{{ a.department }}</td>
              <td>{{ a.audit_date | date:'mediumDate' }}</td>
              <td>{{ a.auditor }}</td>
              <td><span class="score" [class.good]="a.score >= 80" [class.warn]="a.score >= 50 && a.score < 80" [class.bad]="a.score < 50 && a.score != null">{{ a.score != null ? a.score + '%' : '—' }}</span></td>
              <td>{{ a.findings ?? 0 }}</td>
              <td><span [class.nc-red]="a.critical_findings > 0">{{ a.critical_findings ?? 0 }}</span></td>
              <td><span class="badge" [attr.data-status]="a.status">{{ formatType(a.status) }}</span></td>
              <td>
                <button class="icon-btn" (click)="edit(a)" title="Edit"><span class="material-icons-round">edit</span></button>
                <button class="icon-btn" (click)="viewDetail(a)" title="View"><span class="material-icons-round">visibility</span></button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (!audits.length) { <p class="empty">No audits found</p> }
      </div>

      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page<=1" (click)="page=page-1;load()">Prev</button>
        <span>{{ page }}/{{ totalPages }}</span>
        <button [disabled]="page>=totalPages" (click)="page=page+1;load()">Next</button>
      </div>

      <!-- Form Dialog -->
      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog large" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update' : 'Schedule' }} Audit</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field"><label>Audit Type *</label><select [(ngModel)]="form.audit_type">
              <option value="internal">Internal</option><option value="external">External</option><option value="regulatory">Regulatory</option><option value="management">Management</option><option value="iso">ISO</option><option value="ohsas">OHSAS</option></select></div>
            <div class="field"><label>Date *</label><input type="date" [(ngModel)]="form.audit_date"></div>
            <div class="field"><label>Department *</label><input [(ngModel)]="form.department" placeholder="Department"></div>
            <div class="field"><label>Auditor *</label><input [(ngModel)]="form.auditor" placeholder="Auditor name"></div>
            <div class="field"><label>Score (%)</label><input type="number" [(ngModel)]="form.score" placeholder="0-100" min="0" max="100"></div>
            <div class="field"><label>Total Findings</label><input type="number" [(ngModel)]="form.findings" min="0"></div>
            <div class="field"><label>Critical Findings</label><input type="number" [(ngModel)]="form.critical_findings" min="0"></div>
            <div class="field"><label>Status</label><select [(ngModel)]="form.status">
              <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="follow_up">Follow Up</option></select></div>
            <div class="field full"><label>Summary / Observations</label><textarea [(ngModel)]="form.summary" rows="4" placeholder="Audit summary, key observations..."></textarea></div>
          </div></div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Create') }}</button>
          </div>
        </div></div>
      }

      <!-- Detail Dialog -->
      @if (showDetail && selected) {
        <div class="overlay" (click)="showDetail=false"><div class="dialog large" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>Audit {{ selected.audit_no }}</h2><button class="close-btn" (click)="showDetail=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body">
            <div class="detail-grid">
              <div class="detail-item"><label>Type</label><span class="badge type" [attr.data-audit]="selected.audit_type">{{ formatType(selected.audit_type) }}</span></div>
              <div class="detail-item"><label>Date</label><span>{{ selected.audit_date | date:'mediumDate' }}</span></div>
              <div class="detail-item"><label>Department</label><span>{{ selected.department }}</span></div>
              <div class="detail-item"><label>Auditor</label><span>{{ selected.auditor }}</span></div>
              <div class="detail-item"><label>Score</label><span class="score" [class.good]="selected.score >= 80" [class.warn]="selected.score >= 50 && selected.score < 80" [class.bad]="selected.score < 50">{{ selected.score != null ? selected.score + '%' : '—' }}</span></div>
              <div class="detail-item"><label>Findings</label><span>{{ selected.findings ?? 0 }}</span></div>
              <div class="detail-item"><label>Critical Findings</label><span class="nc-red">{{ selected.critical_findings ?? 0 }}</span></div>
              <div class="detail-item"><label>Status</label><span class="badge" [attr.data-status]="selected.status">{{ formatType(selected.status) }}</span></div>
              <div class="detail-item full" *ngIf="selected.summary"><label>Summary</label><p>{{ selected.summary }}</p></div>
            </div>
          </div>
        </div></div>
      }
    </div>
  `,
  styleUrls: ['./safety-audits.component.scss']
})
export class SafetyAuditsComponent implements OnInit {
  audits: SafetyAudit[] = [];
  total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  showForm = false; showDetail = false; saving = false;
  editing: SafetyAudit | null = null;
  selected: SafetyAudit | null = null;
  form: any = {};

  totalAudits = 0; completed = 0; scheduled = 0; criticalFindings = 0; avgScore = '0';

  get totalPages() { return Math.ceil(this.total / this.limit) || 1; }

  constructor(private svc: SafetyService, private cd: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.svc.getAudits({ page: this.page, limit: this.limit, search: this.search, audit_type: this.filterType, status: this.filterStatus }).subscribe(r => {
      this.audits = r.audits; this.total = r.total;
      this.totalAudits = r.total;
      this.completed = this.audits.filter(a => a.status === 'completed').length;
      this.scheduled = this.audits.filter(a => a.status === 'scheduled').length;
      this.criticalFindings = this.audits.reduce((s, a) => s + (a.critical_findings || 0), 0);
      const scored = this.audits.filter(a => a.score != null);
      this.avgScore = scored.length ? (scored.reduce((s, a) => s + a.score, 0) / scored.length).toFixed(0) : '0';
      this.cd.markForCheck();
    });
  }

  resetForm() {
    this.form = { audit_type: 'internal', audit_date: new Date().toISOString().split('T')[0], department: '', auditor: '', score: null, findings: 0, critical_findings: 0, status: 'scheduled', summary: '' };
  }

  edit(a: SafetyAudit) {
    this.editing = a;
    this.form = { ...a, audit_date: a.audit_date?.split('T')[0] };
    this.showForm = true;
  }

  viewDetail(a: SafetyAudit) { this.selected = a; this.showDetail = true; }

  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateAudit(this.editing.id, this.form) : this.svc.createAudit(this.form);
    obs.subscribe({ next: () => { this.showForm = false; this.saving = false; this.load(); this.cd.markForCheck(); }, error: () => { this.saving = false; this.cd.markForCheck(); } });
  }

  formatType(v: string) { return v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''; }
}
