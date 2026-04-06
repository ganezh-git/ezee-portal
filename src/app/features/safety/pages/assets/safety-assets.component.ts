import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, SafetyAsset, AssetInspection } from '../../services/safety.service';

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  ladder: { label: 'Ladder', icon: 'stairs', color: '#f59e0b' },
  welding_machine: { label: 'Welding Machine', icon: 'local_fire_department', color: '#ef4444' },
  electrical_panel: { label: 'Electrical Panel', icon: 'electrical_services', color: '#3b82f6' },
  lift: { label: 'Lift / Elevator', icon: 'elevator', color: '#8b5cf6' },
  crane: { label: 'Crane', icon: 'precision_manufacturing', color: '#0ea5e9' },
  hoist: { label: 'Hoist', icon: 'upload', color: '#06b6d4' },
  pressure_vessel: { label: 'Pressure Vessel', icon: 'propane_tank', color: '#dc2626' },
  fire_extinguisher: { label: 'Fire Extinguisher', icon: 'fire_extinguisher', color: '#ef4444' },
  gas_detector: { label: 'Gas Detector', icon: 'sensors', color: '#f97316' },
  scaffold: { label: 'Scaffold', icon: 'view_column', color: '#64748b' },
  harness: { label: 'Safety Harness', icon: 'paragliding', color: '#10b981' },
  grinding_machine: { label: 'Grinding Machine', icon: 'build_circle', color: '#78716c' },
  compressor: { label: 'Compressor', icon: 'air', color: '#0284c7' },
  forklift: { label: 'Forklift', icon: 'forklift', color: '#ca8a04' },
  generator: { label: 'Generator', icon: 'bolt', color: '#eab308' },
  exhaust_fan: { label: 'Exhaust Fan', icon: 'mode_fan_off', color: '#6b7280' },
  ppe_kit: { label: 'PPE Kit', icon: 'masks', color: '#10b981' },
  first_aid_kit: { label: 'First Aid Kit', icon: 'medical_services', color: '#ef4444' },
  emergency_light: { label: 'Emergency Light', icon: 'flashlight_on', color: '#f59e0b' },
  safety_shower: { label: 'Safety Shower', icon: 'shower', color: '#0ea5e9' },
  eyewash_station: { label: 'Eyewash Station', icon: 'visibility', color: '#14b8a6' },
  other: { label: 'Other', icon: 'category', color: '#64748b' },
};

