import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = true;
  saving = false;
  changingPassword = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  pwMessage = '';
  pwMessageType: 'success' | 'error' = 'success';

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      department: [''],
      designation: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });

    this.loadProfile();
  }

  username = '';
  role = '';
  userType = '';
  lastLogin = '';
  createdAt = '';

  loadProfile(): void {
    this.loading = true;
    this.auth.getProfile().subscribe({
      next: (p) => {
        this.username = p.username;
        this.role = p.role;
        this.userType = p.userType;
        this.lastLogin = p.lastLogin;
        this.createdAt = p.createdAt;
        this.profileForm.patchValue({
          fullName: p.fullName,
          email: p.email,
          department: p.department || '',
          designation: p.designation || '',
        });
        this.loading = false;
      },
      error: () => {
        this.message = 'Failed to load profile';
        this.messageType = 'error';
        this.loading = false;
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    this.message = '';
    this.auth.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.message = 'Profile updated successfully';
        this.messageType = 'success';
        this.saving = false;
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to update profile';
        this.messageType = 'error';
        this.saving = false;
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.pwMessage = 'Passwords do not match';
      this.pwMessageType = 'error';
      return;
    }
    this.changingPassword = true;
    this.pwMessage = '';
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.pwMessage = 'Password changed successfully';
        this.pwMessageType = 'success';
        this.changingPassword = false;
        this.passwordForm.reset();
      },
      error: (err) => {
        this.pwMessage = err.error?.error || 'Failed to change password';
        this.pwMessageType = 'error';
        this.changingPassword = false;
      },
    });
  }
}
