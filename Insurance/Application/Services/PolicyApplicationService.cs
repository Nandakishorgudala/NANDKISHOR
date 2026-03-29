using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Policy;
using Application.Interfaces;
using Insurance.Domain.Entities;


 
using Insurance.Application.Interfaces;
 

namespace Application.Services
{
    public class PolicyApplicationService : IPolicyApplicationService
    {
        private readonly IPolicyApplicationRepository _applicationRepo;
        private readonly IAgentRepository _agentRepo;
        private readonly IPolicyRepository _policyRepo;
        private readonly IPolicyProductRepository _policyProductRepo;
        private readonly IApplicationDocumentRepository _documentRepo;

        public PolicyApplicationService(
            IPolicyApplicationRepository applicationRepo,
            IAgentRepository agentRepo,
            IPolicyRepository policyRepo,
            IPolicyProductRepository policyProductRepo,
            IApplicationDocumentRepository documentRepo)
        {
            _applicationRepo = applicationRepo;
            _agentRepo = agentRepo;
            _policyRepo = policyRepo;
            _policyProductRepo = policyProductRepo;
            _documentRepo = documentRepo;
        }

        // ==============================
        // SUBMIT WITH PLAN TYPE
        // ==============================
        public async Task<int> SubmitApplicationWithPlanAsync(int customerId, ApplyPolicyWithPlanDto dto)
        {
            // Validate that document exists
            var document = await _documentRepo.GetByIdAsync(dto.DocumentId)
                ?? throw new InvalidOperationException("The specified document was not found. Please upload a document before submitting.");

            // Calculate base coverage with plan multiplier
            decimal planMultiplier = dto.PlanType.ToLower() switch
            {
                "basic" => 1.0m,
                "plus" => 1.25m,
                "advanced" => 1.5m,
                _ => 1.0m
            };

            // Age-based coverage adjustment (younger = more coverage)
            decimal ageMultiplier = dto.CustomerAge switch
            {
                <= 30 => 1.2m,  // 20% more coverage
                <= 40 => 1.1m,  // 10% more coverage
                <= 50 => 1.0m,  // Standard coverage
                <= 60 => 0.95m, // 5% less coverage
                _ => 0.9m       // 10% less coverage
            };

            // Calculate final coverage (Use RequestedCoverage if provided, otherwise fallback to automated calculation)
            decimal baseCoverage = dto.AssetValue * 0.8m; // 80% of asset value
            decimal automatedCoverage = baseCoverage * planMultiplier * ageMultiplier;
            decimal finalCoverage = (dto.RequestedCoverage.HasValue && dto.RequestedCoverage.Value > 0)
                ? dto.RequestedCoverage.Value
                : automatedCoverage;

            // Enforce validation: Coverage cannot exceed Asset Value (as requested)
            if (finalCoverage > dto.AssetValue)
            {
                finalCoverage = dto.AssetValue;
            }

            // Calculate risk score
            int riskScore = CalculateRiskScoreEnhanced(dto);
            
            // Calculate premium based on plan and age
            decimal premium = CalculatePremiumEnhanced(dto.AssetValue, finalCoverage, riskScore, planMultiplier, dto.CustomerAge);

            // Fetch policy product for tenure
            var policyProduct = await _policyProductRepo.GetByIdAsync(dto.PolicyProductId);
            DateTime startDate = dto.StartDate;
            DateTime endDate = startDate.AddMonths(policyProduct?.TenureMonths ?? 12);

            var application = PolicyApplication.Create(
                customerId,
                dto.PolicyProductId,
                dto.AssetType,
                dto.AssetValue,
                dto.YearBuilt,
                dto.State,
                dto.City,
                dto.ZipCode,
                dto.RiskZone,
                finalCoverage,
                dto.Deductible,
                riskScore,
                premium,
                riskScore >= 80,
                startDate,
                endDate
            );

            await _applicationRepo.AddAsync(application);
            await _applicationRepo.SaveChangesAsync();

            // Link the uploaded document to this newly created application
            var docToLink = await _documentRepo.GetByIdAsync(dto.DocumentId)
                ?? throw new InvalidOperationException($"Document {dto.DocumentId} not found during application linking.");
            docToLink.LinkToApplication(application.Id);
            await _applicationRepo.SaveChangesAsync();

            // No automatic agent assignment - admin will assign manually

            return application.Id;
        }

        // ==============================
        // SUBMIT (Original)
        // ==============================
        public async Task<int> SubmitApplicationAsync(int customerId, ApplyPolicyDto dto)
        {
            int riskScore = CalculateRiskScore(dto);
            decimal premium = CalculatePremium(dto.AssetValue, dto.CoverageAmount, riskScore);

            // Fetch policy product for tenure
            var policyProduct = await _policyProductRepo.GetByIdAsync(dto.PolicyProductId);
            DateTime startDate = dto.StartDate;
            DateTime endDate = startDate.AddMonths(policyProduct?.TenureMonths ?? 12);

            var application = PolicyApplication.Create(
     customerId,
     dto.PolicyProductId,

     dto.AssetType,
     dto.AssetValue,
     dto.YearBuilt,

     dto.State,
     dto.City,
     dto.ZipCode,
     "Medium", // Default risk zone for old method

     dto.CoverageAmount,
     dto.Deductible,

     riskScore,
     premium,
     riskScore >= 80,
     startDate,
     endDate
 );

            await _applicationRepo.AddAsync(application);
            await _applicationRepo.SaveChangesAsync();

            // No automatic agent assignment - admin will assign manually

            return application.Id;
        }

