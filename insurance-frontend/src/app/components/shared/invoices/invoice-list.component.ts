import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice } from '../../../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoice-container bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Invoices & Payouts</h3>
          <p class="text-sm text-gray-500">History of your financial transactions</p>
        </div>
        <div class="flex gap-2">
           <span class="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
             {{ invoices.length }} Records
           </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              <th class="px-6 py-4 border-b border-gray-100">Invoice #</th>
              <th class="px-6 py-4 border-b border-gray-100">Type</th>
              <th class="px-6 py-4 border-b border-gray-100">Date</th>
              <th class="px-6 py-4 border-b border-gray-100">Amount</th>
              <th class="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let invoice of invoices" class="hover:bg-gray-50/80 transition-colors group">
              <td class="px-6 py-4">
                <span class="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {{ getProp(invoice, 'invoiceNumber') }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 text-xs font-medium rounded-full ' + (getProp(invoice, 'relatedType') === 'Claim' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700')">
                  {{ getProp(invoice, 'relatedType') === 'Claim' ? 'Payout' : 'Premium' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ getProp(invoice, 'generatedAt') | date:'mediumDate' }}
              </td>
              <td class="px-6 py-4 font-bold text-gray-900">
                {{ getProp(invoice, 'totalAmount') | currency:'INR':'symbol-narrow' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button (click)="viewPdf(invoice.id || invoice.Id)" 
                          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View PDF">
                    <span class="material-icons text-lg">visibility</span>
                  </button>
                  <button (click)="downloadPdf(invoice.id || invoice.Id)" 
                          class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download">
                    <span class="material-icons text-lg">file_download</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="invoices.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500 italic">
                No invoices found yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

      <!-- Invoice Viewing Modal inside InvoiceListComponent -->
      <div *ngIf="viewingUrl || isLoadingPdf" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[3000]" (click)="closePdf()">
        <div class="bg-white rounded-2xl w-[900px] h-[85vh] flex flex-col overflow-hidden shadow-2xl transition-all" (click)="$event.stopPropagation()">
          <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="font-bold text-gray-900 flex items-center gap-2 text-[20px]">
              <span class="material-icons text-indigo-600">receipt_long</span> Document Preview
            </h3>
            <button (click)="closePdf()" class="text-gray-500 hover:text-gray-800 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors font-bold text-xl">&times;</button>
          </div>
          <div class="flex-1 bg-[#0f172a] overflow-hidden flex justify-center items-center">
            <ng-container *ngIf="isLoadingPdf; else pdfViewer">
              <div class="text-white text-lg flex flex-col items-center gap-3">
                <span class="material-icons text-4xl animate-pulse text-indigo-400">autorenew</span> 
                <span class="font-medium tracking-wide">Securely streaming document...</span>
              </div>
            </ng-container>
            <ng-template #pdfViewer>
              <iframe *ngIf="viewingUrl" [src]="viewingUrl" class="w-full h-full border-none"></iframe>
            </ng-template>
          </div>
        </div>
      </div>
  `,
  styles: [`
    :host { display: block; }
    .material-icons { vertical-align: middle; }
  `]
})
export class InvoiceListComponent implements OnInit, OnChanges {
  @Input() customerId!: number;
  @Input() preloadedInvoices?: any[];
  invoices: any[] = []; // Using any to handle potential capitalization diffs
  
  viewingUrl: SafeResourceUrl | null = null;
  isLoadingPdf: boolean = false;
  private sanitizer = inject(DomSanitizer);

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    if (this.preloadedInvoices) {
      this.invoices = this.preloadedInvoices;
    } else if (this.customerId) {
      this.loadInvoices();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preloadedInvoices'] && changes['preloadedInvoices'].currentValue) {
      this.invoices = this.preloadedInvoices || [];
    } else if (changes['customerId']) {
      const prev = changes['customerId'].previousValue;
      const curr = changes['customerId'].currentValue;
      
      if (curr && curr !== prev && !this.preloadedInvoices) {
        this.loadInvoices();
      }
    }
  }

  loadInvoices(): void {
    if (!this.customerId) return;
    
    this.invoiceService.getCustomerInvoices(this.customerId).subscribe({
      next: (data) => {
        this.invoices = data;
      },
      error: (err) => {
        console.error('Error loading invoices for customer', this.customerId, err);
      }
    });
  }

  getProp(obj: any, prop: string): any {
    return obj[prop] || obj[prop.charAt(0).toUpperCase() + prop.slice(1)];
  }

  viewPdf(id: number): void {
    this.isLoadingPdf = true;
    this.invoiceService.getPdfBlob(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        this.viewingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isLoadingPdf = false;
      },
      error: () => {
        alert('Failed to securely load the invoice document.');
        this.isLoadingPdf = false;
      }
    });
  }

  closePdf(): void {
    this.viewingUrl = null;
    this.isLoadingPdf = false;
  }

  downloadPdf(id: number): void {
    this.invoiceService.downloadPdf(id);
  }
}
