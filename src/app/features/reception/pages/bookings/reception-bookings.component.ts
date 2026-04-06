import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, RoomBooking, MeetingRoom } from '../../services/reception.service';

@Component({
  selector: 'app-reception-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Room Bookings</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Book Room</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search booker, purpose..." [(ngModel)]="search" (input)="load()">
        <input type="date" [(ngModel)]="filterDate" (change)="load()">
        <select [(ngModel)]="filterRoom" (change)="load()"><option value="">All Rooms</option>
          <option *ngFor="let r of rooms" [value]="r.id">{{ r.name }} ({{ r.capacity }})</option></select>
        <select [(ngModel)]="filterStatus" (change)="load()"><option value="">All Status</option>
          <option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select>
      </div>

      <!-- Room Cards -->
      <div class="room-cards">
        @for (r of rooms; track r.id) {
          <div class="room-card" [class.active]="filterRoom === String(r.id)" (click)="filterRoom = String(r.id); load()">
            <span class="material-icons-round room-icon">meeting_room</span>
            <div class="rc-name">{{ r.name }}</div>
            <div class="rc-cap"><span class="material-icons-round">people</span>{{ r.capacity }}</div>
          </div>
        }
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Room</th><th>Date</th><th>Time</th><th>Booked By</th><th>Department</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (b of bookings; track b.id) {
              <tr>
                <td class="fw-600">{{ b.room_name || 'Room ' + b.room_id }}<br><small class="text-muted">{{ b.room_location }}</small></td>
                <td>{{ b.booking_date | date:'mediumDate' }}</td>
                <td class="mono">{{ b.start_time?.slice(0,5) }} - {{ b.end_time?.slice(0,5) }}</td>
                <td class="fw-600">{{ b.booked_by }}</td>
                <td>{{ b.department }}</td>
                <td>{{ b.purpose }}</td>
                <td><span class="badge" [attr.data-status]="b.status">{{ b.status }}</span></td>
                <td>
                  <button class="icon-btn" (click)="edit(b)"><span class="material-icons-round">edit</span></button>
                  @if (b.status !== 'cancelled') {
                    <button class="icon-btn cancel" (click)="cancel(b)" title="Cancel"><span class="material-icons-round">event_busy</span></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!bookings.length) { <p class="empty">No bookings found</p> }
      </div>
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page <= 1" (click)="page = page - 1; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page >= totalPages" (click)="page = page + 1; load()">Next</button>
      </div>

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Booking' : 'Book Meeting Room' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              @if (conflictMsg) { <div class="conflict-alert"><span class="material-icons-round">warning</span>{{ conflictMsg }}</div> }
              <div class="form-grid">
                <div class="field"><label>Room *</label>
                  <select [(ngModel)]="form.room_id"><option *ngFor="let r of rooms" [value]="r.id">{{ r.name }} (Cap: {{ r.capacity }})</option></select></div>
                <div class="field"><label>Date *</label><input type="date" [(ngModel)]="form.booking_date"></div>
                <div class="field"><label>Start Time *</label><input type="time" [(ngModel)]="form.start_time"></div>
                <div class="field"><label>End Time *</label><input type="time" [(ngModel)]="form.end_time"></div>
                <div class="field"><label>Booked By *</label><input [(ngModel)]="form.booked_by"></div>
                <div class="field"><label>Department *</label><input [(ngModel)]="form.department"></div>
                <div class="field full"><label>Purpose *</label><input [(ngModel)]="form.purpose" placeholder="Meeting agenda"></div>
                @if (editing) {
                  <div class="field"><label>Status</label><select [(ngModel)]="form.status">
                    <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div>
                }
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
  styleUrl: './reception-bookings.component.scss',
})
export class ReceptionBookingsComponent implements OnInit {
  bookings: RoomBooking[] = []; rooms: MeetingRoom[] = []; total = 0; page = 1; limit = 20;
  search = ''; filterDate = ''; filterRoom = ''; filterStatus = '';
  showForm = false; saving = false; editing: RoomBooking | null = null; form: any = {};
  conflictMsg = '';
  get totalPages() { return Math.ceil(this.total / this.limit); }
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  String = String;

  ngOnInit() { this.svc.getRooms().subscribe(r => { this.rooms = r; this.cdr.markForCheck(); }); this.load(); }

  load() {
    this.svc.getBookings({ search: this.search, date: this.filterDate, room_id: this.filterRoom, status: this.filterStatus, page: this.page, limit: this.limit })
      .subscribe(r => { this.bookings = r.bookings; this.total = r.total; this.cdr.markForCheck(); });
  }
  resetForm() {
    this.form = { room_id: this.rooms[0]?.id || 1, booking_date: new Date().toISOString().slice(0, 10), start_time: '09:00', end_time: '10:00', booked_by: '', department: '', purpose: '', remarks: '', status: 'confirmed' };
    this.conflictMsg = '';
  }
  edit(b: RoomBooking) { this.editing = b; this.form = { ...b }; this.conflictMsg = ''; this.showForm = true; }
  cancel(b: RoomBooking) { this.svc.updateBooking(b.id, { status: 'cancelled' }).subscribe(() => this.load()); }
  save() {
    this.saving = true; this.conflictMsg = '';
    const obs = this.editing ? this.svc.updateBooking(this.editing.id, this.form) : this.svc.createBooking(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); },
      error: (e: any) => { this.saving = false; this.conflictMsg = e.error?.error || 'Failed to save'; this.cdr.markForCheck(); }
    });
  }
}
