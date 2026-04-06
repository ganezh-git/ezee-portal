import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Book {
  id: number; isbn: string; title: string; subtitle: string; authors: string;
  publisher: string; published_year: number; edition: string; pages: number;
  language: string; cover_url: string; description: string;
  category_id: number; category_name: string; location_id: number; location_name: string;
  material_type: string; subject: string; tags: string;
  accession_no: string; barcode: string; call_number: string;
  quantity: number; available_qty: number; price: number;
  condition_status: string; is_reference_only: number;
  is_digital: number; digital_url: string; open_library_key: string;
  is_active: number; created_at: string;
}

export interface Member {
  id: number; member_no: string; name: string; email: string; phone: string;
  member_type: string; department: string; institution: string;
  class_section: string; roll_no: string; photo_url: string;
  max_books: number; max_days: number; join_date: string; expiry_date: string;
  status: string; address: string; notes: string; created_at: string;
}

export interface BookIssue {
  id: number; issue_no: string; book_id: number; member_id: number;
  title: string; isbn: string; authors: string; cover_url: string;
  member_name: string; member_no: string;
  issue_date: string; due_date: string; return_date: string;
  renewed_count: number; status: string;
  condition_at_issue: string; condition_at_return: string;
  fine_amount: number; fine_paid: number; fine_waived: number;
  issued_by: string; returned_by: string; remarks: string;
}

export interface Reservation {
  id: number; book_id: number; member_id: number;
  title: string; authors: string; member_name: string; member_no: string;
  reserved_date: string; expiry_date: string; status: string;
  notified: number; created_at: string;
}

export interface Fine {
  id: number; member_id: number; issue_id: number;
  member_name: string; member_no: string; title: string; issue_no: string;
  fine_type: string; amount: number; paid_amount: number; waived_amount: number;
  status: string; payment_method: string; receipt_no: string;
  notes: string; created_at: string;
}

export interface DigitalDoc {
  id: number; title: string; doc_type: string; department: string;
  description: string; file_path: string; file_size: number; file_format: string;
  access_level: string; uploaded_by: string; version: string;
  download_count: number; is_active: number; created_at: string;
}

export interface Category {
  id: number; name: string; description: string; parent_id: number;
  parent_name: string; is_active: number;
}

export interface Location {
  id: number; name: string; floor: string; section: string; shelf: string;
  library_type: string; capacity: number; is_active: number;
}

export interface LibStats {
  totalTitles: number; totalCopies: number; availableCopies: number;
  totalMembers: number; activeIssues: number; overdueBooks: number;
  todayIssued: number; todayReturned: number;
  pendingFines: number; activeReservations: number; digitalDocs: number;
  categoryBreakdown: { category: string; count: number }[];
  recentIssues: BookIssue[];
  popularBooks: { id: number; title: string; authors: string; cover_url: string; issue_count: number }[];
  memberTypeBreakdown: { member_type: string; count: number }[];
}

export interface IsbnLookup {
  title: string; authors: string; publisher: string; published_year: number;
  pages: number; cover_url: string; description: string; subjects: string;
  open_library_key: string;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly API = `${environment.apiUrl}/library`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getStats(): Observable<LibStats> { return this.http.get<LibStats>(`${this.API}/stats`); }

