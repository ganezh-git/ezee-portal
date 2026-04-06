import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, TaxiBooking } from '../../services/reception.service';

@Component({
  selector: 'app-reception-taxi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Taxi Bookings</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Book Taxi</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search passenger, booking no..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="requested">Requested</option><option value="confirmed">Confirmed</option>
          <option value="dispatched">Dispatched</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Booking #</th><th>Passenger</th><th>Pickup</th><th>Drop</th><th>Date/Time</th><th>Driver</th><th>Fare</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (t of bookings; track t.id) {
              <tr>
                <td class="mono">{{ t.booking_no }}</td>
                <td class="fw-600">{{ t.passenger_name }}<br><small class="text-muted">{{ t.department }}</small></td>
                <td>{{ t.pickup_location }}</td>
                <td>{{ t.drop_location }}</td>
                <td>{{ t.pickup_date | date:'mediumDate' }}<br><small class="mono">{{ t.pickup_time }}</small></td>
                <td>{{ t.driver_name || '—' }}<br><small class="text-muted">{{ t.vehicle_no }}</small></td>
                <td class="mono">{{ t.fare_estimate ? '₹' + t.fare_estimate : '—' }}</td>
                <td><span class="badge" [attr.data-status]="t.status">{{ formatStatus(t.status) }}</span></td>
                <td><button class="icon-btn" (click)="edit(t)"><span class="material-icons-round">edit</span></button></td>
              </tr>
            }
          </tbody>
        </table>
        @if (!bookings.length) { <p class="empty">No taxi bookings found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog large" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Taxi Booking' : 'Book Taxi' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field"><label>Requested By *</label><input [(ngModel)]="form.requested_by"></div>
                <div class="field"><label>Department</label><input [(ngModel)]="form.department"></div>
                <div class="field"><label>Passenger Name *</label><input [(ngModel)]="form.passenger_name"></div>
                <div class="field"><label>Passenger Phone</label><input [(ngModel)]="form.passenger_phone"></div>
                <div class="field"><label>Pickup Location *</label><input [(ngModel)]="form.pickup_location"></div>
                <div class="field"><label>Drop Location *</label><input [(ngModel)]="form.drop_location"></div>
                <div class="field"><label>Pickup Date *</label><input type="date" [(ngModel)]="form.pickup_date"></div>
                <div class="field"><label>Pickup Time *</label><input type="time" [(ngModel)]="form.pickup_time"></div>
                <div class="field"><label>No. Passengers</label><input type="number" [(ngModel)]="form.num_passengers" min="1" max="10"></div>
                <div class="field"><label>Return Trip</label><select [(ngModel)]="form.return_trip"><option [ngValue]="0">No</option><option [ngValue]="1">Yes</option></select></div>
                @if (form.return_trip) {
                  <div class="field"><label>Return Date</label><input type="date" [(ngModel)]="form.return_date"></div>
                  <div class="field"><label>Return Time</label><input type="time" [(ngModel)]="form.return_time"></div>
                }
                <div class="field"><label>Taxi Company</label><input [(ngModel)]="form.taxi_company"></div>
                <div class="field"><label>Driver Name</label><input [(ngModel)]="form.driver_name"></div>
                <div class="field"><label>Driver Phone</label><input [(ngModel)]="form.driver_phone"></div>
                <div class="field"><label>Vehicle No</label><input [(ngModel)]="form.vehicle_no"></div>
                <div class="field"><label>Fare Estimate (₹)</label><input type="number" [(ngModel)]="form.fare_estimate"></div>
                @if (editing) {
                  <div class="field"><label>Actual Fare (₹)</label><input type="number" [(ngModel)]="form.actual_fare"></div>
                  <div class="field"><label>Status</label><select [(ngModel)]="form.status">
                    <option value="requested">Requested</option><option value="confirmed">Confirmed</option>
                    <option value="dispatched">Dispatched</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                }
                <div class="field full"><label>Purpose</label><input [(ngModel)]="form.purpose"></div>
                <div class="field full"><label>Remarks</label><textarea [(ngModel)]="form.remarks" rows="2"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Book') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-taxi.component.scss',
})
export class ReceptionTaxiComponent implements OnInit {
  bookings: TaxiBooking[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterStatus = '';
  showForm = false; saving = false; editing: TaxiBooking | null = null; form: any = {};
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getTaxiBookings({ search: this.search, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.bookings = r.bookings; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() {
    this.form = { requested_by: '', department: '', passenger_name: '', passenger_phone: '', pickup_location: '', drop_location: '',
      pickup_date: new Date().toISOString().slice(0, 10), pickup_time: '09:00', num_passengers: 1, return_trip: 0,
      return_date: '', return_time: '', taxi_company: '', driver_name: '', driver_phone: '', vehicle_no: '',
      fare_estimate: '', actual_fare: '', purpose: '', remarks: '' };
  }
  edit(t: TaxiBooking) { this.editing = t; this.form = { ...t }; this.showForm = true; }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateTaxiBooking(this.editing.id, this.form) : this.svc.createTaxiBooking(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
  formatStatus(s: string): string { return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
