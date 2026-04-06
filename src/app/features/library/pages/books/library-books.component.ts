import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LibraryService, Book, Category, Location, IsbnLookup } from '../../services/library.service';

@Component({
  selector: 'app-library-books',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">menu_book</span> Books Catalog</h1>
        <button class="btn-primary" (click)="openForm()"><span class="material-icons-round">add</span> Add Book</button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="Search title, author, ISBN..." [(ngModel)]="search" (keyup.enter)="load()" />
        </div>
        <select [(ngModel)]="filterCategory" (change)="load()">
          <option value="">All Categories</option>
          @for (c of categories; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <select [(ngModel)]="filterType" (change)="load()">
          <option value="">All Types</option>
          @for (t of materialTypes; track t) { <option [value]="t">{{ t }}</option> }
        </select>
        <button class="btn-search" (click)="load()"><span class="material-icons-round">search</span></button>
      </div>

      <!-- Books Table -->
      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <div class="results-info">{{ total }} books found</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Cover</th><th>Title / Author</th><th>ISBN</th><th>Category</th><th>Type</th><th>Qty</th><th>Available</th><th>Location</th><th>Actions</th></tr></thead>
            <tbody>
              @for (b of books; track b.id) {
                <tr>
                  <td>
                    @if (b.cover_url) { <img [src]="b.cover_url" [alt]="b.title" class="book-cover" /> }
                    @else { <div class="book-cover placeholder"><span class="material-icons-round">menu_book</span></div> }
                  </td>
                  <td>
                    <strong>{{ b.title }}</strong>
                    @if (b.subtitle) { <br><small class="subtitle-text">{{ b.subtitle }}</small> }
                    <br><small class="muted">{{ b.authors }}</small>
                    @if (b.publisher) { <br><small class="muted">{{ b.publisher }}{{ b.published_year ? ', ' + b.published_year : '' }}</small> }
                  </td>
                  <td class="mono">{{ b.isbn || '—' }}</td>
                  <td>{{ b.category_name || '—' }}</td>
                  <td><span class="badge type-tag">{{ b.material_type }}</span></td>
                  <td class="center">{{ b.quantity }}</td>
                  <td class="center"><span [class.zero]="b.available_qty === 0">{{ b.available_qty }}</span></td>
                  <td>{{ b.location_name || '—' }}</td>
                  <td>
                    <button class="icon-btn" title="Edit" (click)="editBook(b)"><span class="material-icons-round">edit</span></button>
                    <button class="icon-btn" title="View" (click)="viewBook(b)"><span class="material-icons-round">visibility</span></button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="empty-row">No books found</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
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
          <div class="dialog wide" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editId ? 'Edit Book' : 'Add New Book' }}</h2>
              <button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <!-- ISBN Lookup -->
              <div class="isbn-lookup">
                <label>ISBN Lookup</label>
                <div class="isbn-row">
                  <input type="text" [(ngModel)]="form.isbn" placeholder="Enter ISBN to auto-fill..." />
                  <button class="btn-lookup" (click)="lookupIsbn()" [disabled]="isbnLoading">
                    @if (isbnLoading) { <span class="material-icons-round spin">progress_activity</span> }
                    @else { <span class="material-icons-round">travel_explore</span> }
                    Lookup
                  </button>
                </div>
                @if (isbnMsg) { <small [class]="isbnMsgClass">{{ isbnMsg }}</small> }
              </div>

              <div class="form-grid">
                <div class="form-group span-2"><label>Title *</label><input type="text" [(ngModel)]="form.title" required /></div>
                <div class="form-group span-2"><label>Subtitle</label><input type="text" [(ngModel)]="form.subtitle" /></div>
                <div class="form-group"><label>Authors *</label><input type="text" [(ngModel)]="form.authors" placeholder="Comma separated" /></div>
                <div class="form-group"><label>Publisher</label><input type="text" [(ngModel)]="form.publisher" /></div>
                <div class="form-group"><label>Published Year</label><input type="number" [(ngModel)]="form.published_year" /></div>
                <div class="form-group"><label>Edition</label><input type="text" [(ngModel)]="form.edition" /></div>
                <div class="form-group"><label>Pages</label><input type="number" [(ngModel)]="form.pages" /></div>
                <div class="form-group"><label>Language</label><input type="text" [(ngModel)]="form.language" value="English" /></div>
                <div class="form-group"><label>Category</label>
                  <select [(ngModel)]="form.category_id">
                    <option [ngValue]="null">Select...</option>
                    @for (c of categories; track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                  </select>
                </div>
                <div class="form-group"><label>Location</label>
                  <select [(ngModel)]="form.location_id">
                    <option [ngValue]="null">Select...</option>
                    @for (l of locations; track l.id) { <option [ngValue]="l.id">{{ l.name }} ({{ l.floor }}/{{ l.section }})</option> }
                  </select>
                </div>
                <div class="form-group"><label>Material Type</label>
                  <select [(ngModel)]="form.material_type">
                    @for (t of materialTypes; track t) { <option [value]="t">{{ t }}</option> }
                  </select>
                </div>
                <div class="form-group"><label>Subject</label><input type="text" [(ngModel)]="form.subject" /></div>
                <div class="form-group"><label>Call Number</label><input type="text" [(ngModel)]="form.call_number" /></div>
                <div class="form-group"><label>Barcode</label><input type="text" [(ngModel)]="form.barcode" /></div>
                <div class="form-group"><label>Quantity *</label><input type="number" [(ngModel)]="form.quantity" min="1" /></div>
                <div class="form-group"><label>Price (₹)</label><input type="number" [(ngModel)]="form.price" step="0.01" /></div>
                <div class="form-group"><label>Condition</label>
                  <select [(ngModel)]="form.condition_status">
                    <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
                  </select>
                </div>
                <div class="form-group"><label>Tags</label><input type="text" [(ngModel)]="form.tags" placeholder="Comma separated" /></div>
                <div class="form-group"><label>Cover URL</label><input type="text" [(ngModel)]="form.cover_url" /></div>
                <div class="form-group"><label>Digital URL</label><input type="text" [(ngModel)]="form.digital_url" /></div>
                <div class="form-group span-2"><label>Description</label><textarea [(ngModel)]="form.description" rows="3"></textarea></div>
                <div class="form-group check-group">
                  <label><input type="checkbox" [(ngModel)]="form.is_reference_only" /> Reference Only (cannot be borrowed)</label>
                </div>
                <div class="form-group check-group">
                  <label><input type="checkbox" [(ngModel)]="form.is_digital" /> Digital Resource</label>
                </div>
              </div>

              @if (form.cover_url) {
                <div class="cover-preview"><img [src]="form.cover_url" alt="Cover preview" /></div>
              }
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="showForm = false">Cancel</button>
              <button class="btn-primary" (click)="saveBook()" [disabled]="saving">
                {{ saving ? 'Saving...' : (editId ? 'Update Book' : 'Add Book') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- View Dialog -->
      @if (viewingBook) {
        <div class="overlay" (click)="viewingBook = null">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>Book Details</h2>
              <button class="close-btn" (click)="viewingBook = null"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <div class="book-detail">
                @if (viewingBook.cover_url) { <img [src]="viewingBook.cover_url" class="detail-cover" /> }
                <div class="detail-info">
                  <h3>{{ viewingBook.title }}</h3>
                  @if (viewingBook.subtitle) { <p class="subtitle-text">{{ viewingBook.subtitle }}</p> }
                  <p><strong>Authors:</strong> {{ viewingBook.authors }}</p>
                  <p><strong>ISBN:</strong> {{ viewingBook.isbn || 'N/A' }}</p>
                  <p><strong>Publisher:</strong> {{ viewingBook.publisher || 'N/A' }}{{ viewingBook.published_year ? ', ' + viewingBook.published_year : '' }}</p>
                  <p><strong>Category:</strong> {{ viewingBook.category_name || 'N/A' }}</p>
                  <p><strong>Type:</strong> {{ viewingBook.material_type }}</p>
                  <p><strong>Copies:</strong> {{ viewingBook.quantity }} total, {{ viewingBook.available_qty }} available</p>
                  <p><strong>Accession #:</strong> {{ viewingBook.accession_no }}</p>
                  <p><strong>Location:</strong> {{ viewingBook.location_name || 'N/A' }}</p>
                  <p><strong>Price:</strong> ₹{{ viewingBook.price || 0 }}</p>
                  @if (viewingBook.description) { <p class="desc">{{ viewingBook.description }}</p> }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './library-books.component.scss',
})
export class LibraryBooksComponent implements OnInit {
  books: Book[] = [];
  categories: Category[] = [];
  locations: Location[] = [];
  total = 0; page = 1; limit = 20;
  search = ''; filterCategory = ''; filterType = '';
  loading = true; showForm = false; saving = false;
  editId: number | null = null;
  viewingBook: Book | null = null;

  isbnLoading = false; isbnMsg = ''; isbnMsgClass = '';

  materialTypes = ['book', 'ebook', 'journal', 'magazine', 'newspaper', 'thesis', 'report', 'sop', 'policy', 'manual', 'cd_dvd', 'other'];

  form: any = this.emptyForm();

  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.svc.getCategories().subscribe(c => { this.categories = c; this.cdr.markForCheck(); });
    this.svc.getLocations().subscribe(l => { this.locations = l; this.cdr.markForCheck(); });
    this.load();
    this.route.queryParams.subscribe(p => {
      if (p['action'] === 'new') this.openForm();
    });
  }

  load(): void {
    this.loading = true;
    this.svc.getBooks({ search: this.search, category: this.filterCategory, type: this.filterType, page: this.page, limit: this.limit }).subscribe({
      next: r => { this.books = r.books; this.total = r.total; this.page = r.page; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  goPage(p: number): void { if (p >= 1 && p <= this.totalPages) { this.page = p; this.load(); } }

  openForm(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.isbnMsg = '';
    this.showForm = true;
  }

  editBook(b: Book): void {
    this.editId = b.id;
    this.form = { ...b, is_reference_only: !!b.is_reference_only, is_digital: !!b.is_digital };
    this.isbnMsg = '';
    this.showForm = true;
  }

  viewBook(b: Book): void { this.viewingBook = b; }

  lookupIsbn(): void {
    if (!this.form.isbn) return;
    this.isbnLoading = true; this.isbnMsg = '';
    this.svc.isbnLookup(this.form.isbn).subscribe({
      next: (r: IsbnLookup) => {
        if (r.title) this.form.title = r.title;
        if (r.authors) this.form.authors = r.authors;
        if (r.publisher) this.form.publisher = r.publisher;
        if (r.published_year) this.form.published_year = r.published_year;
        if (r.pages) this.form.pages = r.pages;
        if (r.cover_url) this.form.cover_url = r.cover_url;
        if (r.description) this.form.description = r.description;
        if (r.subjects) this.form.subject = r.subjects;
        if (r.open_library_key) this.form.open_library_key = r.open_library_key;
        this.isbnMsg = 'Book info loaded from Open Library!';
        this.isbnMsgClass = 'success-msg';
        this.isbnLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isbnMsg = 'Not found on Open Library. Enter details manually.';
        this.isbnMsgClass = 'error-msg';
        this.isbnLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  saveBook(): void {
    if (!this.form.title || !this.form.authors) return;
    this.saving = true;
    const data = { ...this.form, is_reference_only: this.form.is_reference_only ? 1 : 0, is_digital: this.form.is_digital ? 1 : 0 };
    const req = this.editId ? this.svc.updateBook(this.editId, data) : this.svc.createBook(data);
    req.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); },
    });
  }

  private emptyForm(): any {
    return {
      isbn: '', title: '', subtitle: '', authors: '', publisher: '', published_year: null,
      edition: '', pages: null, language: 'English', cover_url: '', description: '',
      category_id: null, location_id: null, material_type: 'book', subject: '', tags: '',
      call_number: '', barcode: '', quantity: 1, price: null, condition_status: 'new',
      is_reference_only: false, is_digital: false, digital_url: '', open_library_key: '',
    };
  }
}