        // ==============================
        // GET CUSTOMER APPLICATIONS
        // ==============================
        public async Task<IEnumerable<object>> GetCustomerApplicationsAsync(int customerId)
        {
            var applications = await _applicationRepo.GetByCustomerIdAsync(customerId);

            // Include document metadata via repository for each app
            var appIds = applications.Select(a => a.Id).ToList();
            var docList = await _documentRepo.GetByApplicationIdsAsync(appIds);
            var docs = docList.ToDictionary(d => d.PolicyApplicationId);
            
            return applications.Select(app =>
            {
                docs.TryGetValue(app.Id, out var doc);
                return (object)new
                {
                    app.Id,
                    ApplicationNumber = $"APP-{app.Id}",
                    ProductName = app.PolicyProduct?.Name ?? "N/A",
                    app.PolicyProductId,
                    app.AssetType,
                    app.AssetValue,
                    app.City,
                    app.State,
                    app.ZipCode,
                    app.CoverageAmount,
                    app.CalculatedPremium,
                    app.RiskScore,
                    Status = app.Status.ToString(),
                    app.RejectionReason,
                    app.SubmittedAt,
                    app.ReviewedAt,
                    DocumentId = doc?.Id,
                    DocumentFileName = doc?.FileName,
                    DocumentContentType = doc?.ContentType
                };
            });
        }

        // ==============================
        // ASSIGN AGENT
        // ==============================
        public async Task AssignAgentAsync(int applicationId)
        {
            var application = await _applicationRepo.GetByIdAsync(applicationId);

            if (application == null)
                throw new Exception("Application not found");

            var agents = await _agentRepo.GetActiveAgentsAsync();

            if (!agents.Any())
                throw new Exception("No active agents available");

            var selectedAgent = agents
                .Select(a => new
                {
                    Agent = a,
                    Count = _applicationRepo.CountByAgentIdAsync(a.Id).Result
                })
                .OrderBy(x => x.Count)
                .ThenBy(x => x.Agent.Id)
                .First()
                .Agent;

            application.AssignAgent(selectedAgent.Id);

            await _applicationRepo.SaveChangesAsync();
        }

        // ==============================
        // APPROVE
        // ==============================
        public async Task ApproveApplicationAsync(int applicationId, int agentId)
        {
            var application = await _applicationRepo.GetByIdAsync(applicationId);

            if (application == null)
                throw new Exception("Application not found");

            // Approve the application (Sets status to AgentApproved)
            application.Approve(agentId);
            await _applicationRepo.SaveChangesAsync();
            
            // Note: Policy creation is deferred until customer pays.
        }

        // ==============================
        // REJECT
        // ==============================
        public async Task RejectApplicationAsync(int applicationId, int agentId, string reason)
        {
            var application = await _applicationRepo.GetByIdAsync(applicationId);

            if (application == null)
                throw new Exception("Application not found");

            application.Reject(agentId, reason);

            await _applicationRepo.SaveChangesAsync();
        }

        // ==============================
        // PRIVATE BUSINESS LOGIC
        // ==============================

        private int CalculateRiskScoreEnhanced(ApplyPolicyWithPlanDto dto)
        {
            int score = 0;

            // Asset value risk
            if (dto.AssetValue > 500000) score += 20;
            else if (dto.AssetValue > 300000) score += 10;

            // Age of property
            int propertyAge = DateTime.Now.Year - dto.YearBuilt;
            if (propertyAge > 50) score += 25;
            else if (propertyAge > 30) score += 15;
            else if (propertyAge > 20) score += 10;

            // Risk zone
            score += dto.RiskZone.ToLower() switch
            {
                "high" => 30,
                "medium" => 15,
                "low" => 5,
                _ => 10
            };

            // Customer age (younger customers = slightly lower risk)
            if (dto.CustomerAge < 30) score -= 5;
            else if (dto.CustomerAge > 65) score += 10;

            return Math.Max(0, Math.Min(100, score)); // Clamp between 0-100
        }

        private decimal CalculatePremiumEnhanced(decimal assetValue, decimal coverageAmount, int riskScore, decimal planMultiplier, int customerAge)
        {
            // Base premium calculation
            decimal baseRate = 0.015m; // 1.5% of coverage
            decimal premium = coverageAmount * baseRate;

            // Risk adjustment
            premium += premium * (riskScore / 100m);

            // Plan type adjustment
            premium *= planMultiplier;

            // Age discount (younger customers get slight discount)
            if (customerAge < 30)
                premium *= 0.95m; // 5% discount
            else if (customerAge > 60)
                premium *= 1.05m; // 5% surcharge

            return Math.Round(premium, 2);
        }

        private int CalculateRiskScore(ApplyPolicyDto dto)
        {
            int score = 0;

            if (dto.AssetValue > 10000000)
                score += 20;

            if (dto.YearBuilt < 2000)
                score += 15;

            if (dto.State.ToLower().Contains("coastal"))
                score += 25;

            return score;
        }

        private decimal CalculatePremium(decimal assetValue, decimal coverageAmount, int riskScore)
        {
            decimal baseRate = 0.02m;
            decimal premium = coverageAmount * baseRate;
            premium += premium * (riskScore / 100m);
            return premium;
        }
    }
}
