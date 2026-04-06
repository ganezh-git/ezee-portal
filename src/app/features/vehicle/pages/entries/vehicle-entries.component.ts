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

      <!-- ═══ NEW ENTRY FORM (Step 1: First Weighment at Security) ═══ -->
      @if (showForm) {
        <div class="form-card">
          <h2><span class="material-icons-round">scale</span> Record New Vehicle Entry — First Weighment</h2>

          <!-- Quick Lookup -->
          <div class="section-header"><span class="material-icons-round">search</span> Quick Lookup</div>
          <div class="lookup-bar">
            <div class="field">
              <label>Vehicle Number</label>
              <div class="input-with-btn">
                <input [(ngModel)]="lookupVehicle" placeholder="e.g. MH12AB1234" (keyup.enter)="doLookup()" />
                <button class="btn-sm" (click)="doLookup()" [disabled]="!lookupVehicle"><span class="material-icons-round">search</span></button>
              </div>
            </div>
            @if (lookupMsg) {
              <div class="lookup-msg" [class.found]="lookupFound">
                <span class="material-icons-round">{{ lookupFound ? 'check_circle' : 'info' }}</span> {{ lookupMsg }}
              </div>
            }
          </div>

          <!-- Vehicle & Driver Info -->
          <div class="section-header"><span class="material-icons-round">directions_car</span> Vehicle & Driver</div>
          <div class="form-grid">
            <div class="field"><label>Vehicle No *</label><input [(ngModel)]="form.vehicle_no" placeholder="e.g. MH12AB1234" /></div>
            <div class="field"><label>Vehicle Type</label>
              <select [(ngModel)]="form.vehicle_type">
                <option value="truck">Truck</option><option value="container">Container</option>
                <option value="tanker">Tanker</option><option value="lorry">Lorry</option>
                <option value="tractor">Tractor</option><option value="tipper">Tipper</option>
                <option value="van">Van</option><option value="tata_ace">Tata Ace</option>
                <option value="car">Car</option><option value="two_wheeler">Two Wheeler</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="field"><label>Driver Name *</label><input [(ngModel)]="form.driver_name" placeholder="Driver name" /></div>
            <div class="field"><label>Driver Phone</label><input [(ngModel)]="form.driver_phone" placeholder="Phone number" /></div>
            <div class="field"><label>Driver Mobile</label><input [(ngModel)]="form.driver_mobile" placeholder="Mobile number" /></div>
            <div class="field"><label>License No</label><input [(ngModel)]="form.driver_license" placeholder="License number" /></div>
            <div class="field"><label>License Validity</label><input type="date" [(ngModel)]="form.license_validity" /></div>
            <div class="field"><label>Pollution Cert</label><input [(ngModel)]="form.pollution_cert" placeholder="Certificate number" /></div>
            <div class="field"><label>Pollution Validity</label><input type="date" [(ngModel)]="form.pollution_cert_validity" /></div>
          </div>

          <!-- Weighbridge & Challan -->
          <div class="section-header"><span class="material-icons-round">scale</span> Weighbridge & Challan Details</div>
          <div class="form-grid">
            <div class="field highlight"><label>Gross Weight (kg) *</label><input type="number" [(ngModel)]="form.gross_weight" placeholder="First weighment" class="big-input" /></div>
            <div class="field"><label>Shift</label>
              <select [(ngModel)]="form.shift">
                <option value="">— Select —</option><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option>
              </select>
            </div>
            <div class="field"><label>Challan No</label><input [(ngModel)]="form.challan_no" placeholder="Challan number" /></div>
            <div class="field"><label>Challan Date</label><input type="date" [(ngModel)]="form.challan_date" /></div>
            <div class="field"><label>Challan Weight</label><input type="number" [(ngModel)]="form.challan_weight" placeholder="As per challan" /></div>
            <div class="field"><label>UOM</label>
              <select [(ngModel)]="form.challan_uom">
                <option value="KG">KG</option><option value="MT">MT</option><option value="LTR">LTR</option>
              </select>
            </div>
            <div class="field"><label>Delivery Note No</label><input [(ngModel)]="form.delivery_note_no" placeholder="D/N number" /></div>
          </div>

          <!-- Product / Supplier / Transporter -->
          <div class="section-header"><span class="material-icons-round">inventory_2</span> Product & Supplier</div>
          <div class="form-grid">
            <div class="field"><label>Product Code</label><input [(ngModel)]="form.product_code" placeholder="Product code" /></div>
            <div class="field"><label>Product Name</label><input [(ngModel)]="form.product_name" placeholder="Product name" /></div>
            <div class="field"><label>Supplier Code</label><input [(ngModel)]="form.supplier_code" placeholder="Supplier code" /></div>
            <div class="field"><label>Supplier Name</label><input [(ngModel)]="form.supplier_name" placeholder="Supplier name" /></div>
            <div class="field"><label>Transporter Code</label><input [(ngModel)]="form.transporter_code" placeholder="Transporter code" /></div>
            <div class="field"><label>Transporter Name</label><input [(ngModel)]="form.transporter_name" placeholder="Transporter name" /></div>
          </div>

          <!-- Purpose & General -->
          <div class="section-header"><span class="material-icons-round">assignment</span> Purpose & Details</div>
          <div class="form-grid">
            <div class="field"><label>Purpose *</label>
              <select [(ngModel)]="form.purpose">
                <option value="delivery">Delivery</option><option value="pickup">Pickup</option>
                <option value="loading">Loading</option><option value="unloading">Unloading</option>
                <option value="raw_material">Raw Material</option><option value="dispatch">Dispatch</option>
                <option value="service">Service</option><option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="field"><label>Department *</label><input [(ngModel)]="form.department" placeholder="Department" /></div>
            <div class="field"><label>Company</label><input [(ngModel)]="form.company" placeholder="Company name" /></div>
            <div class="field"><label>Dock</label>
              <select [(ngModel)]="form.dock_id"><option [ngValue]="null">— None —</option>
                @for (d of docks; track d.id) { <option [ngValue]="d.id">{{ d.dock_name }} ({{ d.dock_type }})</option> }
              </select>
            </div>
            <div class="field"><label>PO Reference</label><input [(ngModel)]="form.po_reference" placeholder="PO / SO number" /></div>
            <div class="field full"><label>Material Description</label><textarea [(ngModel)]="form.material_desc" rows="2" placeholder="What materials?"></textarea></div>
            <div class="field full"><label>Security Comments</label><textarea [(ngModel)]="form.security_in_comments" rows="2" placeholder="Security gate remarks"></textarea></div>
          </div>

          <div class="form-actions">
            <button class="btn-outline" (click)="showForm=false">Cancel</button>
            <button class="btn-primary" (click)="createEntry()" [disabled]="saving || !form.vehicle_no || !form.driver_name || !form.department">
              <span class="material-icons-round">save</span> {{ saving ? 'Saving...' : 'Record Entry & Gross Weight' }}
            </button>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterStatus" (ngModelChange)="loadEntries()">
          <option value="">All Status</option>
          <option value="in">In (Gate Entry)</option>
          <option value="with_officer">With Officer</option>
          <option value="with_qa">With QA</option>
          <option value="loading">Loading</option><option value="unloading">Unloading</option>
          <option value="waiting_second_weight">Waiting 2nd Weight</option>
          <option value="ready_to_exit">Ready to Exit</option>
          <option value="out">Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select [(ngModel)]="filterPurpose" (ngModelChange)="loadEntries()">
          <option value="">All Purpose</option>
          <option value="delivery">Delivery</option><option value="pickup">Pickup</option>
          <option value="loading">Loading</option><option value="unloading">Unloading</option>
          <option value="raw_material">Raw Material</option><option value="dispatch">Dispatch</option>
          <option value="service">Service</option><option value="maintenance">Maintenance</option>
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
                <th>Entry #</th><th>Vehicle</th><th>Type</th><th>Driver</th>
                <th>Supplier/Transporter</th><th>Purpose</th><th>Challan</th>
                <th>Gross (kg)</th><th>Tare (kg)</th><th>Net (kg)</th>
                <th>In Time</th><th>Out Time</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (e of entries; track e.id) {
                <tr>
                  <td class="mono">{{ e.entry_no }}</td>
                  <td><strong>{{ e.vehicle_no }}</strong></td>
                  <td><span class="badge cap">{{ e.vehicle_type }}</span></td>
                  <td>{{ e.driver_name }}<br><small class="muted">{{ e.driver_phone || e.driver_mobile || '' }}</small></td>
                  <td>
                    @if (e.supplier_name) { <small>S: {{ e.supplier_name }}</small><br> }
                    @if (e.transporter_name) { <small>T: {{ e.transporter_name }}</small> }
                    @if (!e.supplier_name && !e.transporter_name) { — }
                  </td>
                  <td><span class="badge purpose-tag">{{ e.purpose }}</span></td>
                  <td class="mono">{{ e.challan_no || '—' }}</td>
                  <td class="weight">{{ e.gross_weight || '—' }}</td>
                  <td class="weight">{{ e.tare_weight || '—' }}</td>
                  <td class="weight bold">{{ e.net_weight || '—' }}</td>
                  <td>{{ formatDT(e.in_time) }}</td>
                  <td>{{ e.out_time ? formatDT(e.out_time) : '—' }}</td>
                  <td><span class="status-badge" [class]="e.status">{{ statusLabel(e.status) }}</span></td>
                  <td class="actions">
                    @if (e.status === 'in') {
                      <button class="icon-btn blue" title="Send to Officer" (click)="updateStatus(e, 'with_officer')"><span class="material-icons-round">person</span></button>
                    }
                    @if (e.status === 'with_officer') {
                      <button class="icon-btn purple" title="Officer Approve" (click)="openOfficerDialog(e)"><span class="material-icons-round">verified</span></button>
                    }
                    @if (e.status === 'with_qa') {
                      <button class="icon-btn teal" title="QA Approve" (click)="openQADialog(e)"><span class="material-icons-round">science</span></button>
                    }
                    @if (e.status === 'loading' || e.status === 'unloading' || e.status === 'waiting_second_weight') {
                      <button class="icon-btn amber" title="Second Weighment" (click)="openSecondWeightDialog(e)"><span class="material-icons-round">scale</span></button>
                    }
                    @if (e.status === 'ready_to_exit') {
                      <button class="icon-btn green" title="Vehicle Out" (click)="openCheckoutDialog(e)"><span class="material-icons-round">logout</span></button>
                    }
                    @if (e.status !== 'out' && e.status !== 'cancelled') {
                      <button class="icon-btn red" title="Cancel" (click)="updateStatus(e, 'cancelled')"><span class="material-icons-round">cancel</span></button>
                    }
                    <button class="icon-btn amber" title="Print Challan" (click)="printChallan(e)"><span class="material-icons-round">print</span></button>
                    <button class="icon-btn grey" title="View Details" (click)="viewDetail(e)"><span class="material-icons-round">visibility</span></button>
                  </td>
                </tr>
              }
              @if (!entries.length) { <tr><td colspan="14" class="empty">No entries found</td></tr> }
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

    <!-- ═══ OFFICER APPROVAL DIALOG ═══ -->
    @if (officerEntry) {
      <div class="overlay" (click)="officerEntry = null">
        <div class="dialog wide" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">verified</span> Officer Review — {{ officerEntry.vehicle_no }}</h3>
          <div class="dialog-info">
            <span>Entry: {{ officerEntry.entry_no }}</span>
            <span>Gross: <strong>{{ officerEntry.gross_weight }} kg</strong></span>
            <span>Challan: {{ officerEntry.challan_no || '—' }}</span>
          </div>
          <div class="dialog-grid">
            <div class="field"><label>Product Code</label><input [(ngModel)]="officerForm.product_code" [placeholder]="officerEntry.product_code || ''" /></div>
            <div class="field"><label>Product Name</label><input [(ngModel)]="officerForm.product_name" [placeholder]="officerEntry.product_name || ''" /></div>
            <div class="field"><label>Supplier Code</label><input [(ngModel)]="officerForm.supplier_code" [placeholder]="officerEntry.supplier_code || ''" /></div>
            <div class="field"><label>Supplier Name</label><input [(ngModel)]="officerForm.supplier_name" [placeholder]="officerEntry.supplier_name || ''" /></div>
            <div class="field"><label>Transporter Code</label><input [(ngModel)]="officerForm.transporter_code" [placeholder]="officerEntry.transporter_code || ''" /></div>
            <div class="field"><label>Transporter Name</label><input [(ngModel)]="officerForm.transporter_name" [placeholder]="officerEntry.transporter_name || ''" /></div>
            <div class="field"><label>PO Reference</label><input [(ngModel)]="officerForm.po_reference" [placeholder]="officerEntry.po_reference || ''" /></div>
            <div class="field"><label>Challan No</label><input [(ngModel)]="officerForm.challan_no" [placeholder]="officerEntry.challan_no || ''" /></div>
            <div class="field"><label>Challan Weight</label><input type="number" [(ngModel)]="officerForm.challan_weight" /></div>
            <div class="field"><label>Delivery Note</label><input [(ngModel)]="officerForm.delivery_note_no" [placeholder]="officerEntry.delivery_note_no || ''" /></div>
            <div class="field"><label>COA %</label><input type="number" [(ngModel)]="officerForm.coa_percent" placeholder="Certificate of Analysis %" /></div>
            <div class="field"><label>Vehicle Returned?</label>
              <select [(ngModel)]="officerForm.vehicle_returned">
                <option value="na">No — send to QA</option>
                <option value="yes">Yes — return vehicle</option>
              </select>
            </div>
            <div class="field full"><label>Officer Comments</label><textarea [(ngModel)]="officerForm.officer_comments" rows="2"></textarea></div>
          </div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="officerEntry = null">Cancel</button>
            <button class="btn-primary" (click)="submitOfficerApproval()"><span class="material-icons-round">check</span> Submit Review</button>
          </div>
        </div>
      </div>
    }

    <!-- ═══ QA APPROVAL DIALOG ═══ -->
    @if (qaEntry) {
      <div class="overlay" (click)="qaEntry = null">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">science</span> QA Review — {{ qaEntry.vehicle_no }}</h3>
          <div class="dialog-info">
            <span>Product: {{ qaEntry.product_name || '—' }}</span>
            <span>Supplier: {{ qaEntry.supplier_name || '—' }}</span>
            <span>COA: {{ qaEntry.coa_percent || '—' }}%</span>
          </div>
          <div class="dialog-grid">
            <div class="field full"><label>QA Comments</label><textarea [(ngModel)]="qaForm.qa_comments" rows="3" placeholder="QA observations"></textarea></div>
          </div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="qaEntry = null">Cancel</button>
            <button class="btn-danger" (click)="submitQA(false)"><span class="material-icons-round">close</span> Reject → Exit</button>
            <button class="btn-primary" (click)="submitQA(true)"><span class="material-icons-round">check</span> Approve → Loading</button>
          </div>
        </div>
      </div>
    }

    <!-- ═══ SECOND WEIGHMENT DIALOG ═══ -->
    @if (weightEntry) {
      <div class="overlay" (click)="weightEntry = null">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">scale</span> Second Weighment — {{ weightEntry.vehicle_no }}</h3>
          <div class="dialog-info">
            <span>Gross Weight: <strong>{{ weightEntry.gross_weight }} kg</strong></span>
            <span>Challan Weight: {{ weightEntry.challan_weight || '—' }} {{ weightEntry.challan_uom }}</span>
          </div>
          <div class="dialog-grid">
            <div class="field highlight"><label>Tare Weight (kg) *</label>
              <input type="number" [(ngModel)]="weightForm.tare_weight" placeholder="Enter tare weight" class="big-input" (ngModelChange)="calcNet()" />
            </div>
          </div>
          @if (weightForm.tare_weight) {
            <div class="net-result">
              <span class="net-label">Net Weight</span>
              <span class="net-value">{{ calcNetWeight() }} kg</span>
            </div>
          }
          <div class="dialog-actions">
            <button class="btn-outline" (click)="weightEntry = null">Cancel</button>
            <button class="btn-primary" (click)="submitSecondWeight()" [disabled]="!weightForm.tare_weight">
              <span class="material-icons-round">check</span> Record Tare Weight
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ═══ CHECKOUT DIALOG ═══ -->
    @if (checkoutEntry) {
      <div class="overlay" (click)="checkoutEntry = null">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">logout</span> Vehicle Out — {{ checkoutEntry.vehicle_no }}</h3>
          <div class="dialog-info">
            <span>Gross: {{ checkoutEntry.gross_weight || '—' }} kg</span>
            <span>Tare: {{ checkoutEntry.tare_weight || '—' }} kg</span>
            <span>Net: <strong>{{ checkoutEntry.net_weight || '—' }} kg</strong></span>
          </div>
          <div class="dialog-grid">
            <div class="field"><label>Gate Pass #</label><input [(ngModel)]="checkoutForm.gate_pass_no" placeholder="Optional" /></div>
            <div class="field full"><label>Security Remarks</label><textarea [(ngModel)]="checkoutForm.security_remarks" rows="2"></textarea></div>
          </div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="checkoutEntry = null">Cancel</button>
            <button class="btn-primary" (click)="confirmCheckout()"><span class="material-icons-round">logout</span> Confirm Vehicle Out</button>
          </div>
        </div>
      </div>
    }

    <!-- ═══ DETAIL DIALOG ═══ -->
    @if (detailEntry) {
      <div class="overlay" (click)="detailEntry = null">
        <div class="dialog wide" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round">info</span> Entry Details — {{ detailEntry.entry_no }}</h3>
          <div class="detail-sections">
            <div class="detail-section">
              <h4>Vehicle & Driver</h4>
              <div class="detail-grid">
                <div class="detail-row"><span class="dl">Vehicle</span><span class="dv">{{ detailEntry.vehicle_no }} ({{ detailEntry.vehicle_type }})</span></div>
                <div class="detail-row"><span class="dl">Driver</span><span class="dv">{{ detailEntry.driver_name }}</span></div>
                <div class="detail-row"><span class="dl">Phone</span><span class="dv">{{ detailEntry.driver_phone || detailEntry.driver_mobile || '—' }}</span></div>
                <div class="detail-row"><span class="dl">License</span><span class="dv">{{ detailEntry.driver_license || '—' }} {{ detailEntry.license_validity ? '(exp: ' + detailEntry.license_validity + ')' : '' }}</span></div>
                <div class="detail-row"><span class="dl">Pollution Cert</span><span class="dv">{{ detailEntry.pollution_cert || '—' }} {{ detailEntry.pollution_cert_validity ? '(exp: ' + detailEntry.pollution_cert_validity + ')' : '' }}</span></div>
                <div class="detail-row"><span class="dl">Company</span><span class="dv">{{ detailEntry.company || '—' }}</span></div>
              </div>
            </div>
            <div class="detail-section">
              <h4>Weighbridge</h4>
              <div class="detail-grid">
                <div class="detail-row"><span class="dl">Gross Weight</span><span class="dv weight-big">{{ detailEntry.gross_weight || '—' }} kg</span></div>
                <div class="detail-row"><span class="dl">Tare Weight</span><span class="dv weight-big">{{ detailEntry.tare_weight || '—' }} kg</span></div>
                <div class="detail-row"><span class="dl">Net Weight</span><span class="dv weight-big bold">{{ detailEntry.net_weight || '—' }} kg</span></div>
                <div class="detail-row"><span class="dl">Weight Approved By</span><span class="dv">{{ detailEntry.weight_approved_by || '—' }}</span></div>
              </div>
            </div>
            <div class="detail-section">
              <h4>Challan & Material</h4>
              <div class="detail-grid">
                <div class="detail-row"><span class="dl">Challan No</span><span class="dv">{{ detailEntry.challan_no || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Challan Date</span><span class="dv">{{ detailEntry.challan_date || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Challan Weight</span><span class="dv">{{ detailEntry.challan_weight || '—' }} {{ detailEntry.challan_uom }}</span></div>
                <div class="detail-row"><span class="dl">Delivery Note</span><span class="dv">{{ detailEntry.delivery_note_no || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Product</span><span class="dv">{{ detailEntry.product_code ? detailEntry.product_code + ' — ' : '' }}{{ detailEntry.product_name || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Supplier</span><span class="dv">{{ detailEntry.supplier_code ? detailEntry.supplier_code + ' — ' : '' }}{{ detailEntry.supplier_name || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Transporter</span><span class="dv">{{ detailEntry.transporter_code ? detailEntry.transporter_code + ' — ' : '' }}{{ detailEntry.transporter_name || '—' }}</span></div>
                <div class="detail-row"><span class="dl">PO Reference</span><span class="dv">{{ detailEntry.po_reference || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Purpose</span><span class="dv cap">{{ detailEntry.purpose }}</span></div>
                <div class="detail-row"><span class="dl">Department</span><span class="dv">{{ detailEntry.department }}</span></div>
                <div class="detail-row"><span class="dl">COA %</span><span class="dv">{{ detailEntry.coa_percent || '—' }}</span></div>
              </div>
            </div>
            <div class="detail-section">
              <h4>Workflow</h4>
              <div class="detail-grid">
                <div class="detail-row"><span class="dl">Status</span><span class="dv"><span class="status-badge" [class]="detailEntry.status">{{ statusLabel(detailEntry.status) }}</span></span></div>
                <div class="detail-row"><span class="dl">Security In</span><span class="dv">{{ detailEntry.security_in_by || '—' }} — {{ formatDT(detailEntry.security_in_time) }}</span></div>
                <div class="detail-row"><span class="dl">Security Comments</span><span class="dv">{{ detailEntry.security_in_comments || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Officer</span><span class="dv">{{ detailEntry.officer_name || '—' }} — {{ formatDT(detailEntry.officer_update_time) }}</span></div>
                <div class="detail-row"><span class="dl">Officer Comments</span><span class="dv">{{ detailEntry.officer_comments || '—' }}</span></div>
                <div class="detail-row"><span class="dl">QA Officer</span><span class="dv">{{ detailEntry.qa_officer || '—' }} — {{ formatDT(detailEntry.qa_update_time) }}</span></div>
                <div class="detail-row"><span class="dl">QA Comments</span><span class="dv">{{ detailEntry.qa_comments || '—' }}</span></div>
                <div class="detail-row"><span class="dl">Security Out</span><span class="dv">{{ detailEntry.security_out_by || '—' }}</span></div>
                <div class="detail-row"><span class="dl">In Time</span><span class="dv">{{ formatDT(detailEntry.in_time) }}</span></div>
                <div class="detail-row"><span class="dl">Out Time</span><span class="dv">{{ detailEntry.out_time ? formatDT(detailEntry.out_time) : '—' }}</span></div>
              </div>
            </div>
          </div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="detailEntry = null">Close</button>
            <button class="btn-primary" (click)="printChallan(detailEntry); detailEntry = null"><span class="material-icons-round">print</span> Print Challan</button>
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

  // Dialogs
  officerEntry: VehicleEntry | null = null;
  officerForm: any = {};
  qaEntry: VehicleEntry | null = null;
  qaForm: any = {};
  weightEntry: VehicleEntry | null = null;
  weightForm: any = {};
  checkoutEntry: VehicleEntry | null = null;
  checkoutForm: any = {};
  detailEntry: VehicleEntry | null = null;

  lookupVehicle = '';
  lookupMsg = ''; lookupFound = false;
  Math = Math;

  constructor(private svc: VehicleService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getDocks().subscribe(d => { this.docks = d; this.cdr.markForCheck(); });
    this.loadEntries();
    if (this.route.snapshot.queryParams['action'] === 'new') this.showForm = true;
  }

  newForm() {
    return { vehicle_type: 'truck', purpose: 'delivery', dock_id: null, challan_uom: 'KG' };
  }

  loadEntries() {
    this.svc.getEntries({ status: this.filterStatus, purpose: this.filterPurpose, date: this.filterDate, page: this.page }).subscribe(r => {
      this.entries = r.entries; this.total = r.total; this.cdr.markForCheck();
    });
  }

  doLookup() {
    this.svc.lookup({ vehicle_no: this.lookupVehicle }).subscribe({
      next: (r) => {
        if (r.found && r.entry) {
          const e = r.entry;
          this.form.vehicle_no = e.vehicle_no || this.form.vehicle_no;
          this.form.vehicle_type = e.vehicle_type || this.form.vehicle_type;
          this.form.driver_name = e.driver_name || this.form.driver_name;
          this.form.driver_phone = e.driver_phone || this.form.driver_phone;
          this.form.driver_license = e.driver_license || this.form.driver_license;
          this.form.company = e.company || this.form.company;
          this.form.transporter_name = e.transporter_name || this.form.transporter_name;
          this.form.transporter_code = e.transporter_code || this.form.transporter_code;
          this.form.supplier_name = e.supplier_name || this.form.supplier_name;
          this.form.supplier_code = e.supplier_code || this.form.supplier_code;
          this.lookupMsg = `Found! ${r.visitCount || 0} previous entry(ies). Details auto-filled.`;
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
        this.successMsg = `Entry recorded! ${res.entry_no} — Gross: ${this.form.gross_weight || '—'} kg`;
        this.form = this.newForm();
        this.lookupVehicle = ''; this.lookupMsg = '';
        this.loadEntries();
        this.cdr.markForCheck();
        setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 6000);
      },
      error: (e) => { this.saving = false; alert(e.error?.error || 'Failed'); this.cdr.markForCheck(); },
    });
  }

  // Officer dialog
  openOfficerDialog(e: VehicleEntry) {
    this.officerEntry = e;
    this.officerForm = {
      product_code: e.product_code || '', product_name: e.product_name || '',
      supplier_code: e.supplier_code || '', supplier_name: e.supplier_name || '',
      transporter_code: e.transporter_code || '', transporter_name: e.transporter_name || '',
      po_reference: e.po_reference || '', challan_no: e.challan_no || '',
      challan_weight: e.challan_weight || null, delivery_note_no: e.delivery_note_no || '',
      coa_percent: e.coa_percent || null, vehicle_returned: 'na', officer_comments: ''
    };
  }
  submitOfficerApproval() {
    if (!this.officerEntry) return;
    this.svc.officerApprove(this.officerEntry.id, this.officerForm).subscribe({
      next: () => { this.officerEntry = null; this.loadEntries(); this.successMsg = 'Officer review saved'; this.cdr.markForCheck(); setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000); },
      error: () => { alert('Failed'); this.cdr.markForCheck(); }
    });
  }

  // QA dialog
  openQADialog(e: VehicleEntry) { this.qaEntry = e; this.qaForm = { qa_comments: '' }; }
  submitQA(approve: boolean) {
    if (!this.qaEntry) return;
    this.svc.qaApprove(this.qaEntry.id, { approve, qa_comments: this.qaForm.qa_comments }).subscribe({
      next: (r) => { this.qaEntry = null; this.loadEntries(); this.successMsg = r.message; this.cdr.markForCheck(); setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000); },
      error: () => { alert('Failed'); this.cdr.markForCheck(); }
    });
  }

  // Second weight dialog
  openSecondWeightDialog(e: VehicleEntry) { this.weightEntry = e; this.weightForm = { tare_weight: null }; }
  calcNet() {}
  calcNetWeight(): number {
    if (!this.weightEntry || !this.weightForm.tare_weight) return 0;
    return Math.abs((this.weightEntry.gross_weight || 0) - this.weightForm.tare_weight);
  }
  submitSecondWeight() {
    if (!this.weightEntry) return;
    this.svc.secondWeight(this.weightEntry.id, { tare_weight: this.weightForm.tare_weight }).subscribe({
      next: (r) => {
        this.weightEntry = null; this.loadEntries();
        this.successMsg = `Second weight recorded. Net: ${r.net_weight} kg`;
        this.cdr.markForCheck();
        setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000);
      },
      error: () => { alert('Failed'); this.cdr.markForCheck(); }
    });
  }

  // Checkout
  openCheckoutDialog(e: VehicleEntry) { this.checkoutEntry = e; this.checkoutForm = {}; }
  confirmCheckout() {
    if (!this.checkoutEntry) return;
    this.svc.checkoutEntry(this.checkoutEntry.id, this.checkoutForm).subscribe({
      next: () => { this.checkoutEntry = null; this.loadEntries(); this.successMsg = 'Vehicle checked out'; this.cdr.markForCheck(); setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000); },
      error: () => { alert('Failed to checkout'); this.cdr.markForCheck(); },
    });
  }

  updateStatus(e: VehicleEntry, status: string) {
    this.svc.updateEntryStatus(e.id, status).subscribe(() => { this.loadEntries(); this.cdr.markForCheck(); });
  }

  viewDetail(e: VehicleEntry) { this.detailEntry = e; }

  printChallan(e: VehicleEntry) {
    this.svc.getPass(e.id).subscribe({
      next: (p) => {
        const w = window.open('', '_blank', 'width=600,height=800');
        if (!w) return;
        w.document.write(`<html><head><title>Despatch Challan - ${p.entry_no}</title>
          <style>body{font-family:Arial,sans-serif;padding:20px;max-width:550px;margin:0 auto}
          h2{text-align:center;margin-bottom:4px;border-bottom:2px solid #000;padding-bottom:8px}
          .sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
          table{width:100%;border-collapse:collapse;font-size:13px} td{padding:6px 8px;border-bottom:1px solid #ddd}
          .lbl{font-weight:bold;color:#555;width:35%}
          .section{background:#f5f5f5;font-weight:bold;padding:8px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:1px}
          .weight-box{text-align:center;margin:16px 0;padding:12px;border:2px solid #333;border-radius:8px}
          .weight-box .label{font-size:11px;color:#666;text-transform:uppercase} .weight-box .val{font-size:28px;font-weight:bold}
          .weights{display:flex;gap:12px;justify-content:center}
          .footer{text-align:center;font-size:10px;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:10px}
          @media print{body{padding:10px}}</style></head><body>
          <h2>VEHICLE INWARD CUM DESPATCH CHALLAN</h2>
          <div class="sub">${p.entry_no} | ${this.formatDT(p.in_time)}</div>
          <table>
          <tr><td colspan="2" class="section">Vehicle & Driver</td></tr>
          <tr><td class="lbl">Vehicle No</td><td>${p.vehicle_no} (${p.vehicle_type})</td></tr>
          <tr><td class="lbl">Driver</td><td>${p.driver_name} ${p.driver_phone ? '— ' + p.driver_phone : ''}</td></tr>
          <tr><td class="lbl">License</td><td>${p.driver_license || '—'}</td></tr>
          <tr><td class="lbl">Pollution Cert</td><td>${p.pollution_cert || '—'}</td></tr>
          <tr><td colspan="2" class="section">Material & Challan</td></tr>
          <tr><td class="lbl">Product</td><td>${p.product_code ? p.product_code + ' — ' : ''}${p.product_name || '—'}</td></tr>
          <tr><td class="lbl">Supplier</td><td>${p.supplier_code ? p.supplier_code + ' — ' : ''}${p.supplier_name || '—'}</td></tr>
          <tr><td class="lbl">Transporter</td><td>${p.transporter_code ? p.transporter_code + ' — ' : ''}${p.transporter_name || '—'}</td></tr>
          <tr><td class="lbl">Challan No</td><td>${p.challan_no || '—'} ${p.challan_date ? '(' + p.challan_date + ')' : ''}</td></tr>
          <tr><td class="lbl">Challan Weight</td><td>${p.challan_weight || '—'} ${p.challan_uom || ''}</td></tr>
          <tr><td class="lbl">Delivery Note</td><td>${p.delivery_note_no || '—'}</td></tr>
          <tr><td class="lbl">PO Reference</td><td>${p.po_reference || '—'}</td></tr>
          <tr><td class="lbl">Purpose</td><td>${p.purpose}</td></tr>
          <tr><td class="lbl">Department</td><td>${p.department || '—'}</td></tr>
          <tr><td class="lbl">COA %</td><td>${p.coa_percent || '—'}</td></tr>
          </table>
          <div class="weights">
            <div class="weight-box"><div class="label">Gross Weight</div><div class="val">${p.gross_weight || '—'} kg</div></div>
            <div class="weight-box"><div class="label">Tare Weight</div><div class="val">${p.tare_weight || '—'} kg</div></div>
            <div class="weight-box"><div class="label">Net Weight</div><div class="val">${p.net_weight || '—'} kg</div></div>
          </div>
          <table>
          <tr><td colspan="2" class="section">Workflow</td></tr>
          <tr><td class="lbl">Security In</td><td>${p.security_in_by || '—'} — ${this.formatDT(p.security_in_time)}</td></tr>
          <tr><td class="lbl">Officer</td><td>${p.officer_name || '—'} — ${this.formatDT(p.officer_update_time)}</td></tr>
          <tr><td class="lbl">QA Officer</td><td>${p.qa_officer || '—'} — ${this.formatDT(p.qa_update_time)}</td></tr>
          <tr><td class="lbl">Weight Approved</td><td>${p.weight_approved_by || '—'}</td></tr>
          <tr><td class="lbl">Security Out</td><td>${p.security_out_by || '—'}</td></tr>
          <tr><td class="lbl">In Time</td><td>${this.formatDT(p.in_time)}</td></tr>
          <tr><td class="lbl">Out Time</td><td>${p.out_time ? this.formatDT(p.out_time) : '—'}</td></tr>
          </table>
          <div class="footer">Vehicle Inward Cum Despatch Challan — Auto Generated</div>
          <script>window.print();</script></body></html>`);
        w.document.close();
        this.cdr.markForCheck();
      },
      error: () => { alert('Failed to load data'); this.cdr.markForCheck(); }
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      waiting_entry: 'Waiting Entry', in: 'Gate In', with_officer: 'With Officer',
      with_qa: 'With QA', loading: 'Loading', unloading: 'Unloading',
      waiting_second_weight: 'Waiting 2nd Wt', ready_to_exit: 'Ready to Exit',
      out: 'Out', cancelled: 'Cancelled'
    };
    return map[s] || s;
  }

  formatDT(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
