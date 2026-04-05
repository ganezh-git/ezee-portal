import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const roleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (auth.hasRole(...roles)) {
      return true;
    }

    router.navigate(['/portal']);
    return false;
  };
};

export const systemGuard = (slug: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (auth.hasSystemAccess(slug)) {
      return true;
    }

    router.navigate(['/portal']);
    return false;
  };
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  router.navigate(['/portal']);
  return false;
};

export const permissionGuard = (...permissions: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (permissions.some(p => auth.hasPermission(p))) {
      return true;
    }

    router.navigate(['/portal']);
    return false;
  };
};
