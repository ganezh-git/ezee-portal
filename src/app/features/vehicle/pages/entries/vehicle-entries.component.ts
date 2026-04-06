import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VehicleService, VehicleEntry, Dock } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-entries',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">local_shipping</span> Vehicle Entries</h1>
        <button class="btn-primary" (click)="showForm = !showForm">
          <span class="material-icons-round">{{ showForm ? 'close' : 'add_circle' }}</span> {{ showForm ? 'Cancel' : 'New Entry' }}
        </button>
      </div>

      <!-- Success Banner -->
      @if (successMsg) {
        <div class="alert success">
          <span class="material-icons-round">check_circle</span> {{ successMsg }}
          <button class="close-alert" (click)="successMsg=''"><span class="material-icons-round">close</span></button>
        </div>
      }

      <!-- New Entry Form -->
      @if (showForm) {
        <div class="form-card">
          <h2><span class="material-icons-round">add_circle</span> Record New Vehicle Entry</h2>

          <!-- Quick Lookup -->
          <div class="section-header"><span class="material-icons-round">search</span> Quick Lookup</div>
          <div class="lookup-bar">
            <div class="field">
              <label>Phone Number</label>
              <div class="input-with-btn">
                <input [(ngModel)]="lookupPhone" placeholder="Driver/contact phone" (keyup.enter)="doLookup('phone')" />
                <button class="btn-sm" (click)="doLookup('phone')" [disabled]="!lookupPhone"><span class="material-icons-round">person_search</span></button>
              </div>
            </div>
            <div class="field">
              <label>Vehicle Number</label>
              <div class="input-with-btn">
                <input [(ngModel)]="lookupVehicle" placeholder="e.g. PB10AB1234" (keyup.enter)="doLookup('vehicle')" />
                <button class="btn-sm" (click)="doLookup('vehicle')" [disabled]="!lookupVehicle"><span class="material-icons-round">directions_car</span></button>
              </div>
            </div>
            @if (lookupMsg) {
              <div class="lookup-msg" [class.found]="lookupFound">
                <span class="material-icons-round">{{ lookupFound ? 'check_circle' : 'info' }}</span> {{ lookupMsg }}
              </div>
            }
          </div>

          <!-- Vehicle & Driver Info -->
          <div class="section-header"><span class="material-icons-round">directions_car</span> Vehicle & Driver Information</div>
          <div class="form-grid">
            <div class="field"><label>Vehicle No *</label><input [(ngModel)]="form.vehicle_no" placeholder="e.g. PB10AB1234" /></div>
            <div class="field"><label>Vehicle Type</label>
              <select [(ngModel)]="form.vehicle_type">
                <option value="truck">Truck</option><option value="van">Van</option><option value="car">Car</option>
                <option value="two_wheeler">Two Wheeler</option><option value="auto">Auto</option><option value="other">Other</option>
              </select>
            </div>
            <div class="field"><label>Visitor Type</label>
              <select [(ngModel)]="form.visitor_type">
                <option value="visitor">Visitor</option><option value="vendor">Vendor</option><option value="amc_vendor">AMC Vendor</option>
                <option value="oem_vendor">OEM Vendor</option><option value="employee">Visiting Employee</option><option value="contractor">Contractor</option><option value="other">Other</option>
              </select>
            </div>
            <div class="field"><label>Driver Name *</label><input [(ngModel)]="form.driver_name" placeholder="Driver name" /></div>
            <div class="field"><label>Driver Phone</label><input [(ngModel)]="form.driver_phone" placeholder="Phone number" /></div>
            <div class="field"><label>Contact Phone</label><input [(ngModel)]="form.contact_phone" placeholder="Alternate contact" /></div>
            <div class="field"><label>ID Type</label>
              <select [(ngModel)]="form.driver_id_type">
                <option value="">— Select —</option><option value="aadhar">Aadhar Card</option><option value="driving_license">Driving License</option>
                <option value="pan">PAN Card</option><option value="voter_id">Voter ID</option><option value="passport">Passport</option><option value="company_id">Company ID</option>
              </select>
            </div>
            <div class="field"><label>ID Number</label><input [(ngModel)]="form.driver_id_number" placeholder="ID proof number" /></div>
            <div class="field"><label>Company</label><input [(ngModel)]="form.company" placeholder="Company / vendor name" /></div>
          </div>

          <!-- Visit Details -->
          <div class="section-header"><span class="material-icons-round">assignment</span> Visit Details</div>
          <div class="form-grid">
            <div class="field"><label>Purpose *</label>
              <select [(ngModel)]="form.purpose">
                <option value="delivery">Delivery</option><option value="pickup">Pickup</option><option value="service">Service</option>
                <option value="visitor">Visitor</option><option value="maintenance">Maintenance</option><option value="other">Other</option>
              </select>
            </div>
            <div class="field"><label>Department *</label><input [(ngModel)]="form.department" placeholder="Department" /></div>
            <div class="field"><label>Dock</label>
              <select [(ngModel)]="form.dock_id"><option [ngValue]="null">— None —</option>
                @for (d of docks; track d.id) { <option [ngValue]="d.id">{{ d.dock_name }} ({{ d.dock_type }})</option> }
              </select>
            </div>
            <div class="field"><label>PO Reference</label><input [(ngModel)]="form.po_reference" placeholder="PO / SO number" /></div>
            <div class="field full"><label>Material Description</label><textarea [(ngModel)]="form.material_desc" rows="2" placeholder="What materials?"></textarea></div>
            <div class="field"><label>In Weight (kg)</label><input type="number" [(ngModel)]="form.in_weight" placeholder="Weight at entry" /></div>
          </div>

          <!-- Host Information -->
          <div class="section-header"><span class="material-icons-round">person_pin</span> Host Information</div>
          <div class="form-grid">
            <div class="field"><label>Host Name</label><input [(ngModel)]="form.host_name" placeholder="Person to meet" /></div>
            <div class="field"><label>Host Department</label><input [(ngModel)]="form.host_department" placeholder="Host's department" /></div>
            <div class="field"><label>Host Phone</label><input [(ngModel)]="form.host_phone" placeholder="Host contact" /></div>
          </div>

          <!-- Security & PPE -->
          <div class="section-header"><span class="material-icons-round">security</span> Security & PPE</div>
          <div class="form-grid">
            <div class="field"><label>Plant Entry</label>
              <select [(ngModel)]="form.plant_entry">
                <option value="permitted">Permitted</option><option value="not_permitted">Not Permitted</option><option value="restricted">Restricted Area Only</option>
              </select>
            </div>
            <div class="field"><label>PPE Issued</label><input [(ngModel)]="form.ppe_issued" placeholder="e.g. Helmet, Shoes, Vest" /></div>
            <div class="field"><label>Security Guard (In)</label><input [(ngModel)]="form.security_in" placeholder="Guard name" /></div>
          </div>

          <!-- Additional Info -->
          <div class="section-header"><span class="material-icons-round">more_horiz</span> Additional Information</div>
          <div class="form-grid">
            <div class="field">
              <label>Food Required</label>
              <div class="inline-row">
                <select [(ngModel)]="form.food_required">
                  <option value="no">No</option><option value="yes">Yes</option>
                </select>
                @if (form.food_required === 'yes') {
                  <input type="number" [(ngModel)]="form.food_count" min="1" placeholder="Count" class="small-input" />
                }
              </div>
            </div>
            <div class="field full"><label>Special Instructions</label><textarea [(ngModel)]="form.special_instructions" rows="2" placeholder="Any special instructions or safety notes"></textarea></div>
            <div class="field full"><label>Security Remarks</label><textarea [(ngModel)]="form.security_remarks" rows="2" placeholder="Any observations by security"></textarea></div>
          </div>

          <div class="form-actions">
            <button class="btn-outline" (click)="showForm=false">Cancel</button>
            <button class="btn-primary" (click)="createEntry()" [disabled]="saving || !form.vehicle_no || !form.driver_name || !form.department">
              <span class="material-icons-round">save</span> {{ saving ? 'Saving...' : 'Record Entry' }}
            </button>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterStatus" (ngModelChange)="loadEntries()">
          <option value="">All Status</option><option value="in">In</option><option value="docked">Docked</option>
          <option value="loading">Loading</option><option value="unloading">Unloading</option><option value="out">Out</option>
        </select>
        <select [(ngModel)]="filterPurpose" (ngModelChange)="loadEntries()">
          <option value="">All Purpose</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option>
          <option value="service">Service</option><option value="visitor">Visitor</option><option value="maintenance">Maintenance</option><option value="other">Other</option>
        </select>
        <input type="date" [(ngModel)]="filterDate" (ngModelChange)="loadEntries()" />
        <button class="btn-outline" (click)="filterStatus='';filterPurpose='';filterDate='';loadEntries()">
          <span class="material-icons-round">clear</span> Clear
        </button>
      </div>

      <!-- Entries Table -->
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Entry #</th><th>Badge</th><th>Vehicle</th><th>Type</th><th>Driver</th>
                <th>Company</th><th>Purpose</th><th>Host</th><th>PPE</th>
                <th>In Time</th><th>Out Time</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (e of entries; track e.id) {
                <tr>
                  <td class="mono">{{ e.entry_no }}</td>
                  <td>@if (e.badge_no) { <span class="badge-tag">{{ e.badge_no }}</span> } @else { — }</td>
                  <td><strong>{{ e.vehicle_no }}</strong><br><small class="muted cap">{{ e.vehicle_type }}</small></td>
                  <td><span class="badge visitor-type">{{ e.visitor_type || 'visitor' }}</span></td>
                  <td>{{ e.driver_name }}<br><small class="muted">{{ e.driver_phone }}</small></td>
                  <td>{{ e.company || '—' }}</td>
                  <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                  <td>@if (e.host_name) { {{ e.host_name }}<br><small class="muted">{{ e.host_department }}</small> } @else { — }</td>
                  <td>
                    @if (e.ppe_issued) {
                      <span class="ppe-badge issued">Issued</span>
                      @if (e.ppe_returned) { <span class="ppe-badge returned">Returned</span> }
                    } @else { — }
                  </td>
                  <td>{{ formatDT(e.in_time) }}</td>
                  <td>{{ e.out_time ? formatDT(e.out_time) : '—' }}</td>
                  <td><span class="status-badge" [class]="e.status">{{ e.status }}</span>
                    @if (e.plant_entry === 'not_permitted') { <br><span class="badge denied-tag">No Entry</span> }
                  </td>
                  <td class="actions">
                    @if (e.status !== 'out' && e.status !== 'cancelled') {
                      <button class="icon-btn green" title="Check Out" (click)="checkout(e)"><span class="material-icons-round">logout</span></button>
                      @if (!e.visit_confirmed) {
                        <button class="icon-btn purple" title="Confirm Visit" (click)="confirmVisitEntry(e)"><span class="material-icons-round">verified</span></button>
                      }
                      @if (e.status === 'in') {
                        <button class="icon-btn blue" title="Mark Docked" (click)="updateStatus(e, 'docked')"><span class="material-icons-round">dock</span></button>
                      }
                    }
                    <button class="icon-btn amber" title="Print Pass" (click)="printPass(e)"><span class="material-icons-round">print</span></button>
                    <button class="icon-btn grey" title="View Details" (click)="viewDetail(e)"><span class="material-icons-round">visibility</span></button>
                  </td>
                </tr>
              }
              @if (!entries.length) { <tr><td colspan="13" class="empty">No entries found</td></tr> }
            </tbody>
          </table>
        </div>
        @if (total > entries.length) {
          <div class="pagination">
            <button [disabled]="page <= 1" (click)="page = page - 1; loadEntries()">Previous</button>
            <span>Page {{ page }} of {{ Math.ceil(total / 20) }}</span>
            <button [disabled]="page * 20 >= total" (click)="page = page + 1; loadEntries()">Next</button>
          </div>
        }
      </div>
    </div>

    <!-- Checkout Dialog -->
    @if (checkoutEntry) {
      <div class="overlay" (click)="checkoutEntry = null">
        <div class="dialog wide" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">logout</span> Check Out — {{ checkoutEntry.vehicle_no }}</h3>
          <div class="dialog-grid">
            <div class="field"><label>Out Weight (kg)</label><input type="number" [(ngModel)]="checkoutForm.out_weight" placeholder="Optional" /></div>
            <div class="field"><label>Gate Pass #</label><input [(ngModel)]="checkoutForm.gate_pass_no" placeholder="Optional" /></div>
            <div class="field"><label>PPE Returned</label><input [(ngModel)]="checkoutForm.ppe_returned" [placeholder]="checkoutEntry.ppe_issued || 'N/A'" /></div>
            <div class="field"><label>Security Guard (Out)</label><input [(ngModel)]="checkoutForm.security_out" placeholder="Guard name" /></div>
            <div class="field full"><label>Remarks</label><textarea [(ngModel)]="checkoutForm.security_remarks" rows="2"></textarea></div>
          </div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="checkoutEntry = null">Cancel</button>
            <button class="btn-primary" (click)="confirmCheckout()"><span class="material-icons-round">logout</span> Confirm Check Out</button>
          </div>
        </div>
      </div>
    }

    <!-- Detail Dialog -->
    @if (detailEntry) {
      <div class="overlay" (click)="detailEntry = null">
        <div class="dialog wide" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">info</span> Entry Details — {{ detailEntry.entry_no }}</h3>
          <div class="detail-grid">
            <div class="detail-row"><span class="dl">Vehicle</span><span class="dv">{{ detailEntry.vehicle_no }} ({{ detailEntry.vehicle_type }})</span></div>
            <div class="detail-row"><span class="dl">Badge</span><span class="dv">{{ detailEntry.badge_no || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Visitor Type</span><span class="dv cap">{{ detailEntry.visitor_type || 'visitor' }}</span></div>
            <div class="detail-row"><span class="dl">Driver</span><span class="dv">{{ detailEntry.driver_name }} — {{ detailEntry.driver_phone }}</span></div>
            <div class="detail-row"><span class="dl">ID Proof</span><span class="dv">{{ detailEntry.driver_id_type || '—' }} {{ detailEntry.driver_id_number || '' }}</span></div>
            <div class="detail-row"><span class="dl">Company</span><span class="dv">{{ detailEntry.company || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Purpose</span><span class="dv cap">{{ detailEntry.purpose }}</span></div>
            <div class="detail-row"><span class="dl">Department</span><span class="dv">{{ detailEntry.department }}</span></div>
            <div class="detail-row"><span class="dl">Host</span><span class="dv">{{ detailEntry.host_name || '—' }} {{ detailEntry.host_department ? '(' + detailEntry.host_department + ')' : '' }}</span></div>
            <div class="detail-row"><span class="dl">Host Phone</span><span class="dv">{{ detailEntry.host_phone || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Plant Entry</span><span class="dv cap">{{ detailEntry.plant_entry || '—' }}</span></div>
            <div class="detail-row"><span class="dl">PPE Issued</span><span class="dv">{{ detailEntry.ppe_issued || '—' }}</span></div>
            <div class="detail-row"><span class="dl">PPE Returned</span><span class="dv">{{ detailEntry.ppe_returned || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Food</span><span class="dv">{{ detailEntry.food_required === 'yes' ? 'Yes (' + detailEntry.food_count + ')' : 'No' }}</span></div>
            <div class="detail-row"><span class="dl">Security In</span><span class="dv">{{ detailEntry.security_in || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Security Out</span><span class="dv">{{ detailEntry.security_out || '—' }}</span></div>
            <div class="detail-row"><span class="dl">In Time</span><span class="dv">{{ formatDT(detailEntry.in_time) }}</span></div>
            <div class="detail-row"><span class="dl">Out Time</span><span class="dv">{{ detailEntry.out_time ? formatDT(detailEntry.out_time) : '—' }}</span></div>
            <div class="detail-row"><span class="dl">In Weight</span><span class="dv">{{ detailEntry.in_weight || '—' }} kg</span></div>
            <div class="detail-row"><span class="dl">Out Weight</span><span class="dv">{{ detailEntry.out_weight || '—' }} kg</span></div>
            <div class="detail-row"><span class="dl">Visit Confirmed</span><span class="dv">{{ detailEntry.visit_confirmed ? 'Yes — ' + detailEntry.visit_confirmed_by : 'No' }}</span></div>
            @if (detailEntry.special_instructions) {
              <div class="detail-row full"><span class="dl">Special Instructions</span><span class="dv">{{ detailEntry.special_instructions }}</span></div>
            }
            @if (detailEntry.security_remarks) {
              <div class="detail-row full"><span class="dl">Remarks</span><span class="dv">{{ detailEntry.security_remarks }}</span></div>
            }
          </div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="detailEntry = null">Close</button>
            <button class="btn-primary" (click)="printPass(detailEntry); detailEntry = null"><span class="material-icons-round">print</span> Print Pass</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './vehicle-entries.component.scss',
})
export class VehicleEntriesComponent implements OnInit {
  entries: VehicleEntry[] = [];
  docks: Dock[] = [];
  total = 0; page = 1;
  filterStatus = ''; filterPurpose = ''; filterDate = '';
  showForm = false; saving = false;
  successMsg = '';
  form: any = this.newForm();
  checkoutEntry: VehicleEntry | null = null;
  checkoutForm: any = {};
  detailEntry: VehicleEntry | null = null;
  lookupPhone = ''; lookupVehicle = '';
  lookupMsg = ''; lookupFound = false;
  Math = Math;

  constructor(private svc: VehicleService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getDocks().subscribe(d => { this.docks = d; this.cdr.markForCheck(); });
    this.loadEntries();
    if (this.route.snapshot.queryParams['action'] === 'new') this.showForm = true;
  }

  newForm() {
    return { vehicle_type: 'truck', purpose: 'delivery', dock_id: null, visitor_type: 'visitor',
      plant_entry: 'permitted', food_required: 'no', food_count: 1 };
  }

  loadEntries() {
    this.svc.getEntries({ status: this.filterStatus, purpose: this.filterPurpose, date: this.filterDate, page: this.page }).subscribe(r => {
      this.entries = r.entries; this.total = r.total; this.cdr.markForCheck();
    });
  }

  doLookup(type: 'phone' | 'vehicle') {
    const params = type === 'phone' ? { phone: this.lookupPhone } : { vehicle_no: this.lookupVehicle };
    this.svc.lookup(params).subscribe({
      next: (r) => {
        if (r.found && r.entry) {
          const e = r.entry;
          this.form.vehicle_no = e.vehicle_no || this.form.vehicle_no;
          this.form.vehicle_type = e.vehicle_type || this.form.vehicle_type;
          this.form.driver_name = e.driver_name || this.form.driver_name;
          this.form.driver_phone = e.driver_phone || this.form.driver_phone;
          this.form.contact_phone = e.contact_phone || this.form.contact_phone;
          this.form.driver_id_type = e.driver_id_type || this.form.driver_id_type;
          this.form.driver_id_number = e.driver_id_number || this.form.driver_id_number;
          this.form.company = e.company || this.form.company;
          this.form.visitor_type = e.visitor_type || this.form.visitor_type;
          this.form.host_name = e.host_name || this.form.host_name;
          this.form.host_department = e.host_department || this.form.host_department;
          this.form.host_phone = e.host_phone || this.form.host_phone;
          this.lookupMsg = `Found! ${r.visitCount || 0} previous visit(s). Details auto-filled.`;
          this.lookupFound = true;
        } else {
          this.lookupMsg = 'No previous records found. Enter details manually.';
          this.lookupFound = false;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.lookupMsg = 'Lookup failed'; this.lookupFound = false; this.cdr.markForCheck(); }
    });
  }

  createEntry() {
    this.saving = true;
    this.svc.createEntry(this.form).subscribe({
      next: (res) => {
        this.saving = false; this.showForm = false;
        this.successMsg = `Entry recorded! Entry #${res.entry_no}` + (res.badge_no ? ` — Badge: ${res.badge_no}` : '');
        this.form = this.newForm();
        this.lookupPhone = ''; this.lookupVehicle = ''; this.lookupMsg = '';
        this.loadEntries();
        this.cdr.markForCheck();
        setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 6000);
      },
      error: (e) => { this.saving = false; alert(e.error?.error || 'Failed'); this.cdr.markForCheck(); },
    });
  }

  checkout(e: VehicleEntry) { this.checkoutEntry = e; this.checkoutForm = {}; }

  confirmCheckout() {
    if (!this.checkoutEntry) return;
    this.svc.checkoutEntry(this.checkoutEntry.id, this.checkoutForm).subscribe({
      next: () => { this.checkoutEntry = null; this.loadEntries(); this.cdr.markForCheck(); },
      error: () => { alert('Failed to checkout'); this.cdr.markForCheck(); },
    });
  }

  confirmVisitEntry(e: VehicleEntry) {
    if (!confirm(`Confirm visit for ${e.driver_name} (${e.vehicle_no})?`)) return;
    this.svc.confirmVisit(e.id).subscribe({
      next: () => { this.loadEntries(); this.cdr.markForCheck(); },
      error: () => { alert('Failed'); this.cdr.markForCheck(); }
    });
  }

  updateStatus(e: VehicleEntry, status: string) {
    this.svc.updateEntryStatus(e.id, status).subscribe(() => { this.loadEntries(); this.cdr.markForCheck(); });
  }

  viewDetail(e: VehicleEntry) { this.detailEntry = e; }

  printPass(e: VehicleEntry) {
    this.svc.getPass(e.id).subscribe({
      next: (pass) => {
        const w = window.open('', '_blank', 'width=400,height=600');
        if (!w) return;
        w.document.write(`<html><head><title>Vehicle Pass - ${pass.entry_no}</title>
          <style>body{font-family:Arial,sans-serif;padding:20px;max-width:350px;margin:0 auto}
          h2{text-align:center;margin-bottom:4px} .sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
          table{width:100%;border-collapse:collapse;font-size:13px} td{padding:6px 8px;border-bottom:1px solid #eee}
          .lbl{font-weight:bold;color:#555;width:40%} .badge{text-align:center;font-size:24px;font-weight:bold;
          background:#f0f0f0;padding:12px;border-radius:8px;margin:12px 0;letter-spacing:2px}
          .footer{text-align:center;font-size:11px;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:10px}
          @media print{body{padding:10px}}</style></head><body>
          <h2>VEHICLE ENTRY PASS</h2>
          <div class="sub">${pass.entry_no}</div>
          ${pass.badge_no ? `<div class="badge">${pass.badge_no}</div>` : ''}
          <table>
          <tr><td class="lbl">Vehicle</td><td>${pass.vehicle_no} (${pass.vehicle_type})</td></tr>
          <tr><td class="lbl">Driver</td><td>${pass.driver_name}</td></tr>
          <tr><td class="lbl">Phone</td><td>${pass.driver_phone || '—'}</td></tr>
          <tr><td class="lbl">Company</td><td>${pass.company || '—'}</td></tr>
          <tr><td class="lbl">Purpose</td><td>${pass.purpose}</td></tr>
          <tr><td class="lbl">Department</td><td>${pass.department}</td></tr>
          ${pass.host_name ? `<tr><td class="lbl">Host</td><td>${pass.host_name} (${pass.host_department || ''})</td></tr>` : ''}
          <tr><td class="lbl">Plant Entry</td><td>${(pass.plant_entry || 'permitted').replace(/_/g, ' ')}</td></tr>
          ${pass.ppe_issued ? `<tr><td class="lbl">PPE Issued</td><td>${pass.ppe_issued}</td></tr>` : ''}
          <tr><td class="lbl">Entry Time</td><td>${this.formatDT(pass.in_time)}</td></tr>
          ${pass.special_instructions ? `<tr><td class="lbl">Instructions</td><td>${pass.special_instructions}</td></tr>` : ''}
          </table>
          <div class="footer">Auto-generated — Vehicle Entry Management System</div>
          <script>window.print();</script></body></html>`);
        w.document.close();
        this.cdr.markForCheck();
      },
      error: () => { alert('Failed to load pass'); this.cdr.markForCheck(); }
    });
  }

  formatDT(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
