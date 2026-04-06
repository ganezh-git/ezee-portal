import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService, Member } from '../../services/library.service';

@Component({
  selector: 'app-library-members',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">people</span> Members</h1>
        <button class="btn-primary" (click)="openForm()"><span class="material-icons-round">person_add</span> Add Member</button>
      </div>

      <div class="filters">
        <div class="search-box">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="Search name, email, member #..." [(ngModel)]="search" (keyup.enter)="load()" />
        </div>
        <select [(ngModel)]="filterType" (change)="load()">
          <option value="">All Types</option>
          @for (t of memberTypes; track t) { <option [value]="t">{{ t }}</option> }
        </select>
        <select [(ngModel)]="filterStatus" (change)="load()">
          <option value="">All Status</option>
          <option value="active">Active</option><option value="suspended">Suspended</option>
          <option value="expired">Expired</option><option value="blacklisted">Blacklisted</option>
        </select>
        <button class="btn-search" (click)="load()"><span class="material-icons-round">search</span></button>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <div class="results-info">{{ total }} members found</div>
        <div class="member-grid">
          @for (m of members; track m.id) {
            <div class="member-card" [class]="m.status">
              <div class="member-avatar"><span class="material-icons-round">person</span></div>
              <div class="member-info">
                <h3>{{ m.name }}</h3>
                <span class="member-no">{{ m.member_no }}</span>
                <div class="member-meta">
                  <span class="badge type-badge">{{ m.member_type }}</span>
                  <span class="badge status-badge" [class]="m.status">{{ m.status }}</span>
                </div>
                @if (m.department) { <p><span class="material-icons-round tiny">business</span> {{ m.department }}</p> }
                @if (m.institution) { <p><span class="material-icons-round tiny">school</span> {{ m.institution }}</p> }
                @if (m.email) { <p><span class="material-icons-round tiny">email</span> {{ m.email }}</p> }
                @if (m.phone) { <p><span class="material-icons-round tiny">phone</span> {{ m.phone }}</p> }
                <div class="member-limits">
                  <span>Max {{ m.max_books }} books</span> · <span>{{ m.max_days }} days</span>
                </div>
              </div>
              <div class="member-actions">
                <button class="icon-btn" title="Edit" (click)="editMember(m)"><span class="material-icons-round">edit</span></button>
              </div>
            </div>
          } @empty {
            <div class="empty"><span class="material-icons-round">people</span><p>No members found</p></div>
          }
        </div>

        @if (totalPages > 1) {
          <div class="pagination">
            <button (click)="goPage(page - 1)" [disabled]="page <= 1">Previous</button>
            <span>Page {{ page }} of {{ totalPages }}</span>
            <button (click)="goPage(page + 1)" [disabled]="page >= totalPages">Next</button>
          </div>
        }
      }

      <!-- Add/Edit Dialog -->
      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editId ? 'Edit Member' : 'Add New Member' }}</h2>
              <button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="form-group span-2"><label>Full Name *</label><input type="text" [(ngModel)]="form.name" required /></div>
                <div class="form-group"><label>Email</label><input type="email" [(ngModel)]="form.email" /></div>
                <div class="form-group"><label>Phone</label><input type="tel" [(ngModel)]="form.phone" /></div>
                <div class="form-group"><label>Member Type *</label>
                  <select [(ngModel)]="form.member_type">
                    @for (t of memberTypes; track t) { <option [value]="t">{{ t }}</option> }
                  </select>
                </div>
                <div class="form-group"><label>Status</label>
                  <select [(ngModel)]="form.status">
                    <option value="active">Active</option><option value="suspended">Suspended</option>
                    <option value="expired">Expired</option><option value="blacklisted">Blacklisted</option>
                  </select>
                </div>
                <div class="form-group"><label>Department</label><input type="text" [(ngModel)]="form.department" /></div>
                <div class="form-group"><label>Institution</label><input type="text" [(ngModel)]="form.institution" /></div>
                <div class="form-group"><label>Class / Section</label><input type="text" [(ngModel)]="form.class_section" /></div>
                <div class="form-group"><label>Roll No</label><input type="text" [(ngModel)]="form.roll_no" /></div>
                <div class="form-group"><label>Max Books</label><input type="number" [(ngModel)]="form.max_books" min="1" /></div>
                <div class="form-group"><label>Max Days</label><input type="number" [(ngModel)]="form.max_days" min="1" /></div>
                <div class="form-group"><label>Expiry Date</label><input type="date" [(ngModel)]="form.expiry_date" /></div>
                <div class="form-group"><label>Photo URL</label><input type="text" [(ngModel)]="form.photo_url" /></div>
                <div class="form-group span-2"><label>Address</label><textarea [(ngModel)]="form.address" rows="2"></textarea></div>
                <div class="form-group span-2"><label>Notes</label><textarea [(ngModel)]="form.notes" rows="2"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="showForm = false">Cancel</button>
              <button class="btn-primary" (click)="saveMember()" [disabled]="saving">
                {{ saving ? 'Saving...' : (editId ? 'Update' : 'Add Member') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './library-members.component.scss',
})
export class LibraryMembersComponent implements OnInit {
  members: Member[] = [];
  total = 0; page = 1; limit = 20;
  search = ''; filterType = ''; filterStatus = '';
  loading = true; showForm = false; saving = false;
  editId: number | null = null;
  memberTypes = ['student', 'faculty', 'staff', 'researcher', 'external', 'corporate', 'public'];

  form: any = this.emptyForm();

  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getMembers({ search: this.search, type: this.filterType, status: this.filterStatus, page: this.page, limit: this.limit }).subscribe({
      next: r => { this.members = r.members; this.total = r.total; this.page = r.page; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  goPage(p: number): void { if (p >= 1 && p <= this.totalPages) { this.page = p; this.load(); } }

  openForm(): void { this.editId = null; this.form = this.emptyForm(); this.showForm = true; }

  editMember(m: Member): void { this.editId = m.id; this.form = { ...m }; this.showForm = true; }

  saveMember(): void {
    if (!this.form.name) return;
    this.saving = true;
    const req = this.editId ? this.svc.updateMember(this.editId, this.form) : this.svc.createMember(this.form);
    req.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); },
    });
  }

  private emptyForm(): any {
    return {
      name: '', email: '', phone: '', member_type: 'student', department: '', institution: '',
      class_section: '', roll_no: '', photo_url: '', max_books: 3, max_days: 14,
      expiry_date: '', status: 'active', address: '', notes: '',
    };
  }
}
