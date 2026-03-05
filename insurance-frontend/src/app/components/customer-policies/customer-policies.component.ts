import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-customer-policies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="container mx-auto">
        <h1 class="text-3xl font-bold mb-6">Available Insurance Policies</h1>

        <!-- Toast Notification -->
        @if (notification().show) {
          <div class="fixed top-4 right-4 z-50 animate-fade-in">
            <div [class]="notification().type === 'success' ? 'bg-green-500' : 'bg-red-500'" 
                 class="text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
              <span class="text-lg">{{ notification().type === 'success' ? '✓' : '✗' }}</span>
              <span>{{ notification().message }}</span>
            </div>
          </div>
        }

        <!-- Policy List -->
        @if (!selectedPolicy()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (policy of policies(); track policy.id) {
              <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6">
                <h3 class="text-xl font-bold mb-2">{{ policy.name }}</h3>
                <p class="text-gray-600 text-sm mb-4">{{ policy.description }}</p>
                
                <div class="space-y-2 mb-4">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Base Premium:</span>
                    <span class="font-bold">{{ '$' + policy.basePremium }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Coverage:</span>
                    <span class="font-bold">{{ '$' + policy.coverageAmount }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Tenure:</span>
                    <span class="font-bold">{{ policy.tenureMonths }} months</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Claim Limit:</span>
                    <span class="font-bold">{{ policy.claimLimit }} claims</span>
                  </div>
                </div>

                <button (click)="selectPolicy(policy)" 
                  class="w-full bg-primary text-white py-2 rounded hover:bg-blue-700">
                  Apply Now
                </button>
              </div>
            }
          </div>
        }

        <!-- Application Form -->
        @if (selectedPolicy()) {
          <div class="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">Apply for {{ selectedPolicy().name }}</h2>
              <button (click)="selectedPolicy.set(null)" class="text-gray-500 hover:text-gray-700">
                ✕ Close
              </button>
            </div>

            <form (ngSubmit)="submitApplication()" class="space-y-6">
              <!-- Plan Type Selection -->
              <div class="bg-blue-50 p-4 rounded-lg">
                <label class="block text-sm font-bold mb-3">Select Plan Type</label>
                <div class="grid grid-cols-3 gap-4">
                  <div (click)="application.planType = 'Basic'" 
                       [class.border-primary]="application.planType === 'Basic'"
                       [class.border-4]="application.planType === 'Basic'"
                       class="border-2 rounded-lg p-4 cursor-pointer hover:border-primary">
                    <h4 class="font-bold text-center">Basic</h4>
                    <p class="text-sm text-center text-gray-600">Standard Coverage</p>
                    <p class="text-center font-bold mt-2">1.0x</p>
                  </div>
                  <div (click)="application.planType = 'Plus'" 
                       [class.border-primary]="application.planType === 'Plus'"
                       [class.border-4]="application.planType === 'Plus'"
                       class="border-2 rounded-lg p-4 cursor-pointer hover:border-primary">
                    <h4 class="font-bold text-center">Plus</h4>
                    <p class="text-sm text-center text-gray-600">Enhanced Coverage</p>
                    <p class="text-center font-bold mt-2">1.25x</p>
                  </div>
                  <div (click)="application.planType = 'Advanced'" 
                       [class.border-primary]="application.planType === 'Advanced'"
                       [class.border-4]="application.planType === 'Advanced'"
                       class="border-2 rounded-lg p-4 cursor-pointer hover:border-primary">
                    <h4 class="font-bold text-center">Advanced</h4>
                    <p class="text-sm text-center text-gray-600">Premium Coverage</p>
                    <p class="text-center font-bold mt-2">1.5x</p>
                  </div>
                </div>
              </div>

              <!-- Personal Details -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Your Age *</label>
                  <input type="number" [(ngModel)]="application.customerAge" name="age" required
                    min="18" max="100" placeholder="35"
                    class="w-full px-3 py-2 border rounded">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Asset Type *</label>
                  <select [(ngModel)]="application.assetType" name="assetType" required
                    class="w-full px-3 py-2 border rounded">
                    <option value="">Select...</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Commercial">Commercial Property</option>
                    <option value="Vehicle">Vehicle</option>
                  </select>
                </div>
              </div>

              <!-- Asset Details -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Asset Value ($) *</label>
                  <input type="number" [(ngModel)]="application.assetValue" name="assetValue" required
                    min="1" step="1000" placeholder="250000"
                    class="w-full px-3 py-2 border rounded">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Year Built *</label>
                  <input type="number" [(ngModel)]="application.yearBuilt" name="yearBuilt" required
                    min="1800" max="2100" placeholder="2010"
                    class="w-full px-3 py-2 border rounded">
                </div>
              </div>

              <!-- Location Details -->
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">State *</label>
                  <input type="text" [(ngModel)]="application.state" name="state" required
                    placeholder="Florida"
                    class="w-full px-3 py-2 border rounded">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">City *</label>
                  <input type="text" [(ngModel)]="application.city" name="city" required
                    placeholder="Miami"
                    class="w-full px-3 py-2 border rounded">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Zip Code *</label>
                  <input type="text" [(ngModel)]="application.zipCode" name="zipCode" required
                    placeholder="33101"
                    class="w-full px-3 py-2 border rounded">
                </div>
              </div>

              <!-- Risk Zone -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Risk Zone *</label>
                  <select [(ngModel)]="application.riskZone" name="riskZone" required
                    class="w-full px-3 py-2 border rounded">
                    <option value="">Select...</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Deductible ($) *</label>
                  <input type="number" [(ngModel)]="application.deductible" name="deductible" required
                    min="0" step="100" placeholder="5000"
                    class="w-full px-3 py-2 border rounded">
                </div>
              </div>

              <!-- Coverage Preview -->
              @if (application.customerAge && application.planType) {
                <div class="bg-green-50 p-4 rounded-lg">
                  <h4 class="font-bold mb-2">Estimated Coverage</h4>
                  <p class="text-sm text-gray-600">
                    Based on your age ({{ application.customerAge }}) and {{ application.planType }} plan:
                  </p>
                  <p class="text-2xl font-bold text-green-700 mt-2">
                    {{ calculateEstimatedCoverage() }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    * Final coverage will be calculated by our system
                  </p>
                </div>
              }

              <!-- Submit Button -->
              <div class="flex space-x-4">
                <button type="button" (click)="selectedPolicy.set(null)" 
                  class="flex-1 bg-gray-300 text-gray-700 py-3 rounded hover:bg-gray-400">
                  Cancel
                </button>
                <button type="submit" [disabled]="loading()"
                  class="flex-1 bg-primary text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50">
                  {{ loading() ? 'Submitting...' : 'Submit Application' }}
                </button>
              </div>
            </form>
          </div>
        }
      </div>
    </div>
  `
})
export class CustomerPoliciesComponent implements OnInit {
  policies = signal<any[]>([]);
  selectedPolicy = signal<any>(null);
  loading = signal(false);
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  application: any = {
    policyProductId: 0,
    customerAge: null,
    planType: 'Basic',
    assetType: '',
    assetValue: null,
    yearBuilt: null,
    state: '',
    city: '',
    zipCode: '',
    riskZone: '',
    deductible: null
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.apiService.getAllPolicyProducts().subscribe({
      next: (data) => this.policies.set(data),
      error: () => this.showNotification('Failed to load policies', 'error')
    });
  }

  selectPolicy(policy: any): void {
    this.selectedPolicy.set(policy);
    this.application.policyProductId = policy.id;
  }

  calculateEstimatedCoverage(): string {
    if (!this.application.assetValue) return 'Enter asset value';
    
    const baseCoverage = this.application.assetValue * 0.8;
    
    const planMultiplier = this.application.planType === 'Basic' ? 1.0 :
                          this.application.planType === 'Plus' ? 1.25 : 1.5;
    
    const ageMultiplier = this.application.customerAge <= 30 ? 1.2 :
                         this.application.customerAge <= 40 ? 1.1 :
                         this.application.customerAge <= 50 ? 1.0 :
                         this.application.customerAge <= 60 ? 0.95 : 0.9;
    
    const finalCoverage = baseCoverage * planMultiplier * ageMultiplier;
    
    return '$' + Math.round(finalCoverage).toLocaleString();
  }

  submitApplication(): void {
    this.loading.set(true);
    
    this.apiService.applyPolicyWithPlan(this.application).subscribe({
      next: (response) => {
        this.showNotification(response.message || 'Application submitted successfully!', 'success');
        this.loading.set(false);
        setTimeout(() => {
          this.selectedPolicy.set(null);
          this.resetForm();
        }, 2000);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Failed to submit application', 'error');
        this.loading.set(false);
      }
    });
  }

  resetForm(): void {
    this.application = {
      policyProductId: 0,
      customerAge: null,
      planType: 'Basic',
      assetType: '',
      assetValue: null,
      yearBuilt: null,
      state: '',
      city: '',
      zipCode: '',
      riskZone: '',
      deductible: null
    };
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => {
      this.notification.set({ show: false, message: '', type: 'success' });
    }, 3000);
  }
}
