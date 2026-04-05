import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthState, LoginRequest, LoginResponse, User } from '../models/user.model';
import { ROLE_PERMISSIONS } from '../constants/reference-data';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'ezee_token';
  private readonly USER_KEY = 'ezee_user';

  private authState = new BehaviorSubject<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    systems: [],
    systemAdmin: [],
  });

  authState$ = this.authState.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        this.setAuth(response.token, response.user);
      })
    );
  }

  register(data: Record<string, string>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/register`, data);
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}).subscribe();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.next({
      user: null,
      token: null,
      isAuthenticated: false,
      systems: [],
      systemAdmin: [],
    });
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.authState.value.token;
  }

  getUser(): User | null {
    return this.authState.value.user;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.authState.value.user;
    return user ? roles.includes(user.role) : false;
  }

  hasSystemAccess(slug: string): boolean {
    if (this.hasRole('super_admin')) return true;
    return this.authState.value.systems.includes(slug);
  }

  isSystemAdmin(slug: string): boolean {
    return this.authState.value.systemAdmin.includes(slug);
  }

  hasPermission(permission: string): boolean {
    const user = this.authState.value.user;
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  }

  getPermissions(): string[] {
    const user = this.authState.value.user;
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }

  refreshToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_URL}/refresh`, {
      token: this.getToken(),
    }).pipe(
      tap(({ token }) => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.authState.next({ ...this.authState.value, token });
      })
    );
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Decode JWT to get systems
    const payload = this.decodeToken(token);

    this.authState.next({
      user,
      token,
      isAuthenticated: true,
      systems: payload?.systems || [],
      systemAdmin: payload?.systemAdmin || [],
    });
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        const payload = this.decodeToken(token);

        // Check token expiry
        if (payload && payload.exp * 1000 > Date.now()) {
          this.authState.next({
            user,
            token,
            isAuthenticated: true,
            systems: payload.systems || [],
            systemAdmin: payload.systemAdmin || [],
          });
        } else {
          this.logout();
        }
      } catch {
        this.logout();
      }
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
