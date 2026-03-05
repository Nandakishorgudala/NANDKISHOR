import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Captcha {
  num1: number;
  num2: number;
  answer: number;
  userAnswer: number | null;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing-page" [class.dark]="isDarkMode()">
      <!-- Navigation Bar -->
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-logo">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none" class="logo-icon-nav">
              <path d="M32 4L8 16V28C8 42.36 19.68 55.84 32 60C44.32 55.84 56 42.36 56 28V16L32 4Z" 
                    fill="currentColor"/>
            </svg>
            <span class="logo-text">CDIMS</span>
          </div>
          <div class="nav-actions">
            <button (click)="openLoginModal()" class="nav-link">Login</button>
            <button (click)="openRegisterModal()" class="nav-btn">Register</button>
            <button (click)="toggleTheme()" class="theme-toggle-nav">
              <span class="theme-icon">{{ isDarkMode() ? '☀️' : '🌙' }}</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">
              Casualty & Disaster<br>
              Insurance Management
            </h1>
            <p class="hero-description">
              Empowering insurers to manage disaster-related claims efficiently with intelligent 
              risk assessment, rapid impact analytics and secure, scalable workflows.
            </p>
          </div>
          <div class="hero-image">
            <div class="image-placeholder">
              <div class="shield-icon">�️</div>
              <div class="policy-icon">📋</div>
              <div class="chart-icon">📊</div>
              <div class="coins-icon">�</div>
            </div>
          </div>
        </div>
      </section>


      <!-- Login Modal -->
      @if (showLoginModal()) {
        <div class="modal-overlay" (click)="closeLoginModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeLoginModal()">✕</button>
            
            <div class="modal-header">
              <h2 class="modal-title">Welcome Back</h2>
              <p class="modal-subtitle">Login to your account</p>
            </div>

            <form (ngSubmit)="login()" class="auth-form">
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">📧</span>
                  Email Address
                </label>
                <input 
                  type="email" 
                  [(ngModel)]="loginData.email" 
                  name="email" 
                  required 
                  autocomplete="off"
                  class="form-input"
                  placeholder="Enter your email">
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">🔑</span>
                  Password
                </label>
                <div class="password-wrapper">
                  <input 
                    [type]="showLoginPassword() ? 'text' : 'password'" 
                    [(ngModel)]="loginData.password" 
                    name="password" 
                    required 
                    autocomplete="new-password"
                    class="form-input"
                    placeholder="Enter your password">
                  <button type="button" (click)="showLoginPassword.set(!showLoginPassword())" class="password-toggle">
                    {{ showLoginPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
              </div>

              <!-- Captcha -->
              <div class="captcha-section">
                <div class="captcha-box">
                  <span class="captcha-question">{{ loginCaptcha.num1 }} + {{ loginCaptcha.num2 }} = ?</span>
                  <button type="button" (click)="refreshLoginCaptcha()" class="captcha-refresh">🔄</button>
                </div>
                <input 
                  type="number" 
                  [(ngModel)]="loginCaptcha.userAnswer" 
                  name="captcha" 
                  required 
                  class="captcha-input"
                  placeholder="Sum">
              </div>

              @if (loginError()) {
                <div class="error-message">
                  <span class="error-icon">⚠️</span>
                  {{ loginError() }}
                </div>
              }

              <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoggingIn()">
                {{ isLoggingIn() ? 'Logging in...' : 'Login' }}
              </button>

              <div class="forgot-password-link">
                <button (click)="goToForgotPassword()" class="link-button">Forgot Password?</button>
              </div>
            </form>

            <div class="modal-footer">
              <p class="footer-text">
                Don't have an account? 
                <button (click)="switchToRegister()" class="link-button">Register</button>
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Register Modal -->
      @if (showRegisterModal()) {
        <div class="modal-overlay" (click)="closeRegisterModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeRegisterModal()">✕</button>
            
            <div class="modal-header">
              <h2 class="modal-title">Create Account</h2>
              <p class="modal-subtitle">Join CDIMS today</p>
            </div>

            <form (ngSubmit)="register()" class="auth-form">
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">👤</span>
                  Full Name
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="registerData.fullName" 
                  name="fullName" 
                  required 
                  autocomplete="off"
                  class="form-input"
                  placeholder="Enter your full name">
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">📧</span>
                  Email Address
                </label>
                <input 
                  type="email" 
                  [(ngModel)]="registerData.email" 
                  name="email" 
                  required 
                  autocomplete="off"
                  class="form-input"
                  placeholder="Enter your email">
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">🔑</span>
                  Password
                </label>
                <div class="password-wrapper">
                  <input 
                    [type]="showRegisterPassword() ? 'text' : 'password'" 
                    [(ngModel)]="registerData.password" 
                    name="password" 
                    required 
                    autocomplete="new-password"
                    class="form-input"
                    placeholder="Create a password">
                  <button type="button" (click)="showRegisterPassword.set(!showRegisterPassword())" class="password-toggle">
                    {{ showRegisterPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
              </div>

              <!-- Captcha -->
              <div class="captcha-section">
                <div class="captcha-box">
                  <span class="captcha-question">{{ registerCaptcha.num1 }} + {{ registerCaptcha.num2 }} = ?</span>
                  <button type="button" (click)="refreshRegisterCaptcha()" class="captcha-refresh">🔄</button>
                </div>
                <input 
                  type="number" 
                  [(ngModel)]="registerCaptcha.userAnswer" 
                  name="captcha" 
                  required 
                  class="captcha-input"
                  placeholder="Sum">
              </div>

              @if (registerError()) {
                <div class="error-message">
                  <span class="error-icon">⚠️</span>
                  {{ registerError() }}
                </div>
              }

              <button type="submit" class="btn btn-primary btn-block" [disabled]="isRegistering()">
                {{ isRegistering() ? 'Creating account...' : 'Create Account' }}
              </button>
            </form>

            <div class="modal-footer">
              <p class="footer-text">
                Already have an account? 
                <button (click)="switchToLogin()" class="link-button">Login</button>
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Base Styles */
    .landing-page {
      min-height: 100vh;
      background: linear-gradient(to bottom, #e0f2fe 0%, #f0f9ff 100%);
      transition: all 0.3s ease;
    }

    .landing-page.dark {
      background: linear-gradient(to bottom, #0f172a 0%, #1e293b 100%);
    }

    /* Navigation Bar */
    .navbar {
      background: rgba(30, 58, 138, 0.95);
      backdrop-filter: blur(10px);
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .dark .navbar {
      background: rgba(15, 23, 42, 0.95);
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon-nav {
      color: white;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: white;
      letter-spacing: 1px;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-link {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .theme-toggle-nav {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .theme-toggle-nav:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.1);
    }

    .theme-icon {
      font-size: 20px;
    }

    .nav-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    /* Hero Section */
    .hero-section {
      padding: 0px 24px 80px;
    }

    .hero-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero-content {
      max-width: 600px;
    }

    .hero-title {
      font-size: 48px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0 0 24px 0;
      line-height: 1.2;
    }

    .dark .hero-title {
      color: white;
    }

    .hero-description {
      font-size: 18px;
      color: #475569;
      line-height: 1.7;
      margin: 0 0 32px 0;
    }

    .dark .hero-description {
      color: #cbd5e1;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-image {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-placeholder {
      width: 100%;
      max-width: 500px;
      aspect-ratio: 1;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 20px 60px rgba(59, 130, 246, 0.2);
    }

    .dark .image-placeholder {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    }

    .shield-icon, .policy-icon, .chart-icon, .coins-icon {
      position: absolute;
      font-size: 64px;
      animation: float 3s ease-in-out infinite;
    }

    .shield-icon {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120px;
    }

    .policy-icon {
      top: 15%;
      right: 15%;
      animation-delay: 0.5s;
    }

    .chart-icon {
      bottom: 15%;
      left: 15%;
      animation-delay: 1s;
    }

    .coins-icon {
      bottom: 20%;
      right: 20%;
      animation-delay: 1.5s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }

    /* Features Section */
    .features-section {
      padding: 60px 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .feature-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .dark .feature-card {
      background: #1e293b;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
    }

    .feature-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .feature-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0 0 12px 0;
    }

    .dark .feature-title {
      color: white;
    }

    .feature-description {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .dark .feature-description {
      color: #94a3b8;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 24px;
      padding: 40px;
      max-width: 450px;
      width: 100%;
      position: relative;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .dark .modal-content {
      background: #1e293b;
      color: white;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      color: #64748b;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: rotate(90deg);
    }

    .dark .modal-close {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .modal-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .modal-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .dark .modal-title {
      color: white;
    }

    .modal-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .dark .modal-subtitle {
      color: #94a3b8;
    }

    /* Form */
    .auth-form {
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

    /* Captcha */
    .captcha-section {
      display: flex;
      gap: 12px;
      align-items: stretch;
    }

    .captcha-box {
      flex: 0 0 auto;
      width: 140px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      font-weight: 600;
      font-size: 16px;
    }

    .dark .captcha-box {
      background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%);
    }

    .captcha-question {
      letter-spacing: 1px;
    }

    .captcha-refresh {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 6px;
      padding: 2px 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .captcha-refresh:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(180deg);
    }

    .captcha-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      transition: all 0.2s;
    }

    .dark .captcha-input {
      background: #0f172a;
      border-color: #334155;
      color: white;
    }

    .captcha-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Error Message */
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

    /* Buttons */
    .btn {
      padding: 14px 32px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover {
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
      transform: translateY(-2px);
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

    .btn-icon {
      font-size: 20px;
    }

    /* Modal Footer */
    .modal-footer {
      margin-top: 24px;
      text-align: center;
    }

    .footer-text {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .dark .footer-text {
      color: #94a3b8;
    }

    .link-button {
      background: none;
      border: none;
      color: #667eea;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      margin-left: 4px;
    }

    .link-button:hover {
      color: #764ba2;
    }

    .forgot-password-link {
      text-align: center;
      margin-top: -8px;
    }

    .forgot-password-link .link-button {
      font-size: 13px;
      color: #667eea;
      text-decoration: none;
    }

    .forgot-password-link .link-button:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-container {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .hero-title {
        font-size: 36px;
      }

      .hero-description {
        font-size: 16px;
      }

      .hero-image {
        order: -1;
      }

      .image-placeholder {
        max-width: 300px;
      }

      .nav-container {
        padding: 0 16px;
      }

      .nav-actions {
        gap: 8px;
      }

      .nav-link {
        padding: 6px 12px;
        font-size: 14px;
      }

      .nav-btn {
        padding: 8px 16px;
        font-size: 14px;
      }

      .modal-content {
        padding: 32px 24px;
      }

      .captcha-box {
        width: 120px;
        font-size: 14px;
        padding: 10px 12px;
      }
    }
  `]
})
export class LandingComponent implements OnInit {
  showLoginModal = signal(false);
  showRegisterModal = signal(false);
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  isLoggingIn = signal(false);
  isRegistering = signal(false);
  loginError = signal('');
  registerError = signal('');
  isDarkMode = signal(false);

  loginData = { email: '', password: '' };
  registerData = { fullName: '', email: '', password: '' };

  loginCaptcha: Captcha = { num1: 0, num2: 0, answer: 0, userAnswer: null };
  registerCaptcha: Captcha = { num1: 0, num2: 0, answer: 0, userAnswer: null };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode.set(savedTheme === 'dark');
    
    // Generate initial captchas
    this.refreshLoginCaptcha();
    this.refreshRegisterCaptcha();
  }

  toggleTheme(): void {
    this.isDarkMode.set(!this.isDarkMode());
    localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
  }

  generateCaptcha(): Captcha {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    return {
      num1,
      num2,
      answer: num1 + num2,
      userAnswer: null
    };
  }

  refreshLoginCaptcha(): void {
    this.loginCaptcha = this.generateCaptcha();
  }

  refreshRegisterCaptcha(): void {
    this.registerCaptcha = this.generateCaptcha();
  }

  validateCaptcha(captcha: Captcha): boolean {
    return captcha.userAnswer === captcha.answer;
  }

  openLoginModal(): void {
    this.showLoginModal.set(true);
    this.loginError.set('');
    this.refreshLoginCaptcha();
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
    this.loginData = { email: '', password: '' };
    this.loginError.set('');
  }

  openRegisterModal(): void {
    this.showRegisterModal.set(true);
    this.registerError.set('');
    this.refreshRegisterCaptcha();
  }

  closeRegisterModal(): void {
    this.showRegisterModal.set(false);
    this.registerData = { fullName: '', email: '', password: '' };
    this.registerError.set('');
  }

  switchToRegister(): void {
    this.closeLoginModal();
    this.openRegisterModal();
  }

  switchToLogin(): void {
    this.closeRegisterModal();
    this.openLoginModal();
  }

  scrollToFeatures(): void {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  goToForgotPassword(): void {
    this.closeLoginModal();
    this.router.navigate(['/forgot-password']);
  }

  login(): void {
    if (!this.validateCaptcha(this.loginCaptcha)) {
      this.loginError.set('Incorrect captcha answer. Please try again.');
      this.refreshLoginCaptcha();
      return;
    }

    this.isLoggingIn.set(true);
    this.loginError.set('');

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoggingIn.set(false);
        const role = response.role.toLowerCase();
        
        if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'agent') {
          this.router.navigate(['/agent']);
        } else if (role === 'customer') {
          this.router.navigate(['/customer']);
        } else if (role === 'claimsofficer') {
          this.router.navigate(['/officer']);
        }
      }
      // Error handling removed - let the error interceptor handle it
    });
  }

  register(): void {
    if (!this.validateCaptcha(this.registerCaptcha)) {
      this.registerError.set('Incorrect captcha answer. Please try again.');
      this.refreshRegisterCaptcha();
      return;
    }

    this.isRegistering.set(true);
    this.registerError.set('');

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.isRegistering.set(false);
        this.closeRegisterModal();
        this.router.navigate(['/customer']);
      }
      // Error handling removed - let the error interceptor handle it
    });
  }
}
