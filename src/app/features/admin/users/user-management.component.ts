import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { AdminUser, AdminUserDetail, AdminSystem } from '../models/admin.models';
import { DEPARTMENTS, DESIGNATIONS } from '../../../core/constants/reference-data';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, TitleCasePipe, DatePipe],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  users: AdminUser[] = [];
  systems: AdminSystem[] = [];
  departments = DEPARTMENTS;
  designations = DESIGNATIONS;
  total = 0;
  page = 1;
  limit = 15;
  searchQuery = '';
  roleFilter = '';
  statusFilter = '';
  loading = true;

  // Modal state
  showModal = false;
  modalMode: 'create' | 'edit' | 'systems' | 'password' = 'create';
  selectedUser: AdminUserDetail | null = null;
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  selectedSystemIds: number[] = [];
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadSystems();
    this.loadUsers();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') this.openCreateModal();
    });
  }

  initForms(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      full_name: ['', [Validators.required]],
      email: [''],
      phone: [''],
      department: [''],
      designation: [''],
      role: ['user'],
      user_type: ['permanent'],
      is_active: [1],
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers({
      search: this.searchQuery || undefined,
      role: this.roleFilter || undefined,
      status: this.statusFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (data) => {
        this.users = data.users;
        this.total = data.total;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  loadSystems(): void {
    this.adminService.getSystems().subscribe(s => { this.systems = s; this.cdr.markForCheck(); });
  }

  onSearch(value: string): void {
    this.searchQuery = value;
    this.page = 1;
    this.loadUsers();
  }

  onFilterRole(role: string): void {
    this.roleFilter = role;
    this.page = 1;
    this.loadUsers();
  }

  onFilterStatus(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.page > 1) { this.page--; this.loadUsers(); }
  }

  nextPage(): void {
    if (this.page * this.limit < this.total) { this.page++; this.loadUsers(); }
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  // ─── Modals ──────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.showModal = true;
    this.message = '';
    this.userForm.reset({ role: 'user', user_type: 'permanent', is_active: 1 });
    this.userForm.get('username')!.enable();
    this.userForm.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')!.updateValueAndValidity();
    this.selectedSystemIds = [];
  }

  openEditModal(userId: number): void {
    this.modalMode = 'edit';
    this.showModal = true;
    this.message = '';
    this.adminService.getUser(userId).subscribe(detail => {
      this.selectedUser = detail;
      this.userForm.patchValue({
        username: detail.user.username,
        full_name: detail.user.full_name,
        email: detail.user.email,
        phone: detail.user.phone,
        department: detail.user.department,
        designation: detail.user.designation,
        role: detail.user.role,
        user_type: detail.user.user_type,
        is_active: detail.user.is_active,
      });
      this.userForm.get('username')!.disable();
      this.userForm.get('password')!.clearValidators();
      this.userForm.get('password')!.updateValueAndValidity();
      this.selectedSystemIds = detail.systems.filter(s => s.is_active).map(s => s.system_id);
      this.cdr.markForCheck();
    });
  }

  openSystemsModal(userId: number): void {
    this.modalMode = 'systems';
    this.showModal = true;
    this.message = '';
    this.adminService.getUser(userId).subscribe(detail => {
      this.selectedUser = detail;
      this.selectedSystemIds = detail.systems.filter(s => s.is_active).map(s => s.system_id);
      this.cdr.markForCheck();
    });
  }

  openPasswordModal(userId: number): void {
    this.modalMode = 'password';
    this.showModal = true;
    this.message = '';
    this.passwordForm.reset();
    this.adminService.getUser(userId).subscribe(detail => {
      this.selectedUser = detail;
      this.cdr.markForCheck();
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    this.message = '';
  }

  toggleSystem(sysId: number): void {
    const idx = this.selectedSystemIds.indexOf(sysId);
    if (idx >= 0) this.selectedSystemIds.splice(idx, 1);
    else this.selectedSystemIds.push(sysId);
  }

  isSystemSelected(sysId: number): boolean {
    return this.selectedSystemIds.includes(sysId);
  }

  // ─── Save handlers ──────────────────────

  saveUser(): void {
    if (this.userForm.invalid) return;
    this.saving = true;
    this.message = '';

    if (this.modalMode === 'create') {
      const data = { ...this.userForm.value, systems: this.selectedSystemIds };
      this.adminService.createUser(data).subscribe({
        next: () => {
          this.showMessage('User created successfully', 'success');
          this.saving = false;
          this.loadUsers();
          setTimeout(() => this.closeModal(), 1200);
        },
        error: (err) => {
          this.showMessage(err.error?.error || 'Failed to create user', 'error');
          this.saving = false;
        },
      });
    } else if (this.modalMode === 'edit' && this.selectedUser) {
      const data = this.userForm.getRawValue();
      delete data.password;
      delete data.username;
      this.adminService.updateUser(this.selectedUser.user.id, data).subscribe({
        next: () => {
          // Also update systems
          this.adminService.updateUserSystems(this.selectedUser!.user.id, this.selectedSystemIds).subscribe({
            next: () => {
              this.showMessage('User updated successfully', 'success');
              this.saving = false;
              this.loadUsers();
              setTimeout(() => this.closeModal(), 1200);
            },
            error: () => { this.saving = false; },
          });
        },
        error: (err) => {
          this.showMessage(err.error?.error || 'Failed to update user', 'error');
          this.saving = false;
        },
      });
    }
  }

  saveSystems(): void {
    if (!this.selectedUser) return;
    this.saving = true;
    this.adminService.updateUserSystems(this.selectedUser.user.id, this.selectedSystemIds).subscribe({
      next: () => {
        this.showMessage('System access updated', 'success');
        this.saving = false;
        this.loadUsers();
        setTimeout(() => this.closeModal(), 1200);
      },
      error: () => {
        this.showMessage('Failed to update systems', 'error');
        this.saving = false;
      },
    });
  }

  resetPassword(): void {
    if (this.passwordForm.invalid || !this.selectedUser) return;
    const { password, confirm } = this.passwordForm.value;
    if (password !== confirm) {
      this.showMessage('Passwords do not match', 'error'); return;
    }
    this.saving = true;
    this.adminService.resetPassword(this.selectedUser.user.id, password).subscribe({
      next: () => {
        this.showMessage('Password reset successfully', 'success');
        this.saving = false;
        setTimeout(() => this.closeModal(), 1200);
      },
      error: () => {
        this.showMessage('Failed to reset password', 'error');
        this.saving = false;
      },
    });
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    this.cdr.markForCheck();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'super_admin': return 'badge-red';
      case 'admin': return 'badge-blue';
      case 'manager': return 'badge-amber';
      default: return 'badge-gray';
    }
  }
}
