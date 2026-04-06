import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionService, PhoneContact } from '../../services/reception.service';

@Component({
  selector: 'app-reception-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Phone Directory</h1>
        <button class="btn btn-primary" (click)="showForm = true; editing = null; resetForm()"><span class="material-icons-round">add</span>Add Contact</button>
      </div>
      <div class="filters">
        <input type="text" placeholder="Search name, department, ext..." [(ngModel)]="search" (input)="load()">
        <select [(ngModel)]="filterDept" (change)="load()"><option value="">All Departments</option>
          <option *ngFor="let d of departments" [value]="d">{{ d }}</option></select>
      </div>

      <div class="contact-grid">
        @for (c of filteredContacts; track c.id) {
          <div class="contact-card" [class.inactive]="!c.is_active">
            <div class="cc-avatar"><span class="material-icons-round">person</span></div>
            <div class="cc-info">
              <div class="cc-name">{{ c.name }}</div>
              <div class="cc-desig">{{ c.designation }}</div>
              <div class="cc-dept">{{ c.department }}</div>
            </div>
            <div class="cc-contacts">
              @if (c.ext_no) { <div class="cc-row"><span class="material-icons-round">phone</span>Ext: {{ c.ext_no }}</div> }
              @if (c.phone) { <div class="cc-row"><span class="material-icons-round">smartphone</span>{{ c.phone }}</div> }
              @if (c.email) { <div class="cc-row"><span class="material-icons-round">email</span>{{ c.email }}</div> }
            </div>
            <button class="icon-btn edit-btn" (click)="edit(c)"><span class="material-icons-round">edit</span></button>
          </div>
        }
      </div>
      @if (!filteredContacts.length) { <p class="empty">No contacts found</p> }

      @if (showForm) {
        <div class="overlay" (click)="showForm = false">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header"><h2>{{ editing ? 'Update Contact' : 'Add Contact' }}</h2><button class="close-btn" (click)="showForm = false"><span class="material-icons-round">close</span></button></div>
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field"><label>Name *</label><input [(ngModel)]="form.name"></div>
                <div class="field"><label>Designation</label><input [(ngModel)]="form.designation"></div>
                <div class="field"><label>Department *</label><input [(ngModel)]="form.department"></div>
                <div class="field"><label>Extension No</label><input [(ngModel)]="form.ext_no"></div>
                <div class="field"><label>Phone</label><input [(ngModel)]="form.phone"></div>
                <div class="field"><label>Email</label><input type="email" [(ngModel)]="form.email"></div>
                @if (editing) {
                  <div class="field"><label>Active</label><select [(ngModel)]="form.is_active"><option [ngValue]="1">Active</option><option [ngValue]="0">Inactive</option></select></div>
                }
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-secondary" (click)="showForm = false">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Add') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './reception-directory.component.scss',
})
export class ReceptionDirectoryComponent implements OnInit {
  contacts: PhoneContact[] = []; departments: string[] = [];
  search = ''; filterDept = '';
  showForm = false; saving = false; editing: PhoneContact | null = null; form: any = {};
  constructor(private svc: ReceptionService, private cdr: ChangeDetectorRef) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getDirectory({ search: this.search, department: this.filterDept }).subscribe(c => {
      this.contacts = c;
      this.departments = [...new Set(c.map(x => x.department).filter(Boolean))];
      this.cdr.markForCheck();
    });
  }
  get filteredContacts() { return this.contacts; }
  resetForm() { this.form = { name: '', designation: '', department: '', ext_no: '', phone: '', email: '', is_active: 1 }; }
  edit(c: PhoneContact) { this.editing = c; this.form = { ...c }; this.showForm = true; }
  save() {
    this.saving = true;
    const obs = this.editing ? this.svc.updateContact(this.editing.id, this.form) : this.svc.createContact(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.showForm = false; this.load(); this.cdr.markForCheck(); }, error: () => { this.saving = false; this.cdr.markForCheck(); } });
  }
}
