import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LibraryService, BookIssue, Book, Member, Reservation, Fine } from '../../services/library.service';

@Component({
  selector: 'app-library-circulation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">swap_horiz</span> Circulation Desk</h1>
        <div class="header-actions">
          <button class="btn-primary" (click)="showIssueDialog = true"><span class="material-icons-round">book</span> Issue Book</button>
          <button class="btn-outline" (click)="showReturnDialog = true"><span class="material-icons-round">assignment_return</span> Return Book</button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="qs active"><span class="material-icons-round">book</span><span class="qs-val">{{ issuedCount }}</span><span class="qs-lbl">Issued</span></div>
        <div class="qs overdue"><span class="material-icons-round">warning</span><span class="qs-val">{{ overdueCount }}</span><span class="qs-lbl">Overdue</span></div>
        <div class="qs reserved"><span class="material-icons-round">bookmark</span><span class="qs-val">{{ reservations.length }}</span><span class="qs-lbl">Reservations</span></div>
        <div class="qs fines"><span class="material-icons-round">receipt_long</span><span class="qs-val">₹{{ pendingFineTotal }}</span><span class="qs-lbl">Pending Fines</span></div>
      </div>

      <!-- Tab Filter -->
      <div class="tabs">
        <button [class.active]="tab === 'issued'" (click)="tab = 'issued'; loadIssues()">Issued ({{ issuedCount }})</button>
        <button [class.active]="tab === 'overdue'" (click)="tab = 'overdue'; loadIssues()">Overdue ({{ overdueCount }})</button>
        <button [class.active]="tab === 'returned'" (click)="tab = 'returned'; loadIssues()">Returned</button>
        <button [class.active]="tab === 'lost'" (click)="tab = 'lost'; loadIssues()">Lost</button>
        <button [class.active]="tab === 'reservations'" (click)="tab = 'reservations'">Reservations</button>
        <button [class.active]="tab === 'fines'" (click)="tab = 'fines'">Fines</button>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <!-- Issues Table -->
        @if (tab !== 'reservations' && tab !== 'fines') {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Issue #</th><th>Book</th><th>Member</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Renewals</th><th>Fine</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                @for (i of issues; track i.id) {
                  <tr [class.overdue-row]="isOverdue(i)">
                    <td class="mono">{{ i.issue_no }}</td>
                    <td>
                      <strong>{{ i.title }}</strong>
                      <br><small class="muted">{{ i.authors }}</small>
                    </td>
                    <td>{{ i.member_name }}<br><small class="muted">{{ i.member_no }}</small></td>
                    <td>{{ formatDate(i.issue_date) }}</td>
                    <td [class.overdue-text]="isOverdue(i)">{{ formatDate(i.due_date) }}</td>
                    <td>{{ i.return_date ? formatDate(i.return_date) : '—' }}</td>
                    <td class="center">{{ i.renewed_count }}/{{ maxRenewals }}</td>
                    <td>@if (i.fine_amount > 0) { <span class="fine-amt">₹{{ i.fine_amount }}</span> } @else { — }</td>
                    <td><span class="badge" [class]="i.status">{{ i.status }}</span></td>
                    <td>
                      @if (i.status === 'issued' || i.status === 'overdue') {
                        <button class="icon-btn" title="Return" (click)="returnIssue(i)"><span class="material-icons-round">assignment_return</span></button>
                        <button class="icon-btn" title="Renew" (click)="renewIssue(i)"><span class="material-icons-round">refresh</span></button>
                        <button class="icon-btn danger" title="Mark Lost" (click)="markLost(i)"><span class="material-icons-round">report_problem</span></button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="10" class="empty-row">No records found</td></tr>
                }
              </tbody>
            </table>
          </div>
          @if (issueTotalPages > 1) {
            <div class="pagination">
              <button (click)="goIssuePage(issuePage - 1)" [disabled]="issuePage <= 1">Previous</button>
              <span>Page {{ issuePage }} of {{ issueTotalPages }}</span>
              <button (click)="goIssuePage(issuePage + 1)" [disabled]="issuePage >= issueTotalPages">Next</button>
            </div>
          }
        }

        <!-- Reservations Tab -->
        @if (tab === 'reservations') {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Book</th><th>Member</th><th>Reserved</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                @for (r of reservations; track r.id) {
                  <tr>
                    <td><strong>{{ r.title }}</strong><br><small class="muted">{{ r.authors }}</small></td>
                    <td>{{ r.member_name }}<br><small class="muted">{{ r.member_no }}</small></td>
                    <td>{{ formatDate(r.reserved_date) }}</td>
                    <td>{{ formatDate(r.expiry_date) }}</td>
                    <td><span class="badge" [class]="r.status">{{ r.status }}</span></td>
                    <td>
                      @if (r.status === 'active') {
                        <button class="icon-btn danger" title="Cancel" (click)="cancelReservation(r)"><span class="material-icons-round">cancel</span></button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty-row">No reservations</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Fines Tab -->
        @if (tab === 'fines') {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Book</th><th>Type</th><th>Amount</th><th>Paid</th><th>Waived</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                @for (f of fines; track f.id) {
                  <tr>
                    <td>{{ f.member_name }}<br><small class="muted">{{ f.member_no }}</small></td>
                    <td>{{ f.title }}<br><small class="muted">{{ f.issue_no }}</small></td>
                    <td><span class="badge fine-type">{{ f.fine_type }}</span></td>
                    <td class="mono">₹{{ f.amount }}</td>
                    <td class="mono green-text">₹{{ f.paid_amount }}</td>
                    <td class="mono">₹{{ f.waived_amount }}</td>
                    <td class="mono bold">₹{{ f.amount - f.paid_amount - f.waived_amount }}</td>
                    <td><span class="badge" [class]="f.status">{{ f.status }}</span></td>
                    <td>
                      @if (f.status === 'pending' || f.status === 'partial') {
                        <button class="icon-btn" title="Pay" (click)="payFine(f)"><span class="material-icons-round">payments</span></button>
                        <button class="icon-btn" title="Waive" (click)="waiveFine(f)"><span class="material-icons-round">money_off</span></button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="9" class="empty-row">No fines</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- Issue Book Dialog -->
      @if (showIssueDialog) {
        <div class="overlay" (click)="showIssueDialog = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2><span class="material-icons-round">book</span> Issue Book</h2>
              <button class="close-btn" (click)="showIssueDialog = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <div class="form-group">
                <label>Search Book (title, ISBN, accession #)</label>
                <input type="text" [(ngModel)]="bookSearch" (input)="searchBooks()" placeholder="Type to search..." />
                @if (bookResults.length) {
                  <div class="search-results">
                    @for (b of bookResults; track b.id) {
                      <div class="search-item" [class.selected]="issueForm.book_id === b.id" (click)="selectBook(b)">
                        <strong>{{ b.title }}</strong> <small>{{ b.authors }}</small>
                        <span class="avail">{{ b.available_qty }}/{{ b.quantity }} available</span>
                      </div>
                    }
                  </div>
                }
              </div>
              <div class="form-group">
                <label>Search Member (name, member #, email)</label>
                <input type="text" [(ngModel)]="memberSearch" (input)="searchMembers()" placeholder="Type to search..." />
                @if (memberResults.length) {
                  <div class="search-results">
                    @for (m of memberResults; track m.id) {
                      <div class="search-item" [class.selected]="issueForm.member_id === m.id" (click)="selectMember(m)">
                        <strong>{{ m.name }}</strong> <small>{{ m.member_no }} · {{ m.member_type }}</small>
                      </div>
                    }
                  </div>
                }
              </div>
              @if (selectedBook && selectedMember) {
                <div class="selected-info">
                  <div class="sel-item"><span class="material-icons-round">menu_book</span>{{ selectedBook.title }} ({{ selectedBook.available_qty }} available)</div>
                  <div class="sel-item"><span class="material-icons-round">person</span>{{ selectedMember.name }} ({{ selectedMember.member_no }}, max {{ selectedMember.max_books }} books / {{ selectedMember.max_days }} days)</div>
                </div>
              }
              <div class="form-group">
                <label>Due Date (optional, defaults to member's max days)</label>
                <input type="date" [(ngModel)]="issueForm.due_date" />
              </div>
              @if (issueError) { <div class="alert error">{{ issueError }}</div> }
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="showIssueDialog = false">Cancel</button>
              <button class="btn-primary" [disabled]="!issueForm.book_id || !issueForm.member_id || issuing" (click)="doIssue()">
                {{ issuing ? 'Issuing...' : 'Issue Book' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Return Book Dialog -->
      @if (showReturnDialog) {
        <div class="overlay" (click)="showReturnDialog = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2><span class="material-icons-round">assignment_return</span> Return Book</h2>
              <button class="close-btn" (click)="showReturnDialog = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              @if (returningIssue) {
                <div class="return-info">
                  <p><strong>Book:</strong> {{ returningIssue.title }}</p>
                  <p><strong>Member:</strong> {{ returningIssue.member_name }} ({{ returningIssue.member_no }})</p>
                  <p><strong>Issue Date:</strong> {{ formatDate(returningIssue.issue_date) }}</p>
                  <p><strong>Due Date:</strong> {{ formatDate(returningIssue.due_date) }}</p>
                  @if (isOverdue(returningIssue)) {
                    <div class="alert warning"><span class="material-icons-round">warning</span> This book is overdue! A fine may be charged.</div>
                  }
                </div>
              }
              <div class="form-group">
                <label>Condition at Return</label>
                <select [(ngModel)]="returnForm.condition">
                  <option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
                </select>
              </div>
              <div class="form-group">
                <label>Remarks</label>
                <textarea [(ngModel)]="returnForm.remarks" rows="2" placeholder="Optional notes..."></textarea>
              </div>
              @if (returnResult) { <div class="alert" [class.warning]="returnResult.includes('Fine')">{{ returnResult }}</div> }
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeReturnDialog()">Close</button>
              @if (returningIssue && !returnResult) {
                <button class="btn-primary" [disabled]="returning" (click)="doReturn()">
                  {{ returning ? 'Processing...' : 'Confirm Return' }}
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Pay Fine Dialog -->
      @if (payingFine) {
        <div class="overlay" (click)="payingFine = null">
          <div class="dialog small" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>Pay Fine</h2>
              <button class="close-btn" (click)="payingFine = null"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <p>Balance: <strong>₹{{ payingFine.amount - payingFine.paid_amount - payingFine.waived_amount }}</strong></p>
              <div class="form-group"><label>Amount</label><input type="number" [(ngModel)]="payAmount" min="1" /></div>
              <div class="form-group"><label>Payment Method</label>
                <select [(ngModel)]="payMethod"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="online">Online</option></select>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="payingFine = null">Cancel</button>
              <button class="btn-primary" (click)="doPayFine()">Pay</button>
            </div>
          </div>
        </div>
      }

      <!-- Notification -->
      @if (notification) {
        <div class="toast" [class]="notificationType"><span class="material-icons-round">{{ notificationType === 'success' ? 'check_circle' : 'info' }}</span> {{ notification }}</div>
      }
    </div>
  `,
  styleUrl: './library-circulation.component.scss',
})
export class LibraryCirculationComponent implements OnInit {
  tab = 'issued';
  issues: BookIssue[] = []; issuedCount = 0; overdueCount = 0;
  reservations: Reservation[] = []; fines: Fine[] = [];
  pendingFineTotal = 0; maxRenewals = 2;
  loading = true;
  issuePage = 1; issueTotal = 0;
  get issueTotalPages(): number { return Math.ceil(this.issueTotal / 20); }

  // Issue dialog
  showIssueDialog = false; issuing = false; issueError = '';
  bookSearch = ''; memberSearch = '';
  bookResults: Book[] = []; memberResults: Member[] = [];
  selectedBook: Book | null = null; selectedMember: Member | null = null;
  issueForm = { book_id: 0, member_id: 0, due_date: '' };

  // Return dialog
  showReturnDialog = false; returning = false; returnResult = '';
  returningIssue: BookIssue | null = null;
  returnForm = { condition: 'good', remarks: '' };

  // Pay fine
  payingFine: Fine | null = null; payAmount = 0; payMethod = 'cash';

  // Notification
  notification = ''; notificationType = 'success';

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['filter'] === 'overdue') this.tab = 'overdue';
    });
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.loadIssues();
    this.svc.getReservations({ status: 'active' }).subscribe(r => { this.reservations = r; this.cdr.markForCheck(); });
    this.svc.getFines({ status: 'pending' }).subscribe(f => {
      this.fines = f;
      this.pendingFineTotal = f.reduce((s, x) => s + (x.amount - x.paid_amount - x.waived_amount), 0);
      this.cdr.markForCheck();
    });
  }

  loadIssues(): void {
    const status = this.tab === 'overdue' ? 'issued' : (this.tab === 'reservations' || this.tab === 'fines' ? '' : this.tab);
    if (!status) { this.loading = false; return; }
    this.svc.getIssues({ status, page: this.issuePage, limit: 20 }).subscribe({
      next: r => {
        this.issues = r.issues;
        this.issueTotal = r.total;
        if (this.tab === 'overdue') {
          this.issues = this.issues.filter(i => new Date(i.due_date) < new Date());
          this.overdueCount = this.issues.length;
        }
        if (this.tab === 'issued') this.issuedCount = r.total;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
    // Also get counts
    this.svc.getIssues({ status: 'issued', limit: 1 }).subscribe(r => { this.issuedCount = r.total; this.cdr.markForCheck(); });
  }

  goIssuePage(p: number): void { if (p >= 1 && p <= this.issueTotalPages) { this.issuePage = p; this.loadIssues(); } }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  isOverdue(i: BookIssue): boolean { return (i.status === 'issued' || i.status === 'overdue') && new Date(i.due_date) < new Date(); }

  // Issue Book
  searchBooks(): void {
    if (this.bookSearch.length < 2) { this.bookResults = []; return; }
    this.svc.getBooks({ search: this.bookSearch, limit: 5 }).subscribe(r => { this.bookResults = r.books; this.cdr.markForCheck(); });
  }
  searchMembers(): void {
    if (this.memberSearch.length < 2) { this.memberResults = []; return; }
    this.svc.getMembers({ search: this.memberSearch, limit: 5 }).subscribe(r => { this.memberResults = r.members; this.cdr.markForCheck(); });
  }
  selectBook(b: Book): void { this.selectedBook = b; this.issueForm.book_id = b.id; this.bookResults = []; }
  selectMember(m: Member): void { this.selectedMember = m; this.issueForm.member_id = m.id; this.memberResults = []; }
  doIssue(): void {
    this.issuing = true; this.issueError = '';
    this.svc.issueBook(this.issueForm).subscribe({
      next: r => {
        this.issuing = false; this.showIssueDialog = false;
        this.showNotification(`Book issued! Issue #${r.issue_no}, due ${r.due_date}`);
        this.resetIssueForm(); this.loadAll();
        this.cdr.markForCheck();
      },
      error: (e: any) => {
        this.issuing = false;
        this.issueError = e.error?.error || 'Failed to issue book';
        this.cdr.markForCheck();
      },
    });
  }
  resetIssueForm(): void {
    this.bookSearch = ''; this.memberSearch = '';
    this.bookResults = []; this.memberResults = [];
    this.selectedBook = null; this.selectedMember = null;
    this.issueForm = { book_id: 0, member_id: 0, due_date: '' };
    this.issueError = '';
  }

  // Return
  returnIssue(i: BookIssue): void {
    this.returningIssue = i; this.returnResult = '';
    this.returnForm = { condition: 'good', remarks: '' };
    this.showReturnDialog = true;
  }
  doReturn(): void {
    if (!this.returningIssue) return;
    this.returning = true;
    this.svc.returnBook(this.returningIssue.id, this.returnForm).subscribe({
      next: r => {
        this.returning = false;
        this.returnResult = r.fine_amount ? `Returned! Fine: ₹${r.fine_amount}` : 'Returned successfully!';
        this.loadAll();
        this.cdr.markForCheck();
      },
      error: () => { this.returning = false; this.returnResult = 'Failed to return'; this.cdr.markForCheck(); },
    });
  }
  closeReturnDialog(): void { this.showReturnDialog = false; this.returningIssue = null; this.returnResult = ''; }

  // Renew
  renewIssue(i: BookIssue): void {
    this.svc.renewBook(i.id).subscribe({
      next: r => { this.showNotification(`Renewed! New due: ${r.new_due_date}`); this.loadAll(); },
      error: (e: any) => { this.showNotification(e.error?.error || 'Cannot renew', 'error'); this.cdr.markForCheck(); },
    });
  }

  // Mark Lost
  markLost(i: BookIssue): void {
    if (!confirm(`Mark "${i.title}" as lost? This will generate a fine.`)) return;
    this.svc.markLost(i.id).subscribe({
      next: r => { this.showNotification(`Marked as lost. Fine: ₹${r.fine_amount}`); this.loadAll(); },
      error: () => { this.showNotification('Failed', 'error'); this.cdr.markForCheck(); },
    });
  }

  // Reservations
  cancelReservation(r: Reservation): void {
    this.svc.cancelReservation(r.id).subscribe({ next: () => { this.loadAll(); this.showNotification('Reservation cancelled'); } });
  }

  // Fines
  payFine(f: Fine): void {
    this.payingFine = f;
    this.payAmount = f.amount - f.paid_amount - f.waived_amount;
    this.payMethod = 'cash';
  }
  doPayFine(): void {
    if (!this.payingFine || this.payAmount <= 0) return;
    this.svc.payFine(this.payingFine.id, { amount: this.payAmount, method: this.payMethod }).subscribe({
      next: r => { this.payingFine = null; this.showNotification(`Fine paid. Receipt: ${r.receipt_no}`); this.loadAll(); },
      error: () => { this.showNotification('Payment failed', 'error'); this.cdr.markForCheck(); },
    });
  }
  waiveFine(f: Fine): void {
    const reason = prompt('Reason for waiving fine:');
    if (!reason) return;
    const amount = f.amount - f.paid_amount - f.waived_amount;
    this.svc.waiveFine(f.id, { amount, reason }).subscribe({
      next: () => { this.showNotification('Fine waived'); this.loadAll(); },
      error: () => { this.showNotification('Failed', 'error'); this.cdr.markForCheck(); },
    });
  }

  showNotification(msg: string, type = 'success'): void {
    this.notification = msg; this.notificationType = type;
    this.cdr.markForCheck();
    setTimeout(() => { this.notification = ''; this.cdr.markForCheck(); }, 4000);
  }
}
