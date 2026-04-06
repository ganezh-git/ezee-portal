import { Component, OnInit } from '@angular/core';
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
      <!-- New Entry Form -->
      @if (showForm) {
        <div class="form-card">
          <h2>Record New Vehicle Entry</h2>
          <div class="form-grid">
            <div class="field"><label>Vehicle No *</label><input [(ngModel)]="form.vehicle_no" placeholder="e.g. PB10AB1234" /></div>
            <div class="field"><label>Vehicle Type</label>
              <select [(ngModel)]="form.vehicle_type"><option value="truck">Truck</option><option value="van">Van</option><option value="car">Car</option><option value="two_wheeler">Two Wheeler</option><option value="other">Other</option></select>
            </div>
            <div class="field"><label>Driver Name *</label><input [(ngModel)]="form.driver_name" placeholder="Driver name" /></div>
            <div class="field"><label>Driver Phone</label><input [(ngModel)]="form.driver_phone" placeholder="Phone number" /></div>
            <div class="field"><label>Driver License</label><input [(ngModel)]="form.driver_license" placeholder="License number" /></div>
            <div class="field"><label>Company</label><input [(ngModel)]="form.company" placeholder="Company / vendor name" /></div>
            <div class="field"><label>Purpose *</label>
              <select [(ngModel)]="form.purpose"><option value="delivery">Delivery</option><option value="pickup">Pickup</option><option value="service">Service</option><option value="visitor">Visitor</option><option value="other">Other</option></select>
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
            <div class="field full"><label>Security Remarks</label><textarea [(ngModel)]="form.security_remarks" rows="2" placeholder="Any observations"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="createEntry()" [disabled]="!form.vehicle_no || !form.driver_name || !form.department">
              <span class="material-icons-round">save</span> Record Entry
            </button>
          </div>
        </div>
      }
      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterStatus" (ngModelChange)="loadEntries()">
          <option value="">All Status</option><option value="in">In</option><option value="docked">Docked</option><option value="loading">Loading</option><option value="unloading">Unloading</option><option value="out">Out</option>
        </select>
        <select [(ngModel)]="filterPurpose" (ngModelChange)="loadEntries()">
          <option value="">All Purpose</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option><option value="service">Service</option><option value="visitor">Visitor</option><option value="other">Other</option>
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
            <thead><tr><th>Entry #</th><th>Vehicle</th><th>Type</th><th>Driver</th><th>Company</th><th>Purpose</th><th>Dept</th><th>In Time</th><th>Out Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for (e of entries; track e.id) {
                <tr>
                  <td class="mono">{{ e.entry_no }}</td>
                  <td><strong>{{ e.vehicle_no }}</strong></td>
                  <td class="cap">{{ e.vehicle_type }}</td>
                  <td>{{ e.driver_name }}<br><small class="muted">{{ e.driver_phone }}</small></td>
                  <td>{{ e.company || '—' }}</td>
                  <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                  <td>{{ e.department }}</td>
                  <td>{{ formatDT(e.in_time) }}</td>
                  <td>{{ e.out_time ? formatDT(e.out_time) : '—' }}</td>
                  <td><span class="status-badge" [class]="e.status">{{ e.status }}</span></td>
                  <td class="actions">
                    @if (e.status !== 'out' && e.status !== 'cancelled') {
                      <button class="icon-btn green" title="Check Out" (click)="checkout(e)"><span class="material-icons-round">logout</span></button>
                      @if (e.status === 'in') {
                        <button class="icon-btn blue" title="Mark Docked" (click)="updateStatus(e, 'docked')"><span class="material-icons-round">dock</span></button>
                      }
                    }
                  </td>
                </tr>
              }
              @if (!entries.length) { <tr><td colspan="11" class="empty">No entries found</td></tr> }
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
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3>Check Out — {{ checkoutEntry.vehicle_no }}</h3>
          <div class="field"><label>Out Weight (kg)</label><input type="number" [(ngModel)]="checkoutForm.out_weight" placeholder="Optional" /></div>
          <div class="field"><label>Gate Pass #</label><input [(ngModel)]="checkoutForm.gate_pass_no" placeholder="Optional" /></div>
          <div class="field"><label>Remarks</label><textarea [(ngModel)]="checkoutForm.security_remarks" rows="2"></textarea></div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="checkoutEntry = null">Cancel</button>
            <button class="btn-primary" (click)="confirmCheckout()"><span class="material-icons-round">logout</span> Confirm Check Out</button>
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
  showForm = false;
  form: any = { vehicle_type: 'truck', purpose: 'delivery', dock_id: null };
  checkoutEntry: VehicleEntry | null = null;
  checkoutForm: any = {};
  Math = Math;

  constructor(private svc: VehicleService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.svc.getDocks().subscribe(d => this.docks = d);
    this.loadEntries();
    if (this.route.snapshot.queryParams['action'] === 'new') this.showForm = true;
  }

  loadEntries() {
    this.svc.getEntries({ status: this.filterStatus, purpose: this.filterPurpose, date: this.filterDate, page: this.page }).subscribe(r => {
      this.entries = r.entries; this.total = r.total;
    });
  }

  createEntry() {
    this.svc.createEntry(this.form).subscribe({
      next: () => { this.showForm = false; this.form = { vehicle_type: 'truck', purpose: 'delivery', dock_id: null }; this.loadEntries(); },
      error: (e) => alert(e.error?.error || 'Failed'),
    });
  }

  checkout(e: VehicleEntry) { this.checkoutEntry = e; this.checkoutForm = {}; }

  confirmCheckout() {
    if (!this.checkoutEntry) return;
    this.svc.checkoutEntry(this.checkoutEntry.id, this.checkoutForm).subscribe({
      next: () => { this.checkoutEntry = null; this.loadEntries(); },
      error: () => alert('Failed to checkout'),
    });
  }

  updateStatus(e: VehicleEntry, status: string) {
    this.svc.updateEntryStatus(e.id, status).subscribe(() => this.loadEntries());
  }

  formatDT(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
