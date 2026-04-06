import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { VehicleService, TripRequest, Vehicle, Driver } from '../../services/vehicle.service';

@Component({
  selector: 'app-trip-requests',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">route</span> Trip Requests</h1>
        <button class="btn-primary" (click)="showForm = !showForm">
          <span class="material-icons-round">{{ showForm ? 'close' : 'add_circle' }}</span> {{ showForm ? 'Cancel' : 'New Request' }}
        </button>
      </div>
      @if (showForm) {
        <div class="form-card">
          <h2>New Trip Request</h2>
          <div class="form-grid">
            <div class="field"><label>Requested By *</label><input [(ngModel)]="form.requested_by" /></div>
            <div class="field"><label>Department</label><input [(ngModel)]="form.department" /></div>
            <div class="field"><label>Purpose *</label><input [(ngModel)]="form.purpose" /></div>
            <div class="field"><label>Destination</label><input [(ngModel)]="form.destination" /></div>
            <div class="field"><label>Trip Date *</label><input type="date" [(ngModel)]="form.trip_date" /></div>
            <div class="field"><label>Trip Time</label><input type="time" [(ngModel)]="form.trip_time" /></div>
            <div class="field"><label>Return Date</label><input type="date" [(ngModel)]="form.return_date" /></div>
            <div class="field"><label>Return Time</label><input type="time" [(ngModel)]="form.return_time" /></div>
            <div class="field"><label>Passengers</label><input type="number" [(ngModel)]="form.passengers" min="1" /></div>
            <div class="field full"><label>Passenger Names</label><textarea [(ngModel)]="form.passenger_names" rows="2" placeholder="Comma separated"></textarea></div>
          </div>
          <div class="form-actions"><button class="btn-primary" (click)="createTrip()" [disabled]="!form.requested_by || !form.purpose || !form.trip_date"><span class="material-icons-round">save</span> Submit Request</button></div>
        </div>
      }
      <div class="filter-bar">
        <select [(ngModel)]="filterStatus" (ngModelChange)="load()"><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Req #</th><th>Requested By</th><th>Purpose</th><th>Destination</th><th>Trip Date</th><th>Vehicle</th><th>Passengers</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for (t of trips; track t.id) {
                <tr>
                  <td class="mono">{{ t.request_no }}</td>
                  <td>{{ t.requested_by }}<br><small class="muted">{{ t.department }}</small></td>
                  <td>{{ t.purpose }}</td>
                  <td>{{ t.destination || '—' }}</td>
                  <td>{{ t.trip_date | date:'dd MMM yyyy' }}<br><small class="muted">{{ t.trip_time || '' }}</small></td>
                  <td>{{ t.vehicle_no || 'Not assigned' }}</td>
                  <td>{{ t.passengers }}</td>
                  <td><span class="status-badge" [class]="t.status">{{ t.status }}</span></td>
                  <td class="actions">
                    @if (t.status === 'pending') {
                      <button class="icon-btn green" title="Approve" (click)="approve(t, 'approve')"><span class="material-icons-round">check</span></button>
                      <button class="icon-btn red" title="Reject" (click)="approve(t, 'reject')"><span class="material-icons-round">close</span></button>
                    }
                  </td>
                </tr>
              }
              @if (!trips.length) { <tr><td colspan="9" class="empty">No trip requests</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './trip-requests.component.scss',
})
export class TripRequestsComponent implements OnInit {
  trips: TripRequest[] = [];
  showForm = false;
  filterStatus = '';
  form: any = { passengers: 1 };

  constructor(private svc: VehicleService) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getTrips({ status: this.filterStatus || undefined }).subscribe(t => this.trips = t); }

  createTrip() {
    this.svc.createTrip(this.form).subscribe({
      next: () => { this.showForm = false; this.form = { passengers: 1 }; this.load(); },
      error: () => alert('Failed'),
    });
  }

  approve(t: TripRequest, action: string) {
    const remarks = action === 'reject' ? prompt('Reason for rejection?') : null;
    this.svc.approveTrip(t.id, action, { remarks }).subscribe(() => this.load());
  }
}
