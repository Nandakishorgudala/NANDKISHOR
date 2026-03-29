export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  relatedType: 'PolicyApplication' | 'Claim';
  relatedId: number;
  amountBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'Generated' | 'Sent' | 'Viewed' | 'Downloaded';
  generatedAt: string;
  viewUrl: string;
  downloadUrl: string;
}
