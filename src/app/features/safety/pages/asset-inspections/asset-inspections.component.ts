import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, AssetInspection, SafetyAsset } from '../../services/safety.service';

@Component({
  selector: 'app-asset-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Asset Inspection Records</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">playlist_add_check</span>Record Inspection</button>
      </div>

      <!-- Overview Cards -->
      <div class="overview-strip">
        <div class="ov-card"><span class="material-icons-round green">check_circle</span><div><strong>{{ resultCounts.pass }}</strong><span>Passed</span></div></div>
        <div class="ov-card"><span class="material-icons-round red">cancel</span><div><strong>{{ resultCounts.fail }}</strong><span>Failed</span></div></div>
        <div class="ov-card"><span class="material-icons-round amber">help</span><div><strong>{{ resultCounts.conditional }}</strong><span>Conditional</span></div></div>
        <div class="ov-card"><span class="material-icons-round blue">schedule</span><div><strong>{{ resultCounts.scheduled }}</strong><span>Scheduled</span></div></div>
        <div class="ov-card"><span class="material-icons-round purple">warning</span><div><strong>{{ totalDefects }}</strong><span>Defects Found</span></div></div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" placeholder="Search inspections..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterType" (change)="load()"><option value="">All Types</option>
          <option value="periodic">Periodic</option><option value="pre_use">Pre-Use</option>
          <option value="post_incident">Post-Incident</option><option value="statutory">Statutory</option>
          <option value="third_party">Third Party</option><option value="commissioning">Commissioning</option></select>
        <select [(ngModel)]="filterResult" (change)="load()"><option value="">All Results</option>
          <option value="pass">Pass</option><option value="fail">Fail</option><option value="conditional">Conditional</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select>
      </div>

      <!-- Table -->
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Insp. No</th><th>Asset</th><th>Category</th><th>Type</th><th>Date</th>
          <th>Inspector</th><th>Result</th><th>Score</th><th>Defects</th><th>Next Due</th><th>Actions</th>
        </tr></thead>
        <tbody>
          @for (i of inspections; track i.id) {
            <tr [class.fail-row]="i.result === 'fail'" [class.cond-row]="i.result === 'conditional'">
              <td class="mono">{{ i.inspection_no }}</td>
              <td class="asset-cell">
                <strong>{{ i.asset_name }}</strong>
                <span class="sub">{{ i.asset_no }}</span>
              </td>
              <td><span class="badge cat">{{ formatType(i.asset_category || '') }}</span></td>
              <td><span class="badge type">{{ formatType(i.inspection_type) }}</span></td>
              <td>{{ i.inspection_date | date:'mediumDate' }}</td>
              <td>
                <span>{{ i.inspector_name || '—' }}</span>
                <span class="sub" *ngIf="i.inspector_company">{{ i.inspector_company }}</span>
              </td>
              <td><span class="badge" [attr.data-result]="i.result">{{ (i.result || '').toUpperCase() }}</span></td>
              <td>
                <span class="score" *ngIf="i.overall_score != null" [class.good]="i.overall_score >= 80" [class.warn]="i.overall_score >= 50 && i.overall_score < 80" [class.bad]="i.overall_score < 50">{{ i.overall_score }}%</span>
                <span *ngIf="i.overall_score == null">—</span>
              </td>
              <td>
                <span [class.defect-alert]="i.defects_found > 0">{{ i.defects_found || 0 }}</span>
                <span class="critical-count" *ngIf="i.critical_defects > 0"> ({{ i.critical_defects }} critical)</span>
              </td>
              <td>
                <span *ngIf="i.next_due_date" [class.overdue-text]="isOverdue(i.next_due_date)" [class.due-text]="isDueSoon(i.next_due_date)">{{ i.next_due_date | date:'mediumDate' }}</span>
                <span *ngIf="!i.next_due_date">—</span>
              </td>
              <td>
                <button class="icon-btn" (click)="edit(i)" title="Edit"><span class="material-icons-round">edit</span></button>
                <button class="icon-btn" (click)="viewDetail(i)" title="View"><span class="material-icons-round">visibility</span></button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (!inspections.length) { <p class="empty">No inspection records found</p> }
      </div>

      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page<=1" (click)="page=page-1;load()">Prev</button>
        <span>{{ page }}/{{ totalPages }}</span>
        <button [disabled]="page>=totalPages" (click)="page=page+1;load()">Next</button>
      </div>

      <!-- Form Dialog -->
      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog xl" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update' : 'Record' }} Asset Inspection</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field full"><label>Asset *</label>
              <select [(ngModel)]="form.asset_id" (ngModelChange)="onAssetChange()">
                <option [ngValue]="null">-- Select Asset --</option>
                @for (a of assetList; track a.id) { <option [ngValue]="a.id">{{ a.asset_no }} — {{ a.asset_name }} ({{ formatType(a.asset_category) }})</option> }
              </select>
            </div>
            <div class="field"><label>Inspection Type *</label><select [(ngModel)]="form.inspection_type">
              <option value="periodic">Periodic</option><option value="pre_use">Pre-Use</option>
              <option value="post_incident">Post-Incident</option><option value="statutory">Statutory</option>
              <option value="third_party">Third Party</option><option value="commissioning">Commissioning</option></select></div>
            <div class="field"><label>Inspection Date *</label><input type="date" [(ngModel)]="form.inspection_date"></div>
            <div class="field"><label>Next Due Date</label><input type="date" [(ngModel)]="form.next_due_date"></div>
            <div class="field"><label>Inspector Name</label><input [(ngModel)]="form.inspector_name" placeholder="Inspector name"></div>
            <div class="field"><label>Inspector Company</label><input [(ngModel)]="form.inspector_company" placeholder="Company / department"></div>
            <div class="field"><label>Certification / License</label><input [(ngModel)]="form.inspector_certification" placeholder="Cert number"></div>
            <div class="field"><label>Result *</label><select [(ngModel)]="form.result">
              <option value="pass">Pass</option><option value="fail">Fail</option><option value="conditional">Conditional</option><option value="na">N/A</option></select></div>
            <div class="field"><label>Overall Score (%)</label><input type="number" [(ngModel)]="form.overall_score" min="0" max="100"></div>
            <div class="field"><label>Defects Found</label><input type="number" [(ngModel)]="form.defects_found" min="0"></div>
            <div class="field"><label>Critical Defects</label><input type="number" [(ngModel)]="form.critical_defects" min="0"></div>
            <div class="field"><label>Status</label><select [(ngModel)]="form.status">
              <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
            <div class="field full"><label>Findings / Observations</label><textarea [(ngModel)]="form.findings" rows="3" placeholder="Inspection findings and observations..."></textarea></div>
            <div class="field full"><label>Corrective Actions Required</label><textarea [(ngModel)]="form.corrective_actions" rows="2" placeholder="Actions to be taken..."></textarea></div>
            <div class="field"><label>Certificate No</label><input [(ngModel)]="form.certificate_no" placeholder="Certificate number"></div>
            <div class="field"><label>Certificate Expiry</label><input type="date" [(ngModel)]="form.certificate_expiry"></div>
            <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2" placeholder="Any notes..."></textarea></div>
          </div></div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Record') }}</button>
          </div>
        </div></div>
      }

      <!-- Detail Dialog -->
      @if (showDetail && selected) {
        <div class="overlay" (click)="showDetail=false"><div class="dialog large" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>Inspection {{ selected.inspection_no }}</h2><button class="close-btn" (click)="showDetail=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body">
            <div class="detail-grid">
              <div class="detail-item"><label>Asset</label><span><strong>{{ selected.asset_name }}</strong> ({{ selected.asset_no }})</span></div>
              <div class="detail-item"><label>Category</label><span>{{ formatType(selected.asset_category || '') }}</span></div>
              <div class="detail-item"><label>Location</label><span>{{ selected.asset_location || '—' }}</span></div>
              <div class="detail-item"><label>Type</label><span class="badge type">{{ formatType(selected.inspection_type) }}</span></div>
              <div class="detail-item"><label>Date</label><span>{{ selected.inspection_date | date:'mediumDate' }}</span></div>
              <div class="detail-item"><label>Next Due</label><span>{{ selected.next_due_date | date:'mediumDate' }}</span></div>
              <div class="detail-item"><label>Inspector</label><span>{{ selected.inspector_name }}{{ selected.inspector_company ? ' (' + selected.inspector_company + ')' : '' }}</span></div>
              <div class="detail-item"><label>Certification</label><span>{{ selected.inspector_certification || '—' }}</span></div>
              <div class="detail-item"><label>Result</label><span class="badge lg" [attr.data-result]="selected.result">{{ (selected.result || '').toUpperCase() }}</span></div>
              <div class="detail-item"><label>Score</label><span class="score-lg" [class.good]="(selected.overall_score??0) >= 80">{{ selected.overall_score != null ? selected.overall_score + '%' : '—' }}</span></div>
              <div class="detail-item"><label>Defects</label><span [class.defect-alert]="selected.defects_found > 0">{{ selected.defects_found || 0 }} total, {{ selected.critical_defects || 0 }} critical</span></div>
              <div class="detail-item"><label>Certificate</label><span>{{ selected.certificate_no || '—' }}{{ selected.certificate_expiry ? ' (exp ' + (selected.certificate_expiry | date:'mediumDate') + ')' : '' }}</span></div>
              <div class="detail-item full" *ngIf="selected.findings"><label>Findings</label><p>{{ selected.findings }}</p></div>
              <div class="detail-item full" *ngIf="selected.corrective_actions"><label>Corrective Actions</label><p>{{ selected.corrective_actions }}</p></div>
              <div class="detail-item full" *ngIf="selected.remarks"><label>Remarks</label><p>{{ selected.remarks }}</p></div>
            </div>
          </div>
        </div></div>
      }
    </div>
  `,
  styleUrls: ['./asset-inspections.component.scss']
})
export class AssetInspectionsComponent implements OnInit {
  inspections: AssetInspection[] = [];
  assetList: SafetyAsset[] = [];
  total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterResult = ''; filterStatus = '';
  showForm = false; showDetail = false; saving = false;
  editing: AssetInspection | null = null;
  selected: AssetInspection | null = null;
  form: any = {};

  resultCounts = { pass: 0, fail: 0, conditional: 0, scheduled: 0 };
  totalDefects = 0;

  get totalPages() { return Math.ceil(this.total / this.limit) || 1; }

  constructor(private svc: SafetyService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
    this.svc.getAssets({ limit: 200 }).subscribe(r => { this.assetList = r.assets; this.cd.markForCheck(); });
  }

  load() {
    this.svc.getAssetInspections({ page: this.page, limit: this.limit, search: this.search, inspection_type: this.filterType, result: this.filterResult, status: this.filterStatus }).subscribe(r => {
      this.inspections = r.inspections; this.total = r.total;
      this.resultCounts = {
        pass: this.inspections.filter(i => i.result === 'pass').length,
        fail: this.inspections.filter(i => i.result === 'fail').length,
        conditional: this.inspections.filter(i => i.result === 'conditional').length,
        scheduled: this.inspections.filter(i => i.status === 'scheduled').length,
      };
      this.totalDefects = this.inspections.reduce((s, i) => s + (i.defects_found || 0), 0);
      this.cd.markForCheck();
    });
  }

  isOverdue(d: string) { return d && new Date(d) < new Date(); }
  isDueSoon(d: string) { if (!d) return false; const diff = new Date(d).getTime() - Date.now(); return diff > 0 && diff < 30 * 86400000; }

  resetForm() {
    this.form = {
      asset_id: null, inspection_type: 'periodic',
      inspection_date: new Date().toISOString().split('T')[0], next_due_date: '',
      inspector_name: '', inspector_company: '', inspector_certification: '',
      findings: '', defects_found: 0, critical_defects: 0, corrective_actions: '',
      result: 'pass', overall_score: null, certificate_no: '', certificate_expiry: '',
      status: 'completed', remarks: ''
    };
  }

  onAssetChange() {
    const asset = this.assetList.find(a => a.id === this.form.asset_id);
    if (asset && asset.inspection_frequency_days) {
      const d = new Date(this.form.inspection_date);
      d.setDate(d.getDate() + asset.inspection_frequency_days);
      this.form.next_due_date = d.toISOString().split('T')[0];
    }
  }

  edit(i: AssetInspection) {
    this.editing = i;
    this.form = {
      ...i,
      inspection_date: i.inspection_date?.split('T')[0] || '',
      next_due_date: i.next_due_date?.split('T')[0] || '',
      certificate_expiry: i.certificate_expiry?.split('T')[0] || '',
    };
    this.showForm = true;
  }

  viewDetail(i: AssetInspection) { this.selected = i; this.showDetail = true; }

  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateAssetInspection(this.editing.id, this.form) : this.svc.createAssetInspection(this.form);
    obs.subscribe({
      next: () => { this.showForm = false; this.saving = false; this.load(); this.cd.markForCheck(); },
      error: () => { this.saving = false; this.cd.markForCheck(); }
    });
  }

  formatType(v: string) { return v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''; }
}