@Component({
  selector: 'app-safety-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Safety Assets Management</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add_box</span>Register Asset</button>
      </div>

      <!-- Stats Strip -->
      <div class="asset-stats">
        <div class="stat-chip"><span class="material-icons-round">inventory_2</span><strong>{{ assetStats?.total ?? 0 }}</strong> Total Assets</div>
        <div class="stat-chip green"><span class="material-icons-round">verified</span><strong>{{ assetStats?.valid ?? 0 }}</strong> Valid</div>
        <div class="stat-chip amber"><span class="material-icons-round">schedule</span><strong>{{ assetStats?.due ?? 0 }}</strong> Due</div>
        <div class="stat-chip red"><span class="material-icons-round">warning</span><strong>{{ assetStats?.overdue ?? 0 }}</strong> Overdue</div>
        <div class="stat-chip dark"><span class="material-icons-round">block</span><strong>{{ assetStats?.failed ?? 0 }}</strong> Failed</div>
        <div class="stat-chip purple"><span class="material-icons-round">category</span><strong>{{ assetStats?.categories ?? 0 }}</strong> Categories</div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" placeholder="Search assets..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterCategory" (change)="load()"><option value="">All Categories</option>
          @for (cat of categories; track cat.key) { <option [value]="cat.key">{{ cat.label }}</option> }
        </select>
        <select [(ngModel)]="filterInspStatus" (change)="load()"><option value="">All Inspection Status</option>
          <option value="valid">Valid</option><option value="due">Due</option><option value="overdue">Overdue</option><option value="failed">Failed</option><option value="not_inspected">Not Inspected</option></select>
        <select [(ngModel)]="filterCondition" (change)="load()"><option value="">All Conditions</option>
          <option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="condemned">Condemned</option><option value="under_repair">Under Repair</option></select>
      </div>

      <!-- Asset Cards Grid -->
      <div class="asset-grid">
        @for (a of assets; track a.id) {
          <div class="asset-card" [class.overdue]="a.inspection_status === 'overdue'" [class.due]="a.inspection_status === 'due'" [class.failed]="a.inspection_status === 'failed' || a.condition_status === 'condemned'">
            <div class="asset-card-header">
              <span class="cat-icon" [style.color]="getCatMeta(a.asset_category).color"><span class="material-icons-round">{{ getCatMeta(a.asset_category).icon }}</span></span>
              <div class="asset-title">
                <h3>{{ a.asset_name }}</h3>
                <span class="asset-no">{{ a.asset_no }}</span>
              </div>
              <div class="card-actions">
                <button class="icon-btn" (click)="viewDetail(a)" title="View Detail"><span class="material-icons-round">visibility</span></button>
                <button class="icon-btn" (click)="edit(a)" title="Edit"><span class="material-icons-round">edit</span></button>
              </div>
            </div>
            <div class="asset-meta">
              <span><span class="material-icons-round">label</span>{{ getCatMeta(a.asset_category).label }}</span>
              <span *ngIf="a.make"><span class="material-icons-round">factory</span>{{ a.make }} {{ a.model }}</span>
              <span *ngIf="a.location"><span class="material-icons-round">location_on</span>{{ a.location }}</span>
              <span *ngIf="a.department"><span class="material-icons-round">domain</span>{{ a.department }}</span>
            </div>
            <div class="asset-inspection-bar">
              <div class="insp-left">
                <span class="badge" [attr.data-insp]="a.inspection_status">{{ formatType(a.inspection_status) }}</span>
                <span class="badge" [attr.data-cond]="a.condition_status">{{ formatType(a.condition_status) }}</span>
              </div>
              <div class="insp-right">
                <span class="next-insp" *ngIf="a.next_inspection_date">
                  Next: {{ a.next_inspection_date | date:'mediumDate' }}
                  <span class="days-tag" [class.urgent]="getDaysUntil(a.next_inspection_date) <= 0" [class.soon]="getDaysUntil(a.next_inspection_date) > 0 && getDaysUntil(a.next_inspection_date) <= 30">
                    {{ getDaysLabel(a.next_inspection_date) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      @if (!assets.length) { <p class="empty">No assets found</p> }

      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page<=1" (click)="page=page-1;load()">Prev</button>
        <span>{{ page }}/{{ totalPages }}</span>
        <button [disabled]="page>=totalPages" (click)="page=page+1;load()">Next</button>
      </div>

      <!-- Form Dialog -->
      @if (showForm) {
        <div class="overlay" (click)="showForm=false"><div class="dialog xl" (click)="$event.stopPropagation()">
          <div class="dialog-header"><h2>{{ editing ? 'Update' : 'Register' }} Safety Asset</h2><button class="close-btn" (click)="showForm=false"><span class="material-icons-round">close</span></button></div>
          <div class="dialog-body"><div class="form-grid">
            <div class="field full"><label>Asset Name *</label><input [(ngModel)]="form.asset_name" placeholder="e.g. Aluminium Extension Ladder 6m"></div>
            <div class="field"><label>Category *</label><select [(ngModel)]="form.asset_category">
              @for (cat of categories; track cat.key) { <option [value]="cat.key">{{ cat.label }}</option> }
            </select></div>
            <div class="field"><label>Make / Manufacturer</label><input [(ngModel)]="form.make" placeholder="e.g. Werner, ESAB"></div>
            <div class="field"><label>Model</label><input [(ngModel)]="form.model" placeholder="Model name/number"></div>
            <div class="field"><label>Serial Number</label><input [(ngModel)]="form.serial_no" placeholder="Serial / batch number"></div>
            <div class="field"><label>Purchase Date</label><input type="date" [(ngModel)]="form.purchase_date"></div>
            <div class="field"><label>Warranty Expiry</label><input type="date" [(ngModel)]="form.warranty_expiry"></div>
            <div class="field"><label>Department</label><input [(ngModel)]="form.department" placeholder="Department"></div>
            <div class="field"><label>Location *</label><input [(ngModel)]="form.location" placeholder="Physical location"></div>
            <div class="field"><label>Assigned To</label><input [(ngModel)]="form.assigned_to" placeholder="Person / team"></div>
            <div class="field"><label>Rated Capacity</label><input [(ngModel)]="form.rated_capacity" placeholder="e.g. 150 kg, 10T, 500 kVA"></div>
            <div class="field"><label>Inspection Frequency (Days)</label><input type="number" [(ngModel)]="form.inspection_frequency_days" min="1"></div>
            <div class="field"><label>Last Inspection Date</label><input type="date" [(ngModel)]="form.last_inspection_date"></div>
            <div class="field"><label>Next Inspection Date</label><input type="date" [(ngModel)]="form.next_inspection_date"></div>
            <div class="field"><label>Inspection Status</label><select [(ngModel)]="form.inspection_status">
              <option value="not_inspected">Not Inspected</option><option value="valid">Valid</option><option value="due">Due</option><option value="overdue">Overdue</option><option value="failed">Failed</option>
            </select></div>
            <div class="field"><label>Condition</label><select [(ngModel)]="form.condition_status">
              <option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="condemned">Condemned</option><option value="under_repair">Under Repair</option>
            </select></div>
            <div class="field full"><label>Specifications / Description</label><textarea [(ngModel)]="form.specifications" rows="3" placeholder="Technical specifications, ratings, certifications..."></textarea></div>
            <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2" placeholder="Any additional notes"></textarea></div>
          </div></div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Register') }}</button>
          </div>
        </div></div>
      }

      <!-- Detail Dialog -->
      @if (showDetail && selected) {
        <div class="overlay" (click)="showDetail=false"><div class="dialog xl" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <div class="detail-title-row">
              <span class="cat-icon lg" [style.color]="getCatMeta(selected.asset_category).color"><span class="material-icons-round">{{ getCatMeta(selected.asset_category).icon }}</span></span>
              <div><h2>{{ selected.asset_name }}</h2><span class="asset-no">{{ selected.asset_no }}</span></div>
            </div>
            <button class="close-btn" (click)="showDetail=false"><span class="material-icons-round">close</span></button>
          </div>
          <div class="dialog-body">
            <div class="detail-grid">
              <div class="detail-item"><label>Category</label><span>{{ getCatMeta(selected.asset_category).label }}</span></div>
              <div class="detail-item"><label>Make / Model</label><span>{{ selected.make }} {{ selected.model }}</span></div>
              <div class="detail-item"><label>Serial No</label><span class="mono">{{ selected.serial_no || '—' }}</span></div>
              <div class="detail-item"><label>Purchase Date</label><span>{{ selected.purchase_date | date:'mediumDate' }}</span></div>
              <div class="detail-item"><label>Warranty Expiry</label><span>{{ selected.warranty_expiry | date:'mediumDate' }}</span></div>
              <div class="detail-item"><label>Department</label><span>{{ selected.department }}</span></div>
              <div class="detail-item"><label>Location</label><span>{{ selected.location }}</span></div>
              <div class="detail-item"><label>Assigned To</label><span>{{ selected.assigned_to || '—' }}</span></div>
              <div class="detail-item"><label>Rated Capacity</label><span>{{ selected.rated_capacity || '—' }}</span></div>
              <div class="detail-item"><label>Inspection Freq</label><span>Every {{ selected.inspection_frequency_days }} days</span></div>
              <div class="detail-item"><label>Inspection Status</label><span class="badge" [attr.data-insp]="selected.inspection_status">{{ formatType(selected.inspection_status) }}</span></div>
              <div class="detail-item"><label>Condition</label><span class="badge" [attr.data-cond]="selected.condition_status">{{ formatType(selected.condition_status) }}</span></div>
              <div class="detail-item full" *ngIf="selected.specifications"><label>Specifications</label><p>{{ selected.specifications }}</p></div>
            </div>

            <!-- Inspection History -->
            <div class="history-section">
              <h3><span class="material-icons-round">history</span> Inspection History</h3>
              @if (detailInspections.length) {
                <div class="history-timeline">
                  @for (insp of detailInspections; track insp.id) {
                    <div class="timeline-item" [attr.data-result]="insp.result">
                      <div class="timeline-dot"><span class="material-icons-round">{{ insp.result === 'pass' ? 'check_circle' : insp.result === 'fail' ? 'cancel' : 'help' }}</span></div>
                      <div class="timeline-content">
                        <div class="timeline-header">
                          <strong>{{ insp.inspection_no }}</strong>
                          <span class="badge type">{{ formatType(insp.inspection_type) }}</span>
                          <span class="badge" [attr.data-result]="insp.result">{{ insp.result?.toUpperCase() }}</span>
                          <span class="timeline-date">{{ insp.inspection_date | date:'mediumDate' }}</span>
                        </div>
                        <div class="timeline-details" *ngIf="insp.inspector_name">Inspector: {{ insp.inspector_name }}{{ insp.inspector_company ? ' (' + insp.inspector_company + ')' : '' }}</div>
                        <div class="timeline-details" *ngIf="insp.findings">{{ insp.findings }}</div>
                        <div class="timeline-details" *ngIf="insp.corrective_actions"><strong>Actions:</strong> {{ insp.corrective_actions }}</div>
                        <div class="timeline-details" *ngIf="insp.certificate_no">Cert: {{ insp.certificate_no }} (exp {{ insp.certificate_expiry | date:'mediumDate' }})</div>
                        <div class="timeline-score" *ngIf="insp.overall_score != null">Score: <strong>{{ insp.overall_score }}%</strong></div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="empty">No inspections recorded yet</p>
              }
            </div>
          </div>
        </div></div>
      }
    </div>
  `,
  styleUrls: ['./safety-assets.component.scss']
})
export class SafetyAssetsComponent implements OnInit {
  assets: SafetyAsset[] = [];
  total = 0; page = 1; limit = 20;
  search = ''; filterCategory = ''; filterInspStatus = ''; filterCondition = '';
  showForm = false; showDetail = false; saving = false;
  editing: SafetyAsset | null = null;
  selected: SafetyAsset | null = null;
  detailInspections: AssetInspection[] = [];
  form: any = {};
  assetStats: any = {};

  categories = Object.entries(CATEGORY_META).map(([key, val]) => ({ key, ...val }));

  get totalPages() { return Math.ceil(this.total / this.limit) || 1; }

  constructor(private svc: SafetyService, private cd: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.svc.getAssets({ page: this.page, limit: this.limit, search: this.search, category: this.filterCategory, inspection_status: this.filterInspStatus, condition_status: this.filterCondition }).subscribe(r => {
      this.assets = r.assets; this.total = r.total; this.assetStats = r.stats;
      this.cd.markForCheck();
    });
  }

  getCatMeta(cat: string) { return CATEGORY_META[cat] || CATEGORY_META['other']; }

  getDaysUntil(dateStr: string): number {
    if (!dateStr) return 999;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / 86400000);
  }

  getDaysLabel(dateStr: string): string {
    const days = this.getDaysUntil(dateStr);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    return `${days}d`;
  }

  resetForm() {
    this.form = {
      asset_name: '', asset_category: 'other', make: '', model: '', serial_no: '',
      purchase_date: '', warranty_expiry: '', department: '', location: '', assigned_to: '',
      rated_capacity: '', specifications: '', inspection_frequency_days: 90,
      last_inspection_date: '', next_inspection_date: '',
      inspection_status: 'not_inspected', condition_status: 'good', remarks: ''
    };
  }

  edit(a: SafetyAsset) {
    this.editing = a;
    this.form = {
      ...a,
      purchase_date: a.purchase_date?.split('T')[0] || '',
      warranty_expiry: a.warranty_expiry?.split('T')[0] || '',
      last_inspection_date: a.last_inspection_date?.split('T')[0] || '',
      next_inspection_date: a.next_inspection_date?.split('T')[0] || '',
    };
    this.showForm = true;
  }

  viewDetail(a: SafetyAsset) {
    this.selected = a; this.detailInspections = [];
    this.showDetail = true;
    this.svc.getAsset(a.id).subscribe(r => {
      this.selected = r;
      this.detailInspections = r.inspections || [];
      this.cd.markForCheck();
    });
  }

  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateAsset(this.editing.id, this.form) : this.svc.createAsset(this.form);
    obs.subscribe({
      next: () => { this.showForm = false; this.saving = false; this.load(); this.cd.markForCheck(); },
      error: () => { this.saving = false; this.cd.markForCheck(); }
    });
  }

  formatType(v: string) { return v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''; }
}
