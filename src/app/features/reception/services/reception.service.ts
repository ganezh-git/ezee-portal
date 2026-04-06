import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Visitor {
  id: number; visitor_name: string; visitor_type: string; company: string;
  phone: string; email: string; id_type: string; id_number: string;
  purpose: string; host_name: string; host_department: string;
  badge_no: string; vehicle_no: string; items_carried: string;
  check_in: string; check_out: string; status: string;
  remarks: string; photo_path: string; created_at: string;
}

export interface Parcel {
  id: number; tracking_no: string; sender_name: string; sender_company: string;
  recipient_name: string; recipient_dept: string; parcel_type: string;
  status: string; received_at: string; collected_at: string;
  collected_by: string; remarks: string;
}

export interface Courier {
  id: number; tracking_no: string; courier_company: string; type: string;
  sender_name: string; sender_company: string; sender_phone: string;
  recipient_name: string; recipient_dept: string; description: string;
  weight: string; status: string; received_at: string; dispatched_at: string;
  collected_at: string; collected_by: string; awb_no: string; remarks: string;
}

export interface MeetingRoom { id: number; name: string; capacity: number; location: string; amenities: string; is_active: number; }
export interface RoomBooking {
  id: number; room_id: number; booked_by: string; department: string;
  purpose: string; booking_date: string; start_time: string; end_time: string;
  status: string; remarks: string; room_name?: string; capacity?: number;
  room_location?: string; amenities?: string; created_at: string;
}

export interface KeyEntry {
  id: number; key_tag: string; key_label: string; key_type: string;
  location: string; issued_to: string; issued_by: string; issued_at: string;
  returned_at: string; returned_to: string; status: string; remarks: string;
}

export interface PhoneContact {
  id: number; name: string; designation: string; department: string;
  ext_no: string; phone: string; email: string; is_active: number;
}

export interface TaxiBooking {
  id: number; booking_no: string; requested_by: string; department: string;
  passenger_name: string; passenger_phone: string; pickup_location: string;
  drop_location: string; pickup_date: string; pickup_time: string;
  return_trip: number; return_date: string; return_time: string;
  num_passengers: number; taxi_company: string; driver_name: string;
  driver_phone: string; vehicle_no: string; fare_estimate: number;
  actual_fare: number; purpose: string; status: string; remarks: string; created_at: string;
}

export interface Complaint {
  id: number; complaint_no: string; complainant_name: string; department: string;
  category: string; priority: string; location: string; description: string;
  assigned_to: string; resolution: string; resolved_at: string;
  status: string; created_at: string;
}

export interface AmenityRequest {
  id: number; request_no: string; requested_by: string; department: string;
  amenity_type: string; location: string; quantity: number; needed_by: string;
  status: string; fulfilled_by: string; fulfilled_at: string;
  remarks: string; created_at: string;
}

export interface Badge { id: number; badge_no: string; badge_type: string; is_available: number; }

export interface ReceptionStats {
  visitorsToday: number; checkedIn: number;
  parcelsToday: number; parcelsUncollected: number;
  couriersToday: number; couriersUncollected: number;
  keysIssued: number; bookingsToday: number;
  taxiToday: number; complaintsOpen: number;
  amenitiesPending: number; badgesAvailable: number;
  recentVisitors: Visitor[]; todayBookings: RoomBooking[];
  pendingParcels: Parcel[]; openComplaints: Complaint[];
}

@Injectable({ providedIn: 'root' })
export class ReceptionService {
  private readonly API = `${environment.apiUrl}/reception`;
  constructor(private http: HttpClient) {}

  getStats(): Observable<ReceptionStats> { return this.http.get<ReceptionStats>(`${this.API}/stats`); }

  // Visitors
  getVisitors(params: Record<string, any> = {}): Observable<{ visitors: Visitor[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/visitors`, { params: this.toP(params) }); }
  createVisitor(data: any): Observable<any> { return this.http.post<any>(`${this.API}/visitors`, data); }
  updateVisitor(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/visitors/${id}`, data); }

  // Parcels
  getParcels(params: Record<string, any> = {}): Observable<{ parcels: Parcel[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/parcels`, { params: this.toP(params) }); }
  createParcel(data: any): Observable<any> { return this.http.post<any>(`${this.API}/parcels`, data); }
  updateParcel(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/parcels/${id}`, data); }

  // Couriers
  getCouriers(params: Record<string, any> = {}): Observable<{ couriers: Courier[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/couriers`, { params: this.toP(params) }); }
  createCourier(data: any): Observable<any> { return this.http.post<any>(`${this.API}/couriers`, data); }
  updateCourier(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/couriers/${id}`, data); }

  // Rooms & Bookings
  getRooms(): Observable<MeetingRoom[]> { return this.http.get<MeetingRoom[]>(`${this.API}/rooms`); }
  getBookings(params: Record<string, any> = {}): Observable<{ bookings: RoomBooking[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/bookings`, { params: this.toP(params) }); }
  createBooking(data: any): Observable<any> { return this.http.post<any>(`${this.API}/bookings`, data); }
  updateBooking(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/bookings/${id}`, data); }

  // Keys
  getKeys(params: Record<string, any> = {}): Observable<{ keys: KeyEntry[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/keys`, { params: this.toP(params) }); }
  createKey(data: any): Observable<any> { return this.http.post<any>(`${this.API}/keys`, data); }
  updateKey(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/keys/${id}`, data); }

  // Directory
  getDirectory(params: Record<string, any> = {}): Observable<PhoneContact[]> { return this.http.get<PhoneContact[]>(`${this.API}/directory`, { params: this.toP(params) }); }
  createContact(data: any): Observable<any> { return this.http.post<any>(`${this.API}/directory`, data); }
  updateContact(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/directory/${id}`, data); }

  // Taxi
  getTaxiBookings(params: Record<string, any> = {}): Observable<{ bookings: TaxiBooking[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/taxi`, { params: this.toP(params) }); }
  createTaxiBooking(data: any): Observable<any> { return this.http.post<any>(`${this.API}/taxi`, data); }
  updateTaxiBooking(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/taxi/${id}`, data); }

  // Complaints
  getComplaints(params: Record<string, any> = {}): Observable<{ complaints: Complaint[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/complaints`, { params: this.toP(params) }); }
  createComplaint(data: any): Observable<any> { return this.http.post<any>(`${this.API}/complaints`, data); }
  updateComplaint(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/complaints/${id}`, data); }

  // Amenities
  getAmenities(params: Record<string, any> = {}): Observable<{ requests: AmenityRequest[]; total: number; page: number }> { return this.http.get<any>(`${this.API}/amenities`, { params: this.toP(params) }); }
  createAmenity(data: any): Observable<any> { return this.http.post<any>(`${this.API}/amenities`, data); }
  updateAmenity(id: number, data: any): Observable<any> { return this.http.put<any>(`${this.API}/amenities/${id}`, data); }

  // Badges
  getBadges(): Observable<Badge[]> { return this.http.get<Badge[]>(`${this.API}/badges`); }

  private toP(obj: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== null) hp = hp.set(k, String(v)); });
    return hp;
  }
}
