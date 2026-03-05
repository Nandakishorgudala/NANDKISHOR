import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="forgot-password-page" [class.dark]="isDarkMode()">
      <div class="forgot-password-container">
        <div class="forgot-password-card">
          <div class="card-header">
            <h2 class="card-title">Reset Password</h2>
            <p class="card-subtitle">Enter your email and new password</p>
          </div>

          <form (ngSubmit)="resetPassword()" class="reset-form">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📧</span>
                Email Address
              </label>
              <input 
                type="email" 
                [(ngModel)]="resetData.email" 
                name="email" 
                required 
                class="form-input"
                placeholder="Enter your email">
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🔑</span>
                New Password
              </label>
              <div class="password-wrapper">
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  [(ngModel)]="resetData.newPassword" 
                  name="newPassword" 
                  required 
                  minlength="6"
                  class="form-input"
                  placeholder="Enter new password">
                <button type="button" (click)="showPassword.set(!showPassword())" class="password-toggle">
                  {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🔒</span>
                Confirm Password
              </label>
              <div class="password-wrapper">
                <input 
                  [type]="showConfirmPassword() ? 'text' : 'password'" 
                  [(ngModel)]="resetData.confirmPassword" 
                  name="confirmPassword" 
                  required 
                  minlength="6"
                  class="form-input"
                  placeholder="Confirm new password">
                <button type="button" (click)="showConfirmPassword.set(!showConfirmPassword())" class="password-toggle">
                  {{ showConfirmPassword() ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="success-message">
                <span class="success-icon">✓</span>
                {{ successMessage() }}
              </div>
            }

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isResetting()">
              {{ isResetting() ? 'Resetting...' : 'Reset Password' }}
            </button>

            <button type="button" (click)="goBack()" class="btn btn-secondary btn-block">
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-page {
      min-height: 100vh;
      background: linear-gradient(to bottom, #e0f2fe 0%, #f0f9ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .forgot-password-page.dark {
      background: linear-gradient(to bottom, #0f172a 0%, #1e293b 100%);
    }

    .forgot-password-container {
      width: 100%;
      max-width: 450px;
    }

    .forgot-password-card {
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .dark .forgot-password-card {
      background: #1e293b;
      color: white;
    }

    .card-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .card-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .dark .card-title {
      color: white;
    }

    .card-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .dark .card-subtitle {
      color: #94a3b8;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dark .form-label {
      color: #e2e8f0;
    }

    .label-icon {
      font-size: 16px;
    }

    .form-input {
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      transition: all 0.2s;
      background: white;
      color: #1e293b;
    }

    .dark .form-input {
      background: #0f172a;
      border-color: #334155;
      color: white;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .password-wrapper input {
      width: 100%;
      padding-right: 48px;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
    }

    .error-message {
      padding: 12px 16px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      color: #991b1b;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dark .error-message {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    .error-icon {
      font-size: 16px;
    }

    .success-message {
      padding: 12px 16px;
      background: #d1fae5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      color: #065f46;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dark .success-message {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
    }

    .success-icon {
      font-size: 16px;
    }

    .btn {
      padding: 14px 32px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-secondary {
      background: transparent;
      color: #1e3a8a;
      border: 2px solid #1e3a8a;
    }

    .dark .btn-secondary {
      color: white;
      border-color: white;
    }

    .btn-secondary:hover {
      background: rgba(30, 58, 138, 0.1);
    }

    .dark .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .btn-block {
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .forgot-password-card {
        padding: 32px 24px;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  isDarkMode = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isResetting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  resetData = {
    email: '',
    newPassword: '',
    confirmPassword: ''
  };

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode.set(savedTheme === 'dark');
  }

  resetPassword(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validation
    if (!this.resetData.email || !this.resetData.newPassword || !this.resetData.confirmPassword) {
      this.errorMessage.set('All fields are required.');
      return;
    }

    if (this.resetData.newPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    if (this.resetData.newPassword !== this.resetData.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isResetting.set(true);

    this.http.post(`${this.apiUrl}/auth/forgot-password`, this.resetData).subscribe({
      next: (response: any) => {
        this.isResetting.set(false);
        this.successMessage.set(response.message || 'Password reset successfully!');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (error) => {
        this.isResetting.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to reset password. Please try again.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
