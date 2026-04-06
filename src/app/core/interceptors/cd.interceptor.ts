import { HttpInterceptorFn } from '@angular/common/http';
import { inject, ApplicationRef } from '@angular/core';
import { tap } from 'rxjs';

/**
 * Triggers Angular change detection after every HTTP response.
 * Required because the app uses provideZonelessChangeDetection() —
 * without Zone.js, subscribe() callbacks don't automatically trigger CD.
 */
export const cdInterceptor: HttpInterceptorFn = (req, next) => {
  const appRef = inject(ApplicationRef);
  return next(req).pipe(
    tap({
      next: () => setTimeout(() => appRef.tick()),
      error: () => setTimeout(() => appRef.tick()),
    })
  );
};
