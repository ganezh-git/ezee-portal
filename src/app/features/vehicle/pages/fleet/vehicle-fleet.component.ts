import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { VehicleService, Vehicle } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-fleet',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">directions_car</span> Company Fleet</h1>
        <button class="btn-primary" (click)="showForm = !showForm">
          <span class="material-icons-round">{{ showForm ? 'close' : 'add_circle' }}</span> {{ showForm ? 'Cancel' : 'Add Vehicle' }}
        </button>
      </div>
      @if (showForm) {
        <div class="form-card">
          <h2>Add New Vehicle</h2>
          <div class="form-grid">
            <div class="field"><label>Vehicle No *</label><input [(ngModel)]="form.vehicle_no" placeholder="e.g. GJ06AB1234" /></div>
            <div class="field"><label>Type</label><select [(ngModel)]="form.vehicle_type"><option value="car">Car</option><option value="suv">SUV</option><option value="van">Van</option><option value="bus">Bus</option><option value="truck">Truck</option><option value="two_wheeler">Two Wheeler</option></select></div>
            <div class="field"><label>Make</label><input [(ngModel)]="form.make" placeholder="e.g. Maruti" /></div>
            <div class="field"><label>Model</label><input [(ngModel)]="form.model" placeholder="e.g. Swift" /></div>
            <div class="field"><label>Year</label><input type="number" [(ngModel)]="form.year" /></div>
            <div class="field"><label>Color</label><input [(ngModel)]="form.color" /></div>
            <div class="field"><label>Fuel</label><select [(ngModel)]="form.fuel_type"><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="cng">CNG</option><option value="electric">Electric</option></select></div>
            <div class="field"><label>Seats</label><input type="number" [(ngModel)]="form.seating_capacity" /></div>
            <div class="field"><label>Insurance Expiry</label><input type="date" [(ngModel)]="form.insurance_expiry" /></div>
            <div class="field"><label>Fitness Expiry</label><input type="date" [(ngModel)]="form.fitness_expiry" /></div>
            <div class="field"><label>PUC Expiry</label><input type="date" [(ngModel)]="form.puc_expiry" /></div>
            <div class="field"><label>Department</label><input [(ngModel)]="form.assigned_department" /></div>
          </div>
          <div class="form-actions"><button class="btn-primary" (click)="addVehicle()" [disabled]="!form.vehicle_no"><span class="material-icons-round">save</span> Add Vehicle</button></div>
        </div>
      }
      <div class="fleet-grid">
        @for (v of vehicles; track v.id) {
          <div class="fleet-card" [class.warning]="isExpiringSoon(v)">
            <div class="fleet-header">
              <span class="material-icons-round vehicle-icon">{{ getVehicleIcon(v.vehicle_type) }}</span>
              <div><strong>{{ v.vehicle_no }}</strong><span class="sub">{{ v.make }} {{ v.model }} {{ v.year || '' }}</span></div>
              <span class="status-badge" [class]="v.status">{{ v.status }}</span>
            </div>
            <div class="fleet-details">
              <div class="detail"><span class="material-icons-round">local_gas_station</span>{{ v.fuel_type || '—' }}</div>
              <div class="detail"><span class="material-icons-round">palette</span>{{ v.color || '—' }}</div>
              <div class="detail"><span class="material-icons-round">business</span>{{ v.assigned_department || '—' }}</div>
              <div class="detail"><span class="material-icons-round">speed</span>{{ v.current_km | number:'1.0-0' }} km</div>
              @if (v.driver_name) { <div class="detail"><span class="material-icons-round">person</span>{{ v.driver_name }}</div> }
            </div>
            <div class="fleet-expiry">
              <span [class.expired]="isPast(v.insurance_expiry)" [class.soon]="isSoon(v.insurance_expiry)">Ins: {{ v.insurance_expiry || 'N/A' }}</span>
              <span [class.expired]="isPast(v.fitness_expiry)" [class.soon]="isSoon(v.fitness_expiry)">Fit: {{ v.fitness_expiry || 'N/A' }}</span>
              <span [class.expired]="isPast(v.puc_expiry)" [class.soon]="isSoon(v.puc_expiry)">PUC: {{ v.puc_expiry || 'N/A' }}</span>
            </div>
          </div>
        }
        @if (!vehicles.length) {
          <div class="empty-state"><span class="material-icons-round">directions_car</span><p>No vehicles registered yet</p></div>
        }
      </div>
    </div>
  `,
  styleUrl: './vehicle-fleet.component.scss',
})
export class VehicleFleetComponent implements OnInit {
  vehicles: Vehicle[] = [];
  showForm = false;
  form: any = { vehicle_type: 'car', fuel_type: 'diesel', seating_capacity: 4 };

  constructor(private svc: VehicleService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }

  load() { this.svc.getFleet().subscribe(v => { this.vehicles = v; this.cdr.markForCheck(); }); }

  addVehicle() {
    this.svc.addVehicle(this.form).subscribe({
      next: () => { this.showForm = false; this.form = { vehicle_type: 'car', fuel_type: 'diesel', seating_capacity: 4 }; this.load(); this.cdr.markForCheck(); },
      error: () => { alert('Failed to add vehicle'); this.cdr.markForCheck(); },
    });
  }

  getVehicleIcon(type: string): string {
    const map: Record<string, string> = { car: 'directions_car', suv: 'directions_car', van: 'airport_shuttle', bus: 'directions_bus', truck: 'local_shipping', two_wheeler: 'two_wheeler' };
    return map[type] || 'directions_car';
  }

  isPast(date: string): boolean { if (!date) return false; return new Date(date) < new Date(); }
  isSoon(date: string): boolean { if (!date) return false; const d = new Date(date); const now = new Date(); const diff = d.getTime() - now.getTime(); return diff > 0 && diff < 30 * 24 * 3600000; }
  isExpiringSoon(v: Vehicle): boolean { return this.isSoon(v.insurance_expiry) || this.isSoon(v.fitness_expiry) || this.isPast(v.insurance_expiry) || this.isPast(v.fitness_expiry); }
}
