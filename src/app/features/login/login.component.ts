import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { DEPARTMENTS, DESIGNATIONS } from '../../core/constants/reference-data';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  hidePassword = true;
  hideRegPassword = true;
  loading = false;
  error = '';
  success = '';
  moduleContext = '';
  isRegisterMode = false;

  departments = DEPARTMENTS;
  designations = DESIGNATIONS;

  // Module theming
  moduleTheme = {
    icon: 'hub', color: '#3b82f6', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)', name: 'EZEE Portal',
  };

  private moduleThemes: Record<string, typeof this.moduleTheme> = {
    permit: { icon: 'assignment', color: '#ef4444', gradient: 'linear-gradient(135deg, #450a0a, #7f1d1d)', name: 'Asian Paints PTW' },
    inventory: { icon: 'inventory_2', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)', name: 'Inventory' },
    vehicle: { icon: 'local_shipping', color: '#06b6d4', gradient: 'linear-gradient(135deg, #083344, #164e63)', name: 'Vehicle Management' },
    safety: { icon: 'health_and_safety', color: '#10b981', gradient: 'linear-gradient(135deg, #022c22, #064e3b)', name: 'Safety Management' },
    visitor: { icon: 'badge', color: '#f59e0b', gradient: 'linear-gradient(135deg, #451a03, #78350f)', name: 'Visitor Management' },
    reception: { icon: 'meeting_room', color: '#f43f5e', gradient: 'linear-gradient(135deg, #4c0519, #881337)', name: 'Reception' },
    stationery: { icon: 'edit_note', color: '#ec4899', gradient: 'linear-gradient(135deg, #500724, #831843)', name: 'Stationery' },
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      empname: ['', [Validators.required]],
      email: ['', [Validators.email]],
      department: ['', [Validators.required]],
      designation: ['', [Validators.required]],
    });

    this.route.queryParams.subscribe(params => {
      this.moduleContext = params['module'] || '';
      if (this.moduleContext && this.moduleThemes[this.moduleContext]) {
        this.moduleTheme = this.moduleThemes[this.moduleContext];
      }
      this.isRegisterMode = params['register'] === 'true';
    });
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.error = '';
    this.success = '';
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = '';

    const credentials = {
      ...this.loginForm.value,
      module: this.moduleContext || undefined,
    };

    this.auth.login(credentials).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/portal']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    const data = {
      ...this.registerForm.value,
      module: this.moduleContext || undefined,
    };

    this.auth.register(data).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Registration successful! You can now sign in.';
        this.isRegisterMode = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Registration failed.';
        this.cdr.markForCheck();
      },
    });
  }

  get isPermitModule(): boolean {
    return this.moduleContext === 'permit';
  }
}
