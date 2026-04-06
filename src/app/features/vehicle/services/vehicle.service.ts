import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VehicleEntry {
  id: number; entry_no: string; vehicle_no: string; vehicle_type: string;
  driver_name: string; driver_phone: string; driver_license: string;
  driver_id_type: string; driver_id_number: string; contact_phone: string;
  visitor_type: string; company: string; purpose: string; department: string;
  dock_id: number; dock_name: string; po_reference: string; material_desc: string;
  in_time: string; out_time: string; in_weight: number; out_weight: number;
  status: string; gate_pass_no: string; security_remarks: string;
  badge_no: string; plant_entry: string; ppe_issued: string; ppe_returned: string;
  food_required: string; food_count: number;
  security_in: string; security_out: string;
  host_name: string; host_department: string; host_phone: string;
  visit_confirmed: boolean; visit_confirmed_by: string; visit_confirmed_at: string;
  photo_data: string; id_proof_data: string; special_instructions: string;
  created_at: string;
}

export interface Vehicle {
  id: number; vehicle_no: string; vehicle_type: string; make: string; model: string;
  year: number; color: string; fuel_type: string; seating_capacity: number;
  registration_date: string; insurance_expiry: string; fitness_expiry: string;
  puc_expiry: string; assigned_department: string; assigned_driver_id: number;
  driver_name: string; current_km: number; status: string; remarks: string;
}

export interface GateLogEntry {
  id: number; vehicle_id: number; vehicle_no: string; make: string; model: string;
  driver_id: number; driver_name: string; gate_out_time: string; gate_out_km: number;
  gate_out_by: string; gate_in_time: string; gate_in_km: number; gate_in_by: string;
  gate_name: string; purpose: string; destination: string; remarks: string;
}

export interface TripRequest {
  id: number; request_no: string; requested_by: string; department: string;
  vehicle_id: number; vehicle_no: string; make: string; model: string;
  driver_id: number; driver_name_full: string; purpose: string; destination: string;
  trip_date: string; trip_time: string; return_date: string; return_time: string;
  passengers: number; passenger_names: string; status: string;
  approved_by: number; approved_at: string; remarks: string; created_at: string;
}

export interface Driver {
  id: number; name: string; phone: string; license_no: string; license_type: string;
  license_expiry: string; status: string;
}

export interface Dock {
  id: number; dock_name: string; dock_type: string; status: string;
}

export interface VehicleStats {
  totalVehicles: number; activeEntries: number; todayEntries: number;
  pendingTrips: number; todayGateOut: number; currentlyOut: number;
  purposeBreakdown: { purpose: string; count: number }[];
  vehicleStatus: { status: string; count: number }[];
  recentEntries: VehicleEntry[];
  dailyCounts: { date: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly API = `${environment.apiUrl}/vehicle`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<VehicleStats> { return this.http.get<VehicleStats>(`${this.API}/stats`); }

  // Entries
  getEntries(params: { status?: string; purpose?: string; date?: string; page?: number; limit?: number } = {}): Observable<{ entries: VehicleEntry[]; total: number; page: number }> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get<any>(`${this.API}/entries`, { params: hp });
  }
  getEntry(id: number): Observable<VehicleEntry> { return this.http.get<VehicleEntry>(`${this.API}/entries/${id}`); }
  createEntry(data: Record<string, any>): Observable<{ id: number; entry_no: string; badge_no: string; message: string }> { return this.http.post<any>(`${this.API}/entries`, data); }
  checkoutEntry(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.post<any>(`${this.API}/entries/${id}/checkout`, data); }
  updateEntryStatus(id: number, status: string): Observable<{ message: string }> { return this.http.post<any>(`${this.API}/entries/${id}/status`, { status }); }

  // Fleet
  getFleet(): Observable<Vehicle[]> { return this.http.get<Vehicle[]>(`${this.API}/fleet`); }
  getVehicle(id: number): Observable<Vehicle> { return this.http.get<Vehicle>(`${this.API}/fleet/${id}`); }
  addVehicle(data: Record<string, any>): Observable<{ id: number; message: string }> { return this.http.post<any>(`${this.API}/fleet`, data); }

  // Drivers & Docks
  getDrivers(): Observable<Driver[]> { return this.http.get<Driver[]>(`${this.API}/drivers`); }
  getDocks(): Observable<Dock[]> { return this.http.get<Dock[]>(`${this.API}/docks`); }

  // Gate Log
  getGateLog(params: { date?: string; pending?: boolean } = {}): Observable<GateLogEntry[]> {
    let hp = new HttpParams();
    if (params.date) hp = hp.set('date', params.date);
    if (params.pending) hp = hp.set('pending', 'true');
    return this.http.get<GateLogEntry[]>(`${this.API}/gate-log`, { params: hp });
  }
  gateOut(data: Record<string, any>): Observable<{ id: number; message: string }> { return this.http.post<any>(`${this.API}/gate-log/out`, data); }
  gateIn(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.post<any>(`${this.API}/gate-log/${id}/in`, data); }

  // Trip Requests
  getTrips(params: { status?: string } = {}): Observable<TripRequest[]> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    return this.http.get<TripRequest[]>(`${this.API}/trips`, { params: hp });
  }
  createTrip(data: Record<string, any>): Observable<{ id: number; request_no: string; message: string }> { return this.http.post<any>(`${this.API}/trips`, data); }
  approveTrip(id: number, action: string, data: Record<string, any> = {}): Observable<{ message: string }> { return this.http.post<any>(`${this.API}/trips/${id}/approve`, { action, ...data }); }

  // Settings
  getSettings(): Observable<Record<string, string>> { return this.http.get<Record<string, string>>(`${this.API}/settings`); }
  updateSettings(data: Record<string, string>): Observable<{ success: boolean }> { return this.http.post<any>(`${this.API}/settings`, data); }

  // Lookup (PPG-style auto-fill)
  lookup(params: { phone?: string; vehicle_no?: string }): Observable<{ found: boolean; entry?: any; visitCount?: number }> {
    let hp = new HttpParams();
    if (params.phone) hp = hp.set('phone', params.phone);
    if (params.vehicle_no) hp = hp.set('vehicle_no', params.vehicle_no);
    return this.http.get<any>(`${this.API}/lookup`, { params: hp });
  }

  // Currently inside
  getCurrentlyInside(): Observable<VehicleEntry[]> { return this.http.get<VehicleEntry[]>(`${this.API}/currently-inside`); }

  // Visit confirmation
  getPendingConfirmations(): Observable<VehicleEntry[]> { return this.http.get<VehicleEntry[]>(`${this.API}/pending-confirmations`); }
  confirmVisit(id: number): Observable<{ message: string }> { return this.http.post<any>(`${this.API}/entries/${id}/confirm-visit`, {}); }

  // Reports
  getReports(from: string, to: string, type?: string): Observable<{ entries: VehicleEntry[]; summary: any; from: string; to: string }> {
    let hp = new HttpParams().set('from', from).set('to', to);
    if (type) hp = hp.set('type', type);
    return this.http.get<any>(`${this.API}/reports`, { params: hp });
  }

  // Activity log
  getLog(entryId?: number): Observable<any[]> {
    let hp = new HttpParams();
    if (entryId) hp = hp.set('entry_id', String(entryId));
    return this.http.get<any[]>(`${this.API}/log`, { params: hp });
  }

  // Print pass
  getPass(id: number): Observable<VehicleEntry> { return this.http.get<VehicleEntry>(`${this.API}/entries/${id}/pass`); }
}
