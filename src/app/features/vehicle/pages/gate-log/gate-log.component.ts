import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VehicleService, GateLogEntry, Vehicle, Driver } from '../../services/vehicle.service';

@Component({
  selector: 'app-gate-log',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">swap_horiz</span> Gate Log</h1>
        <button class="btn-primary" (click)="showGateOut = !showGateOut">
          <span class="material-icons-round">{{ showGateOut ? 'close' : 'logout' }}</span> {{ showGateOut ? 'Cancel' : 'Record Gate Out' }}
        </button>
      </div>
      @if (showGateOut) {
        <div class="form-card">
          <h2>Record Vehicle Gate Out</h2>
          <div class="form-grid">
            <div class="field"><label>Vehicle *</label><select [(ngModel)]="outForm.vehicle_id"><option [ngValue]="null">Select vehicle</option>@for (v of vehicles; track v.id) { <option [ngValue]="v.id">{{ v.vehicle_no }} — {{ v.make }} {{ v.model }}</option> }</select></div>
            <div class="field"><label>Driver Name *</label><input [(ngModel)]="outForm.driver_name" /></div>
            <div class="field"><label>KM Reading</label><input type="number" [(ngModel)]="outForm.gate_out_km" /></div>
            <div class="field"><label>Gate</label><input [(ngModel)]="outForm.gate_name" value="Main Gate" /></div>
            <div class="field"><label>Purpose *</label><input [(ngModel)]="outForm.purpose" /></div>
            <div class="field"><label>Destination</label><input [(ngModel)]="outForm.destination" /></div>
          </div>
          <div class="form-actions"><button class="btn-primary" (click)="recordGateOut()" [disabled]="!outForm.vehicle_id || !outForm.driver_name || !outForm.purpose"><span class="material-icons-round">save</span> Record</button></div>
        </div>
      }
      <div class="filter-bar">
        <input type="date" [(ngModel)]="filterDate" (ngModelChange)="load()" />
        <label class="check-label"><input type="checkbox" [(ngModel)]="pendingOnly" (ngModelChange)="load()" /> Pending return only</label>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Driver</th><th>Gate Out</th><th>KM Out</th><th>Gate In</th><th>KM In</th><th>Purpose</th><th>Destination</th><th>Actions</th></tr></thead>
            <tbody>
              @for (g of logs; track g.id) {
                <tr [class.pending]="!g.gate_in_time">
                  <td><strong>{{ g.vehicle_no || 'V#' + g.vehicle_id }}</strong><br><small class="muted">{{ g.make }} {{ g.model }}</small></td>
                  <td>{{ g.driver_name }}</td>
                  <td>{{ formatDT(g.gate_out_time) }}</td>
                  <td class="mono">{{ g.gate_out_km || '—' }}</td>
                  <td>{{ g.gate_in_time ? formatDT(g.gate_in_time) : '⏳ Pending' }}</td>
                  <td class="mono">{{ g.gate_in_km || '—' }}</td>
                  <td>{{ g.purpose }}</td>
                  <td>{{ g.destination || '—' }}</td>
                  <td>
                    @if (!g.gate_in_time) {
                      <button class="icon-btn green" title="Record Gate In" (click)="openGateIn(g)"><span class="material-icons-round">login</span></button>
                    }
                  </td>
                </tr>
              }
              @if (!logs.length) { <tr><td colspan="9" class="empty">No gate log records</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
    @if (gateInLog) {
      <div class="overlay" (click)="gateInLog = null">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3>Gate In — {{ gateInLog.vehicle_no }}</h3>
          <div class="field"><label>KM Reading</label><input type="number" [(ngModel)]="inForm.gate_in_km" /></div>
          <div class="field"><label>Remarks</label><textarea [(ngModel)]="inForm.remarks" rows="2"></textarea></div>
          <div class="dialog-actions">
            <button class="btn-outline" (click)="gateInLog = null">Cancel</button>
            <button class="btn-primary" (click)="recordGateIn()"><span class="material-icons-round">login</span> Confirm Gate In</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './gate-log.component.scss',
})
export class GateLogComponent implements OnInit {
  logs: GateLogEntry[] = [];
  vehicles: Vehicle[] = [];
  showGateOut = false;
  outForm: any = { vehicle_id: null, gate_name: 'Main Gate' };
  filterDate = '';
  pendingOnly = false;
  gateInLog: GateLogEntry | null = null;
  inForm: any = {};

  constructor(private svc: VehicleService) {}
  ngOnInit() { this.svc.getFleet().subscribe(v => this.vehicles = v); this.load(); }

  load() { this.svc.getGateLog({ date: this.filterDate || undefined, pending: this.pendingOnly || undefined }).subscribe(l => this.logs = l); }

  recordGateOut() {
    this.svc.gateOut(this.outForm).subscribe({
      next: () => { this.showGateOut = false; this.outForm = { vehicle_id: null, gate_name: 'Main Gate' }; this.load(); },
      error: () => alert('Failed'),
    });
  }

  openGateIn(g: GateLogEntry) { this.gateInLog = g; this.inForm = {}; }

  recordGateIn() {
    if (!this.gateInLog) return;
    this.svc.gateIn(this.gateInLog.id, this.inForm).subscribe({
      next: () => { this.gateInLog = null; this.load(); },
      error: () => alert('Failed'),
    });
  }

  formatDT(dt: string): string { if (!dt) return '—'; const d = new Date(dt); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
}
