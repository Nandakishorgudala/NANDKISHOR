import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface ErrorDetails {
  statusCode: number;
  title: string;
  message: string;
  icon: string;
}

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full">
        <div class="bg-white rounded-2xl shadow-2xl p-12 text-center border-4" [ngClass]="getBorderColor()">
          <!-- Status Code -->
          <div class="mb-8">
            <h1 class="text-9xl font-black" [ngClass]="getTextColor()">
              {{ errorDetails.statusCode }}
            </h1>
          </div>

          <!-- Icon -->
          <div class="mb-6 text-6xl">
            {{ errorDetails.icon }}
          </div>

          <!-- Title -->
          <h2 class="text-4xl font-bold text-gray-800 mb-4">
            {{ errorDetails.title }}
          </h2>

          <!-- Message -->
          <p class="text-xl text-gray-600 mb-8 leading-relaxed">
            {{ errorDetails.message }}
          </p>

          <!-- Divider -->
          <div class="border-t-2 border-gray-200 my-8"></div>

          <!-- Additional Info -->
          <p class="text-sm text-gray-500 mb-8">
            The resource requested could not be found on this server!
          </p>

          <!-- Action Buttons -->
          <div class="flex gap-4 justify-center flex-wrap">
            <button 
              (click)="goBack()"
              class="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
              ← Go Back
            </button>
            <button 
              (click)="goHome()"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
              🏠 Go to Home
            </button>
            @if (canRetry()) {
              <button 
                (click)="retry()"
                class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                🔄 Retry
              </button>
            }
          </div>

          <!-- Error Code Reference -->
          <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-400">
              Error Code: {{ errorDetails.statusCode }} | 
              @if (traceId) {
                <span>Trace ID: {{ traceId }}</span>
              }
            </p>
          </div>
        </div>

        <!-- Help Section -->
        <div class="mt-8 text-center">
          <p class="text-gray-600">
            Need help? 
            <a href="mailto:support@cdims.com" class="text-blue-600 hover:text-blue-700 font-semibold underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
    }
  `]
})
export class ErrorPageComponent implements OnInit {
  errorDetails: ErrorDetails = {
    statusCode: 404,
    title: 'Not Found',
    message: 'The page you are looking for does not exist.',
    icon: '🔍'
  };

  traceId: string | null = null;
  private previousUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const statusCode = parseInt(params['code'] || '404');
      const message = params['message'] || 'An error occurred';
      this.traceId = params['traceId'] || null;
      this.previousUrl = params['from'] || null;

      this.errorDetails = this.getErrorDetails(statusCode, message);
    });
  }

  private getErrorDetails(statusCode: number, message: string): ErrorDetails {
    switch (statusCode) {
      case 400:
        return {
          statusCode: 400,
          title: 'Bad Request',
          message: message || 'The request could not be understood by the server.',
          icon: '⚠️'
        };
      case 401:
        return {
          statusCode: 401,
          title: 'Unauthorized',
          message: message || 'You need to login to access this resource.',
          icon: '🔒'
        };
      case 403:
        return {
          statusCode: 403,
          title: 'Forbidden',
          message: message || 'You do not have permission to access this resource.',
          icon: '🚫'
        };
      case 404:
        return {
          statusCode: 404,
          title: 'Not Found',
          message: message || 'The resource you are looking for could not be found.',
          icon: '🔍'
        };
      case 409:
        return {
          statusCode: 409,
          title: 'Conflict',
          message: message || 'The request conflicts with the current state of the server.',
          icon: '⚡'
        };
      case 422:
        return {
          statusCode: 422,
          title: 'Validation Error',
          message: message || 'The data provided failed validation.',
          icon: '✓'
        };
      case 500:
        return {
          statusCode: 500,
          title: 'Internal Server Error',
          message: message || 'An unexpected error occurred on the server.',
          icon: '💥'
        };
      case 0:
        return {
          statusCode: 0,
          title: 'Connection Error',
          message: message || 'Unable to connect to the server. Please check your internet connection.',
          icon: '📡'
        };
      default:
        return {
          statusCode: statusCode,
          title: `Error ${statusCode}`,
          message: message || 'An unexpected error occurred.',
          icon: '❌'
        };
    }
  }

  getBorderColor(): string {
    const code = this.errorDetails.statusCode;
    if (code >= 500) return 'border-red-500';
    if (code === 404) return 'border-red-400';
    if (code === 403) return 'border-purple-500';
    if (code === 401) return 'border-yellow-500';
    if (code === 409) return 'border-pink-500';
    if (code === 422) return 'border-indigo-500';
    if (code >= 400) return 'border-orange-500';
    return 'border-gray-500';
  }

  getTextColor(): string {
    const code = this.errorDetails.statusCode;
    if (code >= 500) return 'text-red-600';
    if (code === 404) return 'text-red-500';
    if (code === 403) return 'text-purple-600';
    if (code === 401) return 'text-yellow-600';
    if (code === 409) return 'text-pink-600';
    if (code === 422) return 'text-indigo-600';
    if (code >= 400) return 'text-orange-600';
    return 'text-gray-600';
  }

  canRetry(): boolean {
    // Allow retry for server errors and connection errors
    return this.errorDetails.statusCode >= 500 || this.errorDetails.statusCode === 0;
  }

  goBack() {
    if (this.previousUrl) {
      this.router.navigateByUrl(this.previousUrl);
    } else {
      window.history.back();
    }
  }

  goHome() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token && userRole) {
      // Navigate to appropriate dashboard
      switch (userRole) {
        case 'Admin':
          this.router.navigate(['/admin']);
          break;
        case 'Agent':
          this.router.navigate(['/agent']);
          break;
        case 'ClaimsOfficer':
          this.router.navigate(['/officer']);
          break;
        case 'Customer':
          this.router.navigate(['/customer']);
          break;
        default:
          this.router.navigate(['/']);
      }
    } else {
      // Navigate to landing page
      this.router.navigate(['/']);
    }
  }

  retry() {
    if (this.previousUrl) {
      this.router.navigateByUrl(this.previousUrl);
    } else {
      window.location.reload();
    }
  }
}
