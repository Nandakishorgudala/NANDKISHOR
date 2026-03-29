import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  constructor(private api: ApiService, private http: HttpClient) {}

  getCustomerInvoices(customerId: number): Observable<Invoice[]> {
    return this.api.getInvoices(customerId);
  }

  getInvoiceById(invoiceId: number): Observable<Invoice> {
    return this.api.get<Invoice>(`Invoices/${invoiceId}`);
  }

  getInvoiceByRelatedId(type: string, relatedId: number): Observable<Invoice> {
    return this.api.get<Invoice>(`Invoices/related/${type}/${relatedId}`);
  }

  viewPdf(invoiceId: number): void {
     // Legacy functionality, use getPdfBlob() for in-app viewing
     this.http.get(`${this.api.getBaseUrl()}/Invoices/${invoiceId}/view`, { responseType: 'blob' })
       .subscribe(blob => {
         const url = window.URL.createObjectURL(blob);
         window.open(url, '_blank');
       });
  }

  getPdfBlob(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.api.getBaseUrl()}/Invoices/${invoiceId}/view`, { responseType: 'blob' });
  }

  downloadPdf(invoiceId: number, fileName: string = 'invoice.pdf'): void {
    this.http.get(`${this.api.getBaseUrl()}/Invoices/${invoiceId}/pdf`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
