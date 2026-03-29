using Application.DTOs.Payment;
using Application.Interfaces;
using Insurance.Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace Application.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPolicyApplicationRepository _applicationRepo;
        private readonly IPolicyProductRepository _policyProductRepo;
        private readonly IPolicyRepository _policyRepo;
        private readonly IPaymentRepository _paymentRepo;
        private readonly ICommissionRepository _commissionRepo;
        private readonly IInvoiceService _invoiceService;

        public PaymentService(
            IPolicyApplicationRepository applicationRepo,
            IPolicyProductRepository policyProductRepo,
            IPolicyRepository policyRepo,
            IPaymentRepository paymentRepo,
            ICommissionRepository commissionRepo,
            IInvoiceService invoiceService)
        {
            _applicationRepo = applicationRepo;
            _policyProductRepo = policyProductRepo;
            _policyRepo = policyRepo;
            _paymentRepo = paymentRepo;
            _commissionRepo = commissionRepo;
            _invoiceService = invoiceService;
        }

        public async Task<int> PayAndCreatePolicyAsync(int customerId, PaymentRecordDto dto)
        {
            // 1. Fetch Application
            var application = await _applicationRepo.GetByIdAsync(dto.ApplicationId);

            if (application == null)
                throw new Exception("Application not found.");

            if (application.CustomerId != customerId)
                throw new UnauthorizedAccessException("You are not authorized to pay for this application.");

            if (application.Status != ApplicationStatus.AgentApproved)
                throw new InvalidOperationException("This application is not ready for payment. It must be agent-approved.");

            // Verify payment matches expected premium (allowing standard tolerance)
            if (dto.Amount != application.CalculatedPremium)
                throw new InvalidOperationException("Payment amount does not match the calculated premium.");

            // 2. Finalize application approval to convert it effectively
            application.FinalizeApproval();

            // 3. Create Policy
            var policyProduct = await _policyProductRepo.GetByIdAsync(application.PolicyProductId);
            if (policyProduct == null)
                throw new Exception("Policy product not found.");

            var policyNumber = $"POL-{DateTime.UtcNow:yyyyMMdd}-{application.Id:D6}";
            var policy = new Policy(
                customerId: application.CustomerId,
                applicationId: application.Id,
                policyNumber: policyNumber,
                premiumAmount: application.CalculatedPremium,
                coverageAmount: application.CoverageAmount,
                startDate: application.StartDate,
                endDate: application.EndDate
            );

            await _policyRepo.AddAsync(policy);

            // Save immediately so PolicyId gets generated for Payment and Commission
            await _policyRepo.SaveChangesAsync();

            // 4. Create Payment
            var payment = new Payment(policy.Id, dto.Amount, dto.PaymentMethod, dto.TransactionId);
            payment.MarkAsCompleted("Paid via Customer Portal");
            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();

            // 5. Create Agent Commission
            if (application.AgentId.HasValue)
            {
                decimal commissionAmount = application.CoverageAmount * 0.02m; // 2% of coverage
                var commission = new Commission(application.AgentId.Value, policy.Id, commissionAmount);
                await _commissionRepo.AddAsync(commission);
                await _commissionRepo.SaveChangesAsync();
            }

            // Sync original application status
            await _applicationRepo.SaveChangesAsync();

            // 6. Generate Invoice (Idempotent)
            await _invoiceService.GenerateInvoiceAsync(InvoiceType.PolicyApplication, application.Id);

            return policy.Id;
        }
    }
}
