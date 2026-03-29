import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AgentDashboardComponent } from './components/agent-dashboard/agent-dashboard.component';
import { AgentDashboardEnhancedComponent } from './components/agent-dashboard/agent-dashboard-enhanced.component';
import { OfficerDashboardComponent } from './components/officer-dashboard/officer-dashboard.component';
import { ErrorPageComponent } from './components/error-page/error-page.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'error', component: ErrorPageComponent },
  { path: 'customer', component: CustomerDashboardComponent, canActivate: [authGuard, roleGuard(['Customer'])] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['Admin'])] },
  { path: 'agent', component: AgentDashboardComponent, canActivate: [authGuard, roleGuard(['Agent'])] },
  { path: 'officer', component: OfficerDashboardComponent, canActivate: [authGuard, roleGuard(['ClaimsOfficer'])] },
  { path: '**', redirectTo: '/error?code=404&message=Page not found' }
];
