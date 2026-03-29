import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('AdminDashboardComponent - Create Staff', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'createStaff', 'getAdminStats', 'getAllApplications', 'getAllPolicies', 
      'getAgentPerformance', 'getOfficerPerformance', 'getAvailableAgents', 
      'getAvailableOfficers', 'getUnassignedClaims', 'getAllPolicyProducts',
      'getAdminChartData'
    ]);
    
    mockApiService.getAdminStats.and.returnValue(of({}));
    mockApiService.getAllApplications.and.returnValue(of([]));
    mockApiService.getAllPolicies.and.returnValue(of([]));
    mockApiService.getAgentPerformance.and.returnValue(of([]));
    mockApiService.getOfficerPerformance.and.returnValue(of([]));
    mockApiService.getAvailableAgents.and.returnValue(of([]));
    mockApiService.getAvailableOfficers.and.returnValue(of([]));
    mockApiService.getUnassignedClaims.and.returnValue(of([]));
    mockApiService.getAllPolicyProducts.and.returnValue(of([]));
    mockApiService.getAdminChartData.and.returnValue(of({
      policiesOverTime: [], claimsTrend: [], policyStatusBreakdown: { approved: 0, pending: 0, rejected: 0 },
      profitAndRevenue: { totalRevenue: 0, agentCommission: 0, profit: 0 }, topAgents: [], policiesByProduct: []
    }));

    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, FormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.getAdminChartData).toHaveBeenCalled();
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.activeTab.set('users');
      fixture.detectChanges();
    });

    it('should not call createStaff if form is invalid (missing fields)', () => {
      component.staffForm = { fullName: '', email: '', password: '', role: 'agent' };
      component.submitCreateStaff();
      
      expect(mockApiService.createStaff).not.toHaveBeenCalled();
      expect(component.notification().show).toBe(true);
      expect(component.notification().type).toBe('error');
    });

    it('should not submit via template button if form is invalid', async () => {
      await fixture.whenStable();
      
      const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(submitBtn.disabled).toBe(true);
    });
  });

  describe('API Submission', () => {
    beforeEach(() => {
      component.activeTab.set('users');
      fixture.detectChanges();
    });

    it('should call API with correct payload and update state on Agent success', fakeAsync(() => {
      const payload = { fullName: 'John Doe', email: 'john@example.com', password: 'password123', role: 'agent' };
      component.staffForm = { ...payload };
      
      mockApiService.createStaff.and.returnValue(of({ message: 'Agent created successfully' }));
      
      component.submitCreateStaff();
      tick();

      expect(mockApiService.createStaff).toHaveBeenCalledWith(payload);
      expect(component.notification().message).toContain('Agent created successfully');
      expect(component.staffForm.fullName).toBe('');
      expect(component.isCreatingStaff()).toBe(false);
    }));

    it('should call API and update state accurately on Claims Officer success', fakeAsync(() => {
      const payload = { fullName: 'Jane Doe', email: 'jane@example.com', password: 'password123', role: 'claimsOfficer' };
      component.staffForm = { ...payload };
      
      mockApiService.createStaff.and.returnValue(of({ message: 'Claims Officer created successfully' }));
      
      component.submitCreateStaff();
      tick();

      expect(mockApiService.createStaff).toHaveBeenCalledWith(payload);
      expect(component.notification().message).toContain('Claims Officer created successfully');
    }));

    it('should show error notification on API failure', fakeAsync(() => {
      const payload = { fullName: 'Jane Doe', email: 'jane@example.com', password: 'password123', role: 'claimsOfficer' };
      component.staffForm = { ...payload };
      
      mockApiService.createStaff.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
      
      component.submitCreateStaff();
      tick();

      expect(component.notification().type).toBe('error');
      expect(component.notification().message).toBe('Email already exists');
      expect(component.isCreatingStaff()).toBe(false);
    }));
  });
});
