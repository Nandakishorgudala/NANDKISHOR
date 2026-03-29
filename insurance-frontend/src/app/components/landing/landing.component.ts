import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ChatbotComponent } from '../shared/chatbot/chatbot.component';

interface Captcha {
  num1: number;
  num2: number;
  answer: number;
  userAnswer: number | null;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ChatbotComponent],
  template: `
    <div class="landing-page">
      <!-- Navigation Bar -->
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-logo">
            <div class="logo-shield">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="logo-icon">
                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="var(--primary)" fill-opacity="0.1" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="logo-text">ShieldSure</span>
          </div>
          <div class="nav-links-center">
            <button (click)="scrollToFeatures()" class="nav-link">Features</button>
            <button (click)="scrollToPolicies()" class="nav-link">Plans</button>
            <button (click)="scrollToHowItWorks()" class="nav-link">How It Works</button>
            <button (click)="scrollToCustomers()" class="nav-link">Partners</button>
          </div>
          <div class="nav-actions">
            <button (click)="openLoginModal()" class="nav-link-signin">Sign In</button>
            <button (click)="openRegisterModal()" class="btn-protected">Get Protected</button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="badge-dot"></span>
              Secure · Reliable · Efficient
            </div>
            <h1 class="hero-title">
              The Future of <br>
              <span class="text-purple">Disaster Insurance</span>
            </h1>
            <p class="hero-description">
              Comprehensive disaster management insurance powered by real-time risk assessment, rapid claims processing, and transparent policy management.
            </p>
            <div class="hero-cta-group">
              <button (click)="openRegisterModal()" class="btn-primary-vibrant">
                Get Protected
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button (click)="scrollToPolicies()" class="btn-outline-vibrant">Explore Plans</button>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <div class="stat-icon-box purple-lite">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-num">15K+</span>
                  <span class="stat-txt">Active Users</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon-box purple-lite">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-num">99.9%</span>
                  <span class="stat-txt">Uptime</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon-box purple-lite">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-num">₹2.5M+</span>
                  <span class="stat-txt">Coverage Pool</span>
                </div>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="visual-card-main">
              <div class="grid-bg"></div>
              <div class="visual-pulse-orb">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div class="visual-check-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div class="stat-floating risk-card">
                <span class="stat-label">Risk Score</span>
                <div class="stat-value-group">
                  <span class="low-tag">Low</span>
                  <span class="trend-down">▼ 12%</span>
                </div>
              </div>
              <div class="stat-floating processed-card">
                <span class="stat-label">Claims Processed</span>
                <span class="stat-value">12,847</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section" id="features">
        <div class="container-narrow">
          <div class="section-center-head">
            <span class="text-mini-purple">FEATURES</span>
            <h2 class="title-3xl">Built for Resilience</h2>
            <p class="subtitle-lg">Every tool you need to manage risk, process claims, and protect what matters most.</p>
          </div>
          
          <div class="features-grid">
            <div class="feat-card wide">
              <div class="feat-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3 class="feat-title">Live Monitoring</h3>
              <p class="feat-desc">Real-time disaster tracking with instant alerts and risk assessment dashboards.</p>
              <div class="system-status">
                <span class="status-dot"></span>
                System Active
              </div>
            </div>
            
            <div class="feat-card">
              <div class="feat-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 class="feat-title">Rapid Claims</h3>
              <p class="feat-desc">File claims in under 60 seconds with AI-powered damage assessment.</p>
              <div class="feat-highlight">
                <span class="highlight-val">60</span>
                <span class="highlight-txt">seconds</span>
              </div>
            </div>

            <div class="feat-card">
              <div class="feat-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h3 class="feat-title">Policy Ledger</h3>
              <p class="feat-desc">Transparent, immutable records of all policies and payouts.</p>
              <div class="ledger-preview">
                <div class="ledger-row">
                  <span>Earthquake Relief</span>
                  <span class="ledger-val">₹45,000</span>
                </div>
                <div class="ledger-row">
                  <span>Fire Damage</span>
                  <span class="ledger-val">₹32,500</span>
                </div>
              </div>
            </div>

            <div class="feat-card wide">
              <div class="feat-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                </svg>
              </div>
              <h3 class="feat-title">System Reliability</h3>
              <p class="feat-desc">Enterprise-grade uptime with redundant disaster recovery systems.</p>
              <div class="reliability-val">
                <span class="val-num">98.2</span>
                <span class="val-pct">%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Plans Section -->
      <section class="plans-section" id="policies">
        <div class="container-wide">
          <div class="section-center-head">
            <span class="text-mini-purple">PLANS</span>
            <h2 class="title-3xl">Sophisticated Insurance Plans</h2>
            <p class="subtitle-lg">Choose the coverage that fits your risk profile. All plans include 24/7 support and rapid claims processing.</p>
          </div>

          <div class="plans-grid">
            @if (isLoadingPolicies()) {
              <div class="full-width text-center py-12">
                <div class="spinner-purple"></div>
                <p class="mt-4 text-muted">Curating your protection plans...</p>
              </div>
            } @else {
              @for (policy of policyProducts(); track policy.id) {
                <div class="plan-card" [class.featured]="policy.featured">
                  @if (policy.featured) {
                    <div class="popular-pill">Most Popular</div>
                  }
                  <div class="plan-icon lavender">{{ getPolicyIcon(policy.name) }}</div>
                  <h3 class="plan-name">{{ policy.name }}</h3>
                  <p class="plan-limit">Up to {{ policy.coverageAmount | currency:'INR':'symbol':'1.0-0' }}</p>
                    <span class="price-val">{{ policy.basePremium | currency:'INR':'symbol':'1.0-0' }}</span>
                    <span class="price-period">/month</span>
                  <ul class="plan-features">
                    <li><span class="check-green">✓</span> Standardized coverage</li>
                    <li><span class="check-green">✓</span> 24/7 disaster monitoring</li>
                    <li><span class="check-green">✓</span> Rapid AI-claims support</li>
                  </ul>
                  <button (click)="openRegisterModal()" class="btn-plan-select" [class.btn-purple]="policy.featured">Select Plan</button>
                </div>
              }
              @if (policyProducts().length === 0) {
                <div class="full-width text-center py-12">
                  <p class="text-muted">No plans currently active. Please check back later.</p>
                </div>
              }
            }
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works" id="how-it-works">
        <div class="container-narrow">
          <div class="section-center-head">
            <span class="text-mini-purple">PROCESS</span>
            <h2 class="title-3xl">How It Works</h2>
            <p class="subtitle-lg">Three simple steps to comprehensive disaster protection.</p>
          </div>

          <div class="process-steps">
            <div class="step-item">
              <div class="step-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <span class="step-num-label">STEP 01</span>
              <h3 class="step-title">Assess Risk</h3>
              <p class="step-desc">Our AI evaluates your property, location, and historical disaster data to calculate your risk profile.</p>
            </div>
            <div class="step-item">
              <div class="step-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                </svg>
              </div>
              <span class="step-num-label">STEP 02</span>
              <h3 class="step-title">Choose Coverage</h3>
              <p class="step-desc">Select from tailored insurance plans that match your specific needs and budget requirements.</p>
            </div>
            <div class="step-item">
              <div class="step-icon-box lavender">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <span class="step-num-label">STEP 03</span>
              <h3 class="step-title">Get Protected</h3>
              <p class="step-desc">Instant policy activation with 24/7 monitoring, rapid claims processing, and dedicated support.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Ecosystem Section -->
      <section class="ecosystem-section" id="customers">
        <div class="container-wide">
          <div class="section-center-head">
            <span class="text-mini-purple">ECOSYSTEM</span>
            <h2 class="title-3xl">Trusted by Industry Leaders</h2>
            <p class="subtitle-lg">Serving diverse sectors with tailored insurance solutions.</p>
          </div>

          <div class="ecosystem-grid">
            <div class="eco-card">
              <div class="eco-icon-box purple-lite">🏠</div>
              <h3 class="eco-title">Home Owners</h3>
              <p class="eco-desc">Protecting families against natural disasters with comprehensive home coverage plans.</p>
              <div class="eco-stat">
                <span class="eco-stat-val">8,200+</span>
                <span class="eco-stat-lbl">Policies Active</span>
              </div>
            </div>
            <div class="eco-card active-border">
              <div class="eco-icon-box purple-lite">🏢</div>
              <h3 class="eco-title">Businesses</h3>
              <p class="eco-desc">Enterprise-grade disaster insurance for commercial properties and business continuity.</p>
              <div class="eco-stat">
                <span class="eco-stat-val">3,400+</span>
                <span class="eco-stat-lbl">Companies Covered</span>
              </div>
            </div>
            <div class="eco-card">
              <div class="eco-icon-box purple-lite">🌾</div>
              <h3 class="eco-title">Agriculture</h3>
              <p class="eco-desc">Crop and livestock protection against floods, droughts, and natural calamities.</p>
              <div class="eco-stat">
                <span class="eco-stat-val">5,100+</span>
                <span class="eco-stat-lbl">Farms Protected</span>
              </div>
            </div>
            <div class="eco-card">
              <div class="eco-icon-box purple-lite">🚧</div>
              <h3 class="eco-title">Infrastructure</h3>
              <p class="eco-desc">Large-scale infrastructure protection for bridges, roads, and public utilities.</p>
              <div class="eco-stat">
                <span class="eco-stat-val">1,200+</span>
                <span class="eco-stat-lbl">Projects Insured</span>
              </div>
            </div>
          </div>
          
          <div class="eco-indicators">
            <span class="dot"></span>
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </section>

      <!-- Stats Billboard Section -->
      <section class="stats-billboard">
        <div class="container-wide">
          <div class="stats-grid-dark">
            <div class="stat-card-dark">
              <span class="stat-value-large">12,847</span>
              <span class="stat-label-light">Claims Processed</span>
            </div>
            <div class="stat-card-dark">
              <span class="stat-value-large">₹2.5M+</span>
              <span class="stat-label-light">Coverage Pool</span>
            </div>
            <div class="stat-card-dark">
              <span class="stat-value-large">15,000+</span>
              <span class="stat-label-light">Active Users</span>
            </div>
            <div class="stat-card-dark">
              <span class="stat-value-large">99.9%</span>
              <span class="stat-label-light">System Uptime</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Secondary CTA Section -->
      <section class="secondary-cta">
        <div class="container-narrow">
          <div class="cta-content-center">
            <h2 class="cta-title-vibrant">Protection that responds <span class="text-purple">before the storm hits.</span></h2>
            <p class="cta-subtitle">Join thousands of policyholders who trust ShieldSure for fast, transparent, and reliable disaster insurance coverage.</p>
            <button (click)="openRegisterModal()" class="btn-primary-vibrant">Get Protected →</button>
          </div>
        </div>
      </section>

      <!-- Footer Section -->
      <footer class="footer-refined">
        <div class="container-wide">
          <div class="footer-top">
            <div class="footer-brand">
              <div class="nav-logo">
                <div class="logo-shield">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <span class="logo-text">ShieldSure</span>
              </div>
              <p class="brand-desc">ShieldSure — Disaster Management Insurance. Protecting lives, property, and livelihoods against unpredictable events.</p>
            </div>
            
            <div class="footer-links-grid">
              <div class="footer-col">
                <h4 class="footer-col-title">Products</h4>
                <ul class="footer-ul">
                  <li><a href="#">Wildfire Insurance</a></li>
                  <li><a href="#">Earthquake Coverage</a></li>
                  <li><a href="#">Fire & Smoke</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4 class="footer-col-title">Company</h4>
                <ul class="footer-ul">
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4 class="footer-col-title">Resources</h4>
                <ul class="footer-ul">
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">API Reference</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p class="copyright">© 2026 ShieldSure. All rights reserved.</p>
            <div class="legal-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <div class="modal-root" *ngIf="showLoginModal() || showRegisterModal()">
        <div class="modal-glass" (click)="showLoginModal() ? closeLoginModal() : closeRegisterModal()"></div>
        <div class="modal-vessel" (click)="$event.stopPropagation()">
          <button class="vessel-close" (click)="showLoginModal() ? closeLoginModal() : closeRegisterModal()">✕</button>
          


          <!-- Login View -->
          <form *ngIf="showLoginModal()" [formGroup]="loginForm" (ngSubmit)="login()" class="vessel-form">
            <div class="modal-icon-center">
              <div class="modal-shield-orb">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="orb-icon">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="var(--primary)" fill-opacity="0.1" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="vessel-header">
              <h2 class="vessel-title">Welcome to ShieldSure</h2>
              <p class="vessel-subtitle">Sign in to access your dashboard</p>
            </div>

            <div class="input-field">
              <label>Email Address</label>
              <div class="input-orb">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input type="email" formControlName="email" placeholder="you@company.com">
              </div>
            </div>

            <div class="input-field">
              <div class="label-row">
                <label>Password</label>
                <button type="button" (click)="goToForgotPassword()" class="forgot-link">Forgot password?</button>
              </div>
              <div class="input-orb">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input [type]="showLoginPassword() ? 'text' : 'password'" formControlName="password" placeholder="Enter your password" autocomplete="one-time-code">
                <button type="button" (click)="showLoginPassword.set(!showLoginPassword())" class="eye-btn">
                  <svg *ngIf="!showLoginPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showLoginPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="input-field">
              <label>Security Check</label>
              <div class="captcha-grid-row">
                <div class="captcha-box">
                  {{ loginCaptcha.num1 }} + {{ loginCaptcha.num2 }} =
                </div>
                <input type="number" formControlName="captcha" class="vessel-input-captcha" placeholder="Sum">
                <button type="button" (click)="refreshLoginCaptcha()" class="pill-refresh">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>
              </div>
            </div>

            <div *ngIf="loginError()" class="vessel-alert">
              <span>⚠️</span> {{ loginError() }}
            </div>

            <button type="submit" class="vessel-btn-primary" [disabled]="isLoggingIn() || loginForm.invalid">
              {{ isLoggingIn() ? 'Authenticating...' : 'Sign In' }}
            </button>
            
            <div class="vessel-footer">
              New to ShieldSure? <button type="button" (click)="switchToRegister()" class="vessel-link">Create Account</button>
            </div>
          </form>

          <!-- Register View -->
          <form *ngIf="showRegisterModal()" [formGroup]="registerForm" (ngSubmit)="register()" class="vessel-form">
            <div class="modal-icon-center">
              <div class="modal-shield-orb">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="orb-icon">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="var(--primary)" fill-opacity="0.1" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="vessel-header">
              <h2 class="vessel-title">Create Identity</h2>
              <p class="vessel-subtitle">Join the secure insurance ecosystem today</p>
            </div>

            <div class="input-field">
              <label>Legal Full Name</label>
              <div class="input-orb">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input type="text" formControlName="fullName" id="reg-fullname" name="fullname" autocomplete="name" placeholder="John Doe">
              </div>
            </div>

            <div class="input-row-modern">
               <div class="input-field">
                 <label>Email Address</label>
                 <div class="input-orb">
                   <span class="input-icon">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                   </span>
                   <input type="email" formControlName="email" id="reg-email" name="email" autocomplete="email" placeholder="john@example.com">
                 </div>
               </div>
               <div class="input-field">
                 <label>Phone Number</label>
                 <div class="input-orb">
                   <span class="input-icon">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                   </span>
                   <input type="tel" formControlName="phoneNumber" id="reg-phone" name="phone" autocomplete="tel" placeholder="10-digit mobile">
                 </div>
               </div>
            </div>

            <div class="input-row-modern">
               <div class="input-field">
                 <label>Password</label>
                 <div class="input-orb">
                   <span class="input-icon">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                   </span>
                   <input [type]="showRegisterPassword() ? 'text' : 'password'" formControlName="password" id="reg-password" name="password" autocomplete="new-password" placeholder="Min 6 chars (A1)">
                   <button type="button" (click)="showRegisterPassword.set(!showRegisterPassword())" class="eye-btn">
                      <svg *ngIf="!showRegisterPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg *ngIf="showRegisterPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                   </button>
                 </div>
               </div>
               <div class="input-field">
                 <label>Age</label>
                 <div class="input-orb">
                   <span class="input-icon">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                   </span>
                   <input type="number" formControlName="age" id="reg-age" name="age" autocomplete="off" placeholder="Min 18">
                 </div>
               </div>
            </div>

            <div class="input-field">
               <label>Residential Address</label>
               <div class="input-orb">
                 <span class="input-icon">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                 </span>
                 <input type="text" formControlName="address" id="reg-address" name="address" autocomplete="street-address" placeholder="Flat, Street, Area">
               </div>
            </div>

            <div class="input-row-modern-three">
               <div class="input-field">
                 <label>City</label>
                 <div class="input-orb">
                   <input type="text" formControlName="city" id="reg-city" name="city" autocomplete="address-level2" placeholder="City">
                 </div>
               </div>
               <div class="input-field">
                 <label>State</label>
                 <div class="input-orb">
                   <input type="text" formControlName="state" id="reg-state" name="state" autocomplete="address-level1" placeholder="State">
                 </div>
               </div>
               <div class="input-field">
                 <label>Zip Code</label>
                 <div class="input-orb">
                   <input type="text" formControlName="zipCode" id="reg-zip" name="zip" autocomplete="postal-code" placeholder="6-digit">
                 </div>
               </div>
            </div>

            <div class="input-field">
               <label>Security Check</label>
               <div class="captcha-grid-row">
                 <div class="captcha-box">
                   {{ registerCaptcha.num1 }} + {{ registerCaptcha.num2 }} =
                 </div>
                 <input type="number" formControlName="captcha" class="vessel-input-captcha" placeholder="Sum">
                 <button type="button" (click)="refreshRegisterCaptcha()" class="pill-refresh">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                   </svg>
                 </button>
               </div>
            </div>

            <div *ngIf="registerError()" class="vessel-alert">
              <span>⚠️</span> {{ registerError() }}
            </div>

            <button type="submit" class="vessel-btn-primary" [disabled]="isRegistering() || registerForm.invalid">
              {{ isRegistering() ? 'Initializing...' : 'Complete Enrollment' }}
            </button>

            <div class="vessel-footer">
              Exisiting user? <button type="button" (click)="switchToLogin()" class="vessel-link">Sign In</button>
            </div>
          </form>
        </div>
      </div>

      <app-chatbot></app-chatbot>
    </div>
  `,
  styles: [`
    :host {
      --primary: #7c3aed;
      --primary-dark: #6d28d9;
      --primary-light: #f3e8ff;
      --surface: #ffffff;
      --surface-glass: rgba(255, 255, 255, 0.8);
      --text-main: #111827;
      --text-muted: #4b5563;
      --accent: #8b5cf6;
      --border: #f3f4f6;
      --success: #10b981;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 24px;
      --radius-xl: 40px;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 25px -5px rgb(0 0 0 / 0.1);
      --font-main: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .landing-page {
      min-height: 100vh;
      background: var(--surface);
      color: var(--text-main);
      font-family: var(--font-main);
      overflow-x: hidden;
    }

    /* Container Utility */
    .container-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
    .container-narrow { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    /* Section Headers */
    .section-center-head { text-align: center; margin-bottom: 64px; }
    .text-mini-purple { color: var(--primary); font-size: 13px; font-weight: 800; letter-spacing: 2px; margin-bottom: 12px; display: block; }
    .title-3xl { font-size: 48px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 16px; color: #0f172a; }
    .subtitle-lg { font-size: 19px; color: var(--text-muted); max-width: 700px; margin: 0 auto; line-height: 1.6; }

    /* Navbar Redesign */
    .navbar {
      position: sticky; top: 0; z-index: 1000;
      background: var(--surface-glass); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); padding: 12px 0;
    }
    .nav-container { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; padding: 0 24px; }
    .nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .logo-shield { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
    .nav-links-center { display: flex; gap: 32px; }
    .nav-link { background: none; border: none; font-size: 15px; font-weight: 600; color: #4b5563; cursor: pointer; transition: color 0.2s; }
    .nav-link:hover { color: var(--primary); }
    .nav-actions { display: flex; align-items: center; gap: 24px; }
    .nav-link-signin { 
      background: transparent; border: 2px solid #e2e8f0; padding: 10px 24px; border-radius: 100px;
      font-size: 15px; font-weight: 700; color: #111827; cursor: pointer; transition: all 0.2s;
    }
    .nav-link-signin:hover { border-color: var(--primary); color: var(--primary); background: #fdfaff; }
    .btn-protected {
      background: var(--primary); color: white; border: none; padding: 10px 24px; border-radius: 100px;
      font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
      transition: all 0.3s;
    }
    .btn-protected:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35); }

    /* Hero Section vibrant */
    .hero-section { padding: 80px 0 120px; }
    .hero-container { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 64px; align-items: center; max-width: 1400px; margin: 0 auto; padding: 0 24px; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px; background: #f3e8ff; color: var(--primary);
      padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; margin-bottom: 24px;
    }
    .badge-dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; }
    .hero-title { font-size: 72px; font-weight: 950; line-height: 1.05; letter-spacing: -3px; margin-bottom: 24px; color: #0f172a; }
    .text-purple { color: var(--primary); }
    .hero-description { font-size: 21px; color: var(--text-muted); line-height: 1.6; margin-bottom: 40px; max-width: 600px; }
    .hero-cta-group { display: flex; gap: 20px; margin-bottom: 64px; }
    .btn-primary-vibrant {
      background: var(--primary); color: white; border: none; padding: 18px 36px; border-radius: 14px;
      font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 12px;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-primary-vibrant:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(124, 58, 237, 0.3); }
    .btn-outline-vibrant {
      background: transparent; color: #0f172a; border: 2px solid #e2e8f0; padding: 16px 36px;
      border-radius: 14px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.3s;
    }
    .btn-outline-vibrant:hover { border-color: var(--primary); background: #fdfaff; }

    .hero-stats { display: flex; gap: 40px; }
    .stat-item { display: flex; align-items: center; gap: 14px; }
    .stat-icon-box {
      width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      color: var(--primary);
    }
    .purple-lite { background: #f3e8ff; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-num { font-size: 22px; font-weight: 800; color: #0f172a; }
    .stat-txt { font-size: 13px; color: #64748b; font-weight: 600; }

    .hero-visual { position: relative; }
    .visual-card-main {
      position: relative; aspect-ratio: 1; background: #f9faff; border-radius: 32px;
      border: 1px solid #f1f5f9; overflow: hidden; display: flex; align-items: center; justify-content: center;
    }
    .grid-bg {
      position: absolute; inset: 0;
      background-image: linear-gradient(#eef2ff 1px, transparent 1px), linear-gradient(90deg, #eef2ff 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .visual-pulse-orb {
      width: 80px; height: 80px; background: #e9d5ff; border-radius: 20px;
      display: flex; align-items: center; justify-content: center; z-index: 2;
    }
    .visual-check-badge {
      position: absolute; right: 40px; top: 50%; transform: translateY(-50%);
      width: 54px; height: 54px; background: #d1fae5; color: #059669; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; z-index: 2;
    }
    .stat-floating {
      position: absolute; background: white; padding: 16px 24px; border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; z-index: 3;
    }
    .risk-card { bottom: 64px; left: 64px; }
    .processed-card { bottom: 96px; right: 32px; }
    .stat-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .stat-value-group { display: flex; align-items: center; gap: 8px; }
    .low-tag { color: #059669; font-weight: 800; font-size: 18px; }
    .trend-down { color: #64748b; font-size: 12px; font-weight: 600; }
    .stat-value { font-size: 24px; font-weight: 900; color: #0f172a; }

    /* Features styles */
    .features-section { padding: 120px 0; background: #fff; }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .feat-card {
      background: white; border: 1px solid #f1f5f9; padding: 40px; border-radius: 24px;
      transition: all 0.3s;
    }
    .feat-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.04); border-color: #e2e8f0; }
    .feat-card.wide { grid-column: span 1; } /* Adjusted to match image's staggered layout if needed */
    .feat-icon-box {
      width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center;
      justify-content: center; margin-bottom: 24px;
    }
    .lavender { background: #f5f3ff; }
    .feat-title { font-size: 22px; font-weight: 800; margin-bottom: 12px; color: #0f172a; }
    .feat-desc { font-size: 16px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
    .system-status { display: flex; align-items: center; gap: 8px; color: #059669; font-weight: 700; font-size: 14px; }
    .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
    .feat-highlight { margin-top: 24px; }
    .highlight-val { font-size: 42px; font-weight: 900; color: #0f172a; margin-right: 8px; }
    .highlight-txt { font-size: 16px; color: #64748b; font-weight: 600; }
    .ledger-preview { background: #f9faff; padding: 16px; border-radius: 12px; margin-top: 12px; }
    .ledger-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
    .ledger-val { color: #0f172a; font-weight: 800; }
    .reliability-val { margin-top: 24px; color: var(--primary); }
    .val-num { font-size: 48px; font-weight: 900; }
    .val-pct { font-size: 24px; font-weight: 800; }

    /* Plans styles */
    .plans-section { padding: 120px 0; background: #fdfaff; }
    .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .plan-card {
      background: white; border: 1px solid #f1f5f9; padding: 40px 32px; border-radius: 24px;
      position: relative; display: flex; flex-direction: column; transition: all 0.3s;
    }
    .plan-card.featured { border: 2px solid var(--primary); box-shadow: 0 20px 40px rgba(124,58,237,0.08); }
    .popular-pill {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: var(--primary); color: white; padding: 6px 18px; border-radius: 100px;
      font-size: 12px; font-weight: 800; text-transform: uppercase;
    }
    .plan-icon { font-size: 28px; width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
    .plan-name { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
    .plan-limit { color: #64748b; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 32px; }
    .price-val { font-size: 44px; font-weight: 900; color: #0f172a; }
    .price-period { font-size: 15px; color: #64748b; font-weight: 600; }
    .plan-features { list-style: none; padding: 0; margin: 0 0 40px 0; flex: 1; }
    .plan-features li { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 14px; }
    .check-green { color: #10b981; font-weight: 900; font-size: 18px; }
    .btn-plan-select {
      width: 100%; padding: 14px; border-radius: 100px; border: 1px solid #e2e8f0;
      background: #f8fafc; color: #0f172a; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.2s;
    }
    .btn-plan-select:hover { border-color: #cbd5e1; background: #f1f5f9; }
    .btn-plan-select.btn-purple { background: var(--primary); color: white; border: none; }
    .btn-plan-select.btn-purple:hover { background: var(--primary-dark); }

    /* How It Works style */
    .how-it-works { padding: 120px 0; }
    .process-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; position: relative; }
    .process-steps::before {
      content: ''; position: absolute; top: 28px; left: 10%; right: 10%; height: 1px;
      background: #e2e8f0; z-index: 0;
    }
    .step-item { position: relative; z-index: 1; text-align: center; }
    .step-icon-box {
      width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 24px; background: white; border: 1px solid #f1f5f9;
    }
    .step-num-label { font-size: 12px; font-weight: 800; color: var(--primary); letter-spacing: 1px; display: block; margin-bottom: 12px; }
    .step-title { font-size: 22px; font-weight: 900; margin-bottom: 12px; }
    .step-desc { font-size: 16px; color: #64748b; line-height: 1.6; max-width: 280px; margin: 0 auto; }

    /* Ecosystem styles */
    .ecosystem-section { padding: 120px 0; background: #fdfaff; }
    .ecosystem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .eco-card {
      background: white; border: 1px solid #f1f5f9; padding: 40px; border-radius: 24px;
      transition: all 0.3s;
    }
    .eco-card.active-border { border: 2px solid #e9d5ff; }
    .eco-icon-box { font-size: 24px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border-radius: 12px; }
    .eco-title { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
    .eco-desc { font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 32px; }
    .eco-stat { display: flex; flex-direction: column; gap: 4px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .eco-stat-val { font-size: 24px; font-weight: 900; color: #0f172a; }
    .eco-stat-lbl { font-size: 13px; color: #94a3b8; font-weight: 600; }

    .eco-indicators { display: flex; justify-content: center; gap: 12px; margin-top: 48px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; }
    .dot.active { width: 24px; border-radius: 10px; background: var(--primary); }

    /* Auth Modals */
    .modal-root { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal-glass { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    .modal-vessel { position: relative; width: 100%; max-width: 520px; background: white; border-radius: 28px; padding: 40px; box-shadow: 0 40px 80px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; }
    .vessel-close { position: absolute; top: 20px; right: 20px; border: none; background: transparent; color: #94a3b8; font-size: 18px; cursor: pointer; transition: color 0.2s; z-index: 10; }
    .vessel-close:hover { color: #1e293b; }
    
    .modal-icon-center { display: flex; justify-content: center; margin-bottom: 24px; }
    .modal-shield-orb { 
      width: 60px; height: 60px; background: #f5f3ff; color: var(--primary); 
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
    }
    .orb-icon { color: var(--primary); }

    .vessel-header { text-align: center; margin-bottom: 32px; }
    .vessel-title { font-size: 26px; font-weight: 800; margin-bottom: 8px; color: #0f172a; letter-spacing: -0.5px; }
    .vessel-subtitle { font-size: 14px; color: #64748b; font-weight: 500; }
    
    .vessel-form { display: flex; flex-direction: column; gap: 16px; }
    .input-row-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
    .input-row-modern-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; width: 100%; }
    .input-field { display: flex; flex-direction: column; gap: 8px; }
    .input-field label { font-size: 13px; font-weight: 700; color: #334155; }
    
    .label-row { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { background: none; border: none; font-size: 12px; font-weight: 700; color: var(--primary); cursor: pointer; padding: 0; }
    .forgot-link:hover { text-decoration: underline; }

    .input-orb { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; color: #94a3b8; display: flex; align-items: center; }
    .input-orb input { 
      width: 100%; padding: 14px 16px 14px 44px; border: 1.5px solid #e2e8f0; border-radius: 12px; 
      font-size: 14px; font-weight: 600; color: #1e293b; transition: all 0.2s; background: #fbfcfe;
    }
    .input-orb input::placeholder { color: #cbd5e1; }
    .input-orb input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08); background: white; }
    .eye-btn { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; }
    .eye-btn:hover { color: #64748b; }

    .captcha-grid-row { display: grid; grid-template-columns: 1fr 100px 44px; gap: 12px; align-items: center; }
    .captcha-box { 
      background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px;
      font-size: 16px; font-weight: 800; color: #0f172a; text-align: center; height: 48px; display: flex; align-items: center; justify-content: center;
    }
    .vessel-input-captcha { 
      width: 100% !important; height: 48px !important; padding: 0 12px !important; border: 1.5px solid #e2e8f0 !important; border-radius: 12px !important;
      font-size: 14px !important; font-weight: 700 !important; text-align: center !important; background: white !important;
    }
    .pill-refresh { 
      width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: white;
      color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .pill-refresh:hover { border-color: var(--primary); color: var(--primary); background: #f5f3ff; }

    .vessel-btn-primary { 
      margin-top: 8px; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 12px; 
      font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; 
    }
    .vessel-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 16px rgba(124, 58, 237, 0.2); background: var(--primary-dark); }
    .vessel-btn-primary:active { transform: translateY(0); }
    .vessel-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    .vessel-footer { text-align: center; color: #64748b; font-size: 13px; font-weight: 600; margin-top: 8px; }
    .vessel-link { background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 0; font-size: inherit; }
    .vessel-link:hover { text-decoration: underline; }

    .vessel-alert { 
      background: #fef2f2; border: 1px solid #fee2e2; color: #b91c1c; padding: 12px; border-radius: 10px;
      font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;
    }

    /* Stats Billboard */
    .stats-billboard { background: #0f172a; padding: 64px 0; margin: 40px 0; border-radius: 24px; }
    .stats-grid-dark { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center; }
    .stat-card-dark { display: flex; flex-direction: column; gap: 8px; }
    .stat-value-large { font-size: 42px; font-weight: 900; color: white; letter-spacing: -1px; }
    .stat-label-light { font-size: 14px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

    /* Secondary CTA */
    .secondary-cta { padding: 120px 0; text-align: center; }
    .cta-content-center { max-width: 800px; margin: 0 auto; }
    .cta-title-vibrant { font-size: 48px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #0f172a; }
    .cta-subtitle { font-size: 18px; color: #64748b; line-height: 1.6; margin-bottom: 40px; }

    /* Footer Refined */
    .footer-refined { background: #f8fafc; padding: 80px 0 40px; border-top: 1px solid #e2e8f0; margin-top: 120px; }
    .footer-top { display: grid; grid-template-columns: 1.5fr 3fr; gap: 80px; margin-bottom: 64px; }
    .brand-desc { font-size: 15px; color: #64748b; line-height: 1.6; margin-top: 24px; max-width: 320px; }
    .footer-links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
    .footer-col-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 24px; }
    .footer-ul { list-style: none; padding: 0; margin: 0; }
    .footer-ul li { margin-bottom: 12px; }
    .footer-ul a { color: #64748b; text-decoration: none; font-size: 15px; font-weight: 600; transition: color 0.2s; }
    .footer-ul a:hover { color: var(--primary); }
    .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 32px; border-top: 1px solid #e2e8f0; }
    .copyright { font-size: 14px; color: #94a3b8; font-weight: 600; }
    .legal-links { display: flex; gap: 24px; }
    .legal-links a { font-size: 14px; color: #94a3b8; font-weight: 600; text-decoration: none; transition: color 0.2s; }
    .legal-links a:hover { color: var(--primary); }

    .spinner-purple {
      width: 48px;
      height: 48px;
      border: 4px solid #f3e8ff;
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      margin: 0 auto;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
    .mt-4 { margin-top: 1rem; }
    .text-center { text-align: center; }
    .full-width { grid-column: 1 / -1; }

    @media (max-width: 1024px) {
      .hero-container { grid-template-columns: 1fr; text-align: center; }
      .hero-title { font-size: 56px; }
      .hero-description { margin: 0 auto 40px; }
      .hero-cta-group { justify-content: center; }
      .hero-stats { justify-content: center; flex-wrap: wrap; }
      .features-grid { grid-template-columns: 1fr; }
      .process-steps { grid-template-columns: 1fr; gap: 48px; }
      .process-steps::before { display: none; }
      .footer-top { grid-template-columns: 1fr; gap: 48px; }
      .stats-grid-dark { grid-template-columns: repeat(2, 1fr); gap: 32px; }
      .cta-title-vibrant { font-size: 36px; }
    }
    @media (max-width: 640px) {
      .hero-title { font-size: 42px; }
      .stats-grid-dark { grid-template-columns: 1fr; }
      .footer-links-grid { grid-template-columns: 1fr; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 20px; text-align: center; }
      .hero-cta-group { flex-direction: column; }
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
  policyProducts = signal<any[]>([]);
  isLoadingPolicies = signal(true);
  currentSlide = signal(0);

  customers = [
    {
      id: 1,
      title: 'Home Owners',
      description: 'Protecting families and their most valuable asset - their homes. Comprehensive coverage for property damage, natural disasters, and personal liability.',
      image: '/customers/homeowner.jpeg',
      icon: '🏠',
      coverage: '₹2.5M+',
      clients: '15K+'
    },
    {
      id: 2,
      title: 'Government Organizations',
      description: 'Supporting public infrastructure and government facilities with specialized insurance solutions for roads, bridges, public buildings, and critical infrastructure.',
      image: '/customers/infrastructure.jpeg',
      icon: '🏛️',
      coverage: '₹50M+',
      clients: '200+'
    },
    {
      id: 3,
      title: 'Businesses',
      description: 'Empowering businesses with comprehensive commercial insurance covering property, liability, business interruption, and disaster recovery.',
      image: '/customers/bussiness.jpeg',
      icon: '💼',
      coverage: '₹10M+',
      clients: '5K+'
    },
    {
      id: 4,
      title: 'Farmers',
      description: 'Safeguarding agricultural communities with crop insurance, livestock protection, and farm property coverage against natural disasters and climate risks.',
      image: '/customers/farmer.jpeg',
      icon: '🌾',
      coverage: '₹8M+',
      clients: '12K+'
    }
  ];

  loginForm: FormGroup;
  registerForm: FormGroup;

  loginCaptcha: Captcha = { num1: 0, num2: 0, answer: 0, userAnswer: null };
  registerCaptcha: Captcha = { num1: 0, num2: 0, answer: 0, userAnswer: null };

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      captcha: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)]],
      age: ['', [Validators.required, Validators.min(18), Validators.max(120)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      captcha: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {

    // Generate initial captchas
    this.refreshLoginCaptcha();
    this.refreshRegisterCaptcha();

    // Load available policies
    this.loadPolicyProducts();
  }

  loadPolicyProducts(): void {
    this.isLoadingPolicies.set(true);
    this.apiService.getActivePolicyProducts().subscribe({
      next: (data) => {
        // Mark the second policy as featured (most popular)
        const policies = data.map((policy: any, index: number) => ({
          ...policy,
          featured: index === 1 && data.length > 1
        }));
        this.policyProducts.set(policies);
        this.isLoadingPolicies.set(false);
      },
      error: () => {
        this.policyProducts.set([]);
        this.isLoadingPolicies.set(false);
      }
    });
  }

  getPolicyIcon(policyName: string): string {
    const name = policyName.toLowerCase();
    if (name.includes('fire') || name.includes('smoke')) return '🔥';
    if (name.includes('earthquake') || name.includes('seismic')) return '🌋';
    if (name.includes('flood') || name.includes('water')) return '🌊';
    if (name.includes('wildfire')) return '🌲';
    if (name.includes('home') || name.includes('house')) return '🏠';
    if (name.includes('health')) return '🏥';
    return '🛡️';
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
    this.loginForm.patchValue({ captcha: '' });
  }

  refreshRegisterCaptcha(): void {
    this.registerCaptcha = this.generateCaptcha();
    this.registerForm.patchValue({ captcha: '' });
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
    this.loginForm.reset();
    this.loginError.set('');
  }

  openRegisterModal(): void {
    this.showRegisterModal.set(true);
    this.registerError.set('');
    this.refreshRegisterCaptcha();
  }

  closeRegisterModal(): void {
    this.showRegisterModal.set(false);
    this.registerForm.reset();
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

  scrollToPolicies(): void {
    const policiesSection = document.getElementById('policies');
    if (policiesSection) {
      policiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToCustomers(): void {
    const customersSection = document.getElementById('customers');
    if (customersSection) {
      customersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToHowItWorks(): void {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  previousSlide(): void {
    if (this.currentSlide() > 0) {
      this.currentSlide.set(this.currentSlide() - 1);
    }
  }

  nextSlide(): void {
    if (this.currentSlide() < this.customers.length - 1) {
      this.currentSlide.set(this.currentSlide() + 1);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  goToForgotPassword(): void {
    this.closeLoginModal();
    this.router.navigate(['/forgot-password']);
  }

  login(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    const captchaValue = this.loginForm.get('captcha')?.value;
    if (captchaValue !== this.loginCaptcha.answer) {
      this.loginError.set('Incorrect captcha answer. Please try again.');
      this.refreshLoginCaptcha();
      return;
    }

    this.isLoggingIn.set(true);
    this.loginError.set('');

    const loginData = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginData).subscribe({
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
      },
      error: (err) => {
        this.isLoggingIn.set(false);
        const msg = err.error?.message || err.error?.Message || err.error?.detail || 'Login failed. Please check your credentials.';
        this.loginError.set(msg);
        this.refreshLoginCaptcha();
      }
    });
  }

  register(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    const captchaValue = this.registerForm.get('captcha')?.value;
    if (captchaValue !== this.registerCaptcha.answer) {
      this.registerError.set('Incorrect captcha answer. Please try again.');
      this.refreshRegisterCaptcha();
      return;
    }

    this.isRegistering.set(true);
    this.registerError.set('');

    const registerData = {
      fullName: this.registerForm.get('fullName')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
      age: Number(this.registerForm.get('age')?.value),
      phoneNumber: this.registerForm.get('phoneNumber')?.value,
      address: this.registerForm.get('address')?.value,
      city: this.registerForm.get('city')?.value,
      state: this.registerForm.get('state')?.value,
      zipCode: this.registerForm.get('zipCode')?.value
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isRegistering.set(false);
        this.closeRegisterModal();
        this.router.navigate(['/customer']);
      },
      error: (err) => {
        this.isRegistering.set(false);
        const msg = err.error?.message || err.error?.Message || err.error?.detail || 'Registration failed. Please try again.';
        this.registerError.set(msg);
        this.refreshRegisterCaptcha();
      }
    });
  }
}