  // Books
  getBooks(params: { search?: string; category?: string; type?: string; page?: number; limit?: number } = {}): Observable<{ books: Book[]; total: number; page: number }> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get<any>(`${this.API}/books`, { params: hp });
  }
  getBook(id: number): Observable<Book> { return this.http.get<Book>(`${this.API}/books/${id}`); }
  createBook(data: Record<string, any>): Observable<{ id: number; accession_no: string; message: string }> { return this.http.post<any>(`${this.API}/books`, data); }
  updateBook(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/books/${id}`, data); }
  isbnLookup(isbn: string): Observable<IsbnLookup> { return this.http.get<IsbnLookup>(`${this.API}/isbn-lookup/${isbn}`); }

  // Members
  getMembers(params: { search?: string; type?: string; status?: string; page?: number; limit?: number } = {}): Observable<{ members: Member[]; total: number; page: number }> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get<any>(`${this.API}/members`, { params: hp });
  }
  getMember(id: number): Observable<Member> { return this.http.get<Member>(`${this.API}/members/${id}`); }
  createMember(data: Record<string, any>): Observable<{ id: number; member_no: string; message: string }> { return this.http.post<any>(`${this.API}/members`, data); }
  updateMember(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/members/${id}`, data); }

  // Circulation
  getIssues(params: { status?: string; member_id?: number; page?: number; limit?: number } = {}): Observable<{ issues: BookIssue[]; total: number; page: number }> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get<any>(`${this.API}/issues`, { params: hp });
  }
  issueBook(data: { book_id: number; member_id: number; due_date?: string }): Observable<{ id: number; issue_no: string; due_date: string; message: string }> {
    return this.http.post<any>(`${this.API}/issues`, data);
  }
  returnBook(id: number, data: { condition?: string; remarks?: string }): Observable<{ message: string; fine_amount?: number }> {
    return this.http.post<any>(`${this.API}/issues/${id}/return`, data);
  }
  renewBook(id: number): Observable<{ message: string; new_due_date: string; renewed_count: number }> {
    return this.http.post<any>(`${this.API}/issues/${id}/renew`, {});
  }
  markLost(id: number): Observable<{ message: string; fine_amount: number }> {
    return this.http.post<any>(`${this.API}/issues/${id}/lost`, {});
  }

  // Reservations
  getReservations(params: { status?: string } = {}): Observable<Reservation[]> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    return this.http.get<Reservation[]>(`${this.API}/reservations`, { params: hp });
  }
  createReservation(data: { book_id: number; member_id: number }): Observable<{ id: number; expiry_date: string; message: string }> {
    return this.http.post<any>(`${this.API}/reservations`, data);
  }
  cancelReservation(id: number): Observable<{ message: string }> {
    return this.http.post<any>(`${this.API}/reservations/${id}/cancel`, {});
  }

  // Fines
  getFines(params: { status?: string; member_id?: number } = {}): Observable<Fine[]> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get<Fine[]>(`${this.API}/fines`, { params: hp });
  }
  payFine(id: number, data: { amount: number; method: string }): Observable<{ message: string; receipt_no: string }> {
    return this.http.post<any>(`${this.API}/fines/${id}/pay`, data);
  }
  waiveFine(id: number, data: { amount: number; reason: string }): Observable<{ message: string }> {
    return this.http.post<any>(`${this.API}/fines/${id}/waive`, data);
  }

  // Digital Documents
  getDigitalDocs(params: { search?: string; type?: string; department?: string } = {}): Observable<DigitalDoc[]> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get<DigitalDoc[]>(`${this.API}/digital`, { params: hp });
  }
  createDigitalDoc(data: Record<string, any>): Observable<{ id: number; message: string }> {
    return this.http.post<any>(`${this.API}/digital`, data);
  }
  updateDigitalDoc(id: number, data: Record<string, any>): Observable<{ message: string }> {
    return this.http.put<any>(`${this.API}/digital/${id}`, data);
  }

  // Categories & Locations
  getCategories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.API}/categories`); }
  createCategory(data: Record<string, any>): Observable<{ id: number; message: string }> { return this.http.post<any>(`${this.API}/categories`, data); }

  getLocations(): Observable<Location[]> { return this.http.get<Location[]>(`${this.API}/locations`); }
  createLocation(data: Record<string, any>): Observable<{ id: number; message: string }> { return this.http.post<any>(`${this.API}/locations`, data); }

  // Reports
  getReport(type: string, params: { from?: string; to?: string } = {}): Observable<any[]> {
    let hp = new HttpParams().set('type', type);
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);
    return this.http.get<any[]>(`${this.API}/reports`, { params: hp });
  }

  // Settings
  getSettings(): Observable<Record<string, string>> { return this.http.get<Record<string, string>>(`${this.API}/settings`); }
  saveSettings(data: Record<string, string>): Observable<{ message: string }> { return this.http.post<any>(`${this.API}/settings`, data); }

  // Activity Log
  getActivityLog(params: { limit?: number } = {}): Observable<any[]> {
    let hp = new HttpParams();
    if (params.limit) hp = hp.set('limit', String(params.limit));
    return this.http.get<any[]>(`${this.API}/log`, { params: hp });
  }
}
