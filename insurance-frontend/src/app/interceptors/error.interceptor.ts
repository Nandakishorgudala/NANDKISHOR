import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      let statusCode = error.status || 500;
      let traceId = error.error?.traceId || null;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Set specific messages based on status code
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'The request could not be understood by the server';
            break;
          case 401:
            errorMessage = error.error?.message || 'Please login to continue';
            break;
          case 403:
            errorMessage = error.error?.message || 'You do not have permission to access this resource';
            break;
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found';
            break;
          case 409:
            errorMessage = error.error?.message || 'The request conflicts with the current state';
            break;
          case 422:
            errorMessage = error.error?.message || 'The data provided failed validation';
            break;
          case 500:
            errorMessage = error.error?.message || 'An internal server error occurred';
            break;
          case 0:
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            break;
        }
      }

      // Log error to console for debugging
      console.error(`[Error ${statusCode}]`, errorMessage, error);

      // Get current URL to pass as 'from' parameter
      const currentUrl = router.url;

      // Navigate to error page ONLY for critical errors (not 400/401/409/422 which are handled by components)
      const skipRedirectStatuses = [400, 401, 409, 422];
      if (!skipRedirectStatuses.includes(error.status)) {
        router.navigate(['/error'], {
          queryParams: {
            code: statusCode,
            message: errorMessage,
            traceId: traceId,
            from: currentUrl
          }
        });
      }

      // Return error for component to handle if needed
      return throwError(() => ({
        status: statusCode,
        message: errorMessage,
        error: error.error
      }));
    })
  );
};
