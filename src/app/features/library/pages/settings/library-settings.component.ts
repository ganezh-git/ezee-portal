import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LibraryService, Category, Location } from '../../services/library.service';

@Component({
  selector: 'app-library-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header">
          <button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
          <h1><span class="material-icons-round">settings</span> Library Settings</h1>
        </div>
        <button class="btn-save" (click)="save()" [disabled]="saving">
          <span class="material-icons-round">save</span> {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      @if (saved) { <div class="alert success"><span class="material-icons-round">check_circle</span> Settings saved successfully</div> }

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <!-- Library Configuration -->
        <div class="card">
          <h3>Library Configuration</h3>
          <div class="setting-grid">
            <div class="setting-row">
              <label>Library Name</label>
              <input type="text" [(ngModel)]="s['library_name']" />
            </div>
            <div class="setting-row">
              <label>Library Type</label>
              <select [(ngModel)]="s['library_type']">
                <option value="school">School</option><option value="college">College</option>
                <option value="corporate">Corporate</option><option value="public">Public</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Circulation Rules -->
        <div class="card">
          <h3>Circulation Rules</h3>
          <p class="subtitle">Configure borrowing policies and fine rates.</p>
          <div class="setting-grid">
            <div class="setting-row">
              <label>Default Loan Period (days)</label>
              <input type="number" [(ngModel)]="s['default_loan_days']" min="1" />
            </div>
            <div class="setting-row">
              <label>Maximum Renewals</label>
              <input type="number" [(ngModel)]="s['max_renewals']" min="0" />
            </div>
            <div class="setting-row">
              <label>Fine Per Day (₹)</label>
              <input type="number" [(ngModel)]="s['fine_per_day']" min="0" step="0.5" />
            </div>
            <div class="setting-row">
              <label>Lost Book Fine Multiplier</label>
              <input type="number" [(ngModel)]="s['lost_book_multiplier']" min="1" step="0.5" />
              <small class="help">Fine = book price × multiplier</small>
            </div>
            <div class="setting-row">
              <label>Damaged Book Fine (₹)</label>
              <input type="number" [(ngModel)]="s['damaged_book_fine']" min="0" />
            </div>
            <div class="setting-row">
              <label>Reservation Expiry (days)</label>
              <input type="number" [(ngModel)]="s['reservation_expiry_days']" min="1" />
            </div>
          </div>
        </div>

        <!-- Categories -->
        <div class="card">
          <div class="card-header">
            <h3>Categories</h3>
            <button class="btn-small" (click)="showCatForm = true"><span class="material-icons-round">add</span> Add</button>
          </div>
          <div class="chip-list">
            @for (c of categories; track c.id) {
              <div class="chip"><span class="material-icons-round tiny">label</span> {{ c.name }}</div>
            }
          </div>
          @if (showCatForm) {
            <div class="inline-form">
              <input type="text" [(ngModel)]="newCatName" placeholder="Category name" />
              <button class="btn-primary" (click)="addCategory()">Add</button>
              <button class="btn-cancel" (click)="showCatForm = false">Cancel</button>
            </div>
          }
        </div>

        <!-- Locations -->
        <div class="card">
          <div class="card-header">
            <h3>Locations / Shelves</h3>
            <button class="btn-small" (click)="showLocForm = true"><span class="material-icons-round">add</span> Add</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Floor</th><th>Section</th><th>Shelf</th><th>Type</th></tr></thead>
              <tbody>
                @for (l of locations; track l.id) {
                  <tr><td>{{ l.name }}</td><td>{{ l.floor }}</td><td>{{ l.section }}</td><td>{{ l.shelf }}</td><td>{{ l.library_type }}</td></tr>
                } @empty {
                  <tr><td colspan="5" class="empty-row">No locations configured</td></tr>
                }
              </tbody>
            </table>
          </div>
          @if (showLocForm) {
            <div class="inline-form">
              <input type="text" [(ngModel)]="newLoc.name" placeholder="Name" />
              <input type="text" [(ngModel)]="newLoc.floor" placeholder="Floor" />
              <input type="text" [(ngModel)]="newLoc.section" placeholder="Section" />
              <input type="text" [(ngModel)]="newLoc.shelf" placeholder="Shelf" />
              <select [(ngModel)]="newLoc.library_type">
                <option value="school">School</option><option value="college">College</option>
                <option value="corporate">Corporate</option><option value="public">Public</option>
              </select>
              <button class="btn-primary" (click)="addLocation()">Add</button>
              <button class="btn-cancel" (click)="showLocForm = false">Cancel</button>
            </div>
          }
        </div>

        <!-- Activity Log -->
        <div class="card">
          <div class="card-header">
            <h3>Recent Activity</h3>
          </div>
          @if (activityLog.length) {
            <div class="log-list">
              @for (a of activityLog; track $index) {
                <div class="log-item">
                  <span class="log-time">{{ formatTime(a.created_at) }}</span>
                  <span class="log-action badge" [class]="a.action">{{ a.action }}</span>
                  <span class="log-detail">{{ a.entity_type }} #{{ a.entity_id }} — {{ a.details }}</span>
                  <span class="log-by">{{ a.performed_by }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="empty-text">No activity yet</p>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './library-settings.component.scss',
})
export class LibrarySettingsComponent implements OnInit {
  s: Record<string, string> = {};
  categories: Category[] = []; locations: Location[] = [];
  activityLog: any[] = [];
  loading = true; saving = false; saved = false;
  showCatForm = false; showLocForm = false;
  newCatName = '';
  newLoc = { name: '', floor: '', section: '', shelf: '', library_type: 'corporate' };

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.svc.getSettings().subscribe(s => { this.s = s; this.loading = false; this.cdr.markForCheck(); });
    this.svc.getCategories().subscribe(c => { this.categories = c; this.cdr.markForCheck(); });
    this.svc.getLocations().subscribe(l => { this.locations = l; this.cdr.markForCheck(); });
    this.svc.getActivityLog({ limit: 20 }).subscribe(log => { this.activityLog = log; this.cdr.markForCheck(); });
  }

  goBack(): void { this.router.navigate(['/library/dashboard']); }

  save(): void {
    this.saving = true; this.saved = false;
    this.svc.saveSettings(this.s).subscribe({
      next: () => { this.saving = false; this.saved = true; this.cdr.markForCheck(); setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 3000); },
      error: () => { this.saving = false; this.cdr.markForCheck(); },
    });
  }

  addCategory(): void {
    if (!this.newCatName.trim()) return;
    this.svc.createCategory({ name: this.newCatName.trim() }).subscribe({
      next: () => {
        this.newCatName = ''; this.showCatForm = false;
        this.svc.getCategories().subscribe(c => { this.categories = c; this.cdr.markForCheck(); });
      },
    });
  }

  addLocation(): void {
    if (!this.newLoc.name.trim()) return;
    this.svc.createLocation(this.newLoc).subscribe({
      next: () => {
        this.newLoc = { name: '', floor: '', section: '', shelf: '', library_type: 'corporate' };
        this.showLocForm = false;
        this.svc.getLocations().subscribe(l => { this.locations = l; this.cdr.markForCheck(); });
      },
    });
  }

  formatTime(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
