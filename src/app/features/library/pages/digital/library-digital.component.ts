import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService, DigitalDoc } from '../../services/library.service';

@Component({
  selector: 'app-library-digital',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">cloud_download</span> Digital Library</h1>
        <button class="btn-primary" (click)="showForm = true"><span class="material-icons-round">upload_file</span> Add Document</button>
      </div>

      <div class="filters">
        <div class="search-box">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="Search documents..." [(ngModel)]="search" (keyup.enter)="load()" />
        </div>
        <select [(ngModel)]="filterType" (change)="load()">
          <option value="">All Types</option>
          @for (t of docTypes; track t) { <option [value]="t">{{ t }}</option> }
        </select>
        <select [(ngModel)]="filterDept" (change)="load()">
          <option value="">All Departments</option>
          @for (d of departments; track d) { <option [value]="d">{{ d }}</option> }
        </select>
        <button class="btn-search" (click)="load()"><span class="material-icons-round">search</span></button>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <div class="doc-grid">
          @for (d of docs; track d.id) {
            <div class="doc-card">
              <div class="doc-icon-wrap" [class]="d.doc_type">
                <span class="material-icons-round">{{ getDocIcon(d.doc_type) }}</span>
              </div>
              <div class="doc-info">
                <h3>{{ d.title }}</h3>
                <div class="doc-meta">
                  <span class="badge type-badge">{{ d.doc_type }}</span>
                  <span class="badge access-badge" [class]="d.access_level">{{ d.access_level }}</span>
                </div>
                @if (d.department) { <p><span class="material-icons-round tiny">business</span> {{ d.department }}</p> }
                @if (d.description) { <p class="desc">{{ d.description }}</p> }
                <div class="doc-stats">
                  @if (d.file_format) { <span>{{ d.file_format.toUpperCase() }}</span> }
                  @if (d.file_size) { <span>{{ formatSize(d.file_size) }}</span> }
                  <span>{{ d.download_count }} downloads</span>
                  @if (d.version) { <span>v{{ d.version }}</span> }
                </div>
              </div>
              <div class="doc-actions">
                @if (d.file_path) {
                  <a [href]="d.file_path" target="_blank" class="icon-btn" title="Download"><span class="material-icons-round">download</span></a>
                }
                <button class="icon-btn" title="Edit" (click)="editDoc(d)"><span class="material-icons-round">edit</span></button>
              </div>
            </div>
          } @empty {
            <div class="empty"><span class="material-icons-round">folder_open</span><p>No digital documents found</p></div>
          }
        </div>
      }

      <!-- Add/Edit Dialog -->
      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editId ? 'Edit Document' : 'Add Document' }}</h2>
              <button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button>
            </div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="form-group span-2"><label>Title *</label><input type="text" [(ngModel)]="form.title" /></div>
                <div class="form-group"><label>Document Type</label>
                  <select [(ngModel)]="form.doc_type">
                    @for (t of docTypes; track t) { <option [value]="t">{{ t }}</option> }
                  </select>
                </div>
                <div class="form-group"><label>Department</label><input type="text" [(ngModel)]="form.department" /></div>
                <div class="form-group"><label>File Path / URL *</label><input type="text" [(ngModel)]="form.file_path" placeholder="URL or server path" /></div>
                <div class="form-group"><label>File Format</label><input type="text" [(ngModel)]="form.file_format" placeholder="pdf, docx, xlsx..." /></div>
                <div class="form-group"><label>Access Level</label>
                  <select [(ngModel)]="form.access_level">
                    <option value="public">Public</option><option value="internal">Internal</option>
                    <option value="restricted">Restricted</option><option value="confidential">Confidential</option>
                  </select>
                </div>
                <div class="form-group"><label>Version</label><input type="text" [(ngModel)]="form.version" placeholder="1.0" /></div>
                <div class="form-group span-2"><label>Description</label><textarea [(ngModel)]="form.description" rows="3"></textarea></div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="showForm = false">Cancel</button>
              <button class="btn-primary" (click)="saveDoc()" [disabled]="saving">{{ saving ? 'Saving...' : (editId ? 'Update' : 'Add') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './library-digital.component.scss',
})
export class LibraryDigitalComponent implements OnInit {
  docs: DigitalDoc[] = [];
  search = ''; filterType = ''; filterDept = '';
  loading = true; showForm = false; saving = false;
  editId: number | null = null;
  docTypes = ['sop', 'policy', 'manual', 'form', 'report', 'guideline', 'circular', 'ebook', 'other'];
  departments = ['EHS', 'HR', 'IT', 'QA', 'Production', 'Electrical', 'Mechanical', 'Safety & Security', 'Plant Admin', 'Technical Cell'];
  form: any = this.emptyForm();

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getDigitalDocs({ search: this.search, type: this.filterType, department: this.filterDept }).subscribe({
      next: d => { this.docs = d; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  editDoc(d: DigitalDoc): void { this.editId = d.id; this.form = { ...d }; this.showForm = true; }

  saveDoc(): void {
    if (!this.form.title || !this.form.file_path) return;
    this.saving = true;
    const req = this.editId ? this.svc.updateDigitalDoc(this.editId, this.form) : this.svc.createDigitalDoc(this.form);
    req.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.editId = null; this.form = this.emptyForm(); this.load(); this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); },
    });
  }

  getDocIcon(type: string): string {
    const icons: Record<string, string> = {
      sop: 'checklist', policy: 'gavel', manual: 'auto_stories', form: 'description',
      report: 'summarize', guideline: 'rule', circular: 'campaign', ebook: 'menu_book',
    };
    return icons[type] || 'insert_drive_file';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private emptyForm(): any {
    return { title: '', doc_type: 'sop', department: '', description: '', file_path: '', file_format: 'pdf', access_level: 'internal', version: '1.0' };
  }
}
