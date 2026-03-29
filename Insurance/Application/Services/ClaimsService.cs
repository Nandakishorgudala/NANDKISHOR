using Insurance.Application.DTOs.Claim;
using Insurance.Application.Exceptions;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;
using UglyToad.PdfPig;

namespace Application.Services
{
    public class ClaimsService : IClaimsService
    {
        private readonly IClaimsRepository _claimsRepository;
        private readonly IPolicyRepository _policyRepository;
        private readonly IClaimsOfficerRepository _officerRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IInvoiceService _invoiceService;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public ClaimsService(
            IClaimsRepository claimsRepository,
            IPolicyRepository policyRepository,
            IClaimsOfficerRepository officerRepository,
            ICustomerRepository customerRepository,
            IInvoiceService invoiceService,
            IInvoiceRepository invoiceRepository,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _claimsRepository = claimsRepository;
            _policyRepository = policyRepository;
            _officerRepository = officerRepository;
            _customerRepository = customerRepository;
            _invoiceService = invoiceService;
            _invoiceRepository = invoiceRepository;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<ClaimResponse> CreateClaimAsync(int customerId, CreateClaimDto dto)
        {
            var policy = await _policyRepository.GetByIdAsync(dto.PolicyId);
            if (policy == null)
                throw new NotFoundException("Policy not found.");

            if (policy.CustomerId != customerId)
                throw new ForbiddenException("This policy does not belong to you.");

            if (policy.Status != PolicyStatus.Active)
                throw new BadRequestException("Claims can only be filed for active policies.");

            if (dto.ClaimedAmount > policy.CoverageAmount)
                throw new BadRequestException($"Claim amount (₹{dto.ClaimedAmount:N2}) cannot exceed the remaining policy coverage (₹{policy.CoverageAmount:N2}).");

            // Validation: Incident date must be no earlier than 6 months before today and no later than today
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            if (dto.IncidentDate < sixMonthsAgo || dto.IncidentDate > DateTime.UtcNow)
            {
                throw new BadRequestException("Incident date must be within the last 6 months and not in the future.");
            }

            if (dto.IncidentDate < policy.StartDate || dto.IncidentDate > policy.EndDate)
            {
                throw new BadRequestException("Incident date must be within the policy tenure.");
            }

            var claim = new Claims(
                dto.PolicyId,
                dto.IncidentDate,
                dto.IncidentLocation,
                dto.IncidentZipCode,
                dto.IncidentDescription,
                dto.ClaimedAmount,
                dto.DocumentId
            );

            await _claimsRepository.AddAsync(claim);
            await _claimsRepository.SaveChangesAsync();

            return MapToResponse(claim, policy);
        }

        public async Task<ClaimResponse> GetClaimByIdAsync(int claimId)
        {
            var claim = await _claimsRepository.GetByIdAsync(claimId);
            if (claim == null)
                throw new InvalidOperationException("Claim not found.");

            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
            return MapToResponse(claim, policy);
        }

        public async Task<IEnumerable<ClaimResponse>> GetClaimsByCustomerIdAsync(int customerId)
        {
            var policies = await _policyRepository.GetByCustomerIdAsync(customerId);
            var allClaims = new List<ClaimResponse>();

            foreach (var policy in policies)
            {
                var claims = await _claimsRepository.GetByPolicyIdAsync(policy.Id);
                foreach (var claim in claims)
                {
                    allClaims.Add(MapToResponse(claim, policy));
                }
            }

            return allClaims;
        }

        public async Task<IEnumerable<ClaimResponse>> GetClaimsByOfficerIdAsync(int officerId)
        {
            var claims = await _claimsRepository.GetByClaimsOfficerIdAsync(officerId);
            var responses = new List<ClaimResponse>();

            foreach (var claim in claims)
            {
                var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
                responses.Add(MapToResponse(claim, policy));
            }

            return responses;
        }

        public async Task<IEnumerable<ClaimResponse>> GetPendingClaimsAsync()
        {
            var claims = await _claimsRepository.GetPendingClaimsAsync();
            var responses = new List<ClaimResponse>();

            foreach (var claim in claims)
            {
                var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
                responses.Add(MapToResponse(claim, policy));
            }

            return responses;
        }

        public async Task AssignClaimToOfficerAsync(int claimId, int officerId)
        {
            var claim = await _claimsRepository.GetByIdAsync(claimId);
            if (claim == null)
                throw new NotFoundException("Claim not found.");

            var officer = await _officerRepository.GetByIdAsync(officerId);
            if (officer == null || !officer.IsActive)
                throw new BadRequestException("Claims officer not found or inactive.");

            claim.AssignOfficer(officerId);
            await _claimsRepository.UpdateAsync(claim);
            await _claimsRepository.SaveChangesAsync();
        }

        public async Task<ClaimResponse> ReviewClaimAsync(int officerId, ReviewClaimDto dto)
        {
            var claim = await _claimsRepository.GetByIdAsync(dto.ClaimId);
            if (claim == null)
                throw new InvalidOperationException("Claim not found.");

            if (claim.ClaimsOfficerId != officerId)
                throw new UnauthorizedAccessException("This claim is not assigned to you.");

            // Set disaster impact score and property loss percentage
            claim.SetDisasterImpactScore(dto.DisasterImpactScore);
            claim.SetPropertyLossPercentage(dto.PropertyLossPercentage);

            // Calculate fraud risk score (simplified logic)
            var fraudScore = CalculateFraudRiskScore(claim);
            claim.SetFraudRiskScore(fraudScore);

            // Calculate estimated loss
            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
            var estimatedLoss = CalculateEstimatedLoss(
                policy.CoverageAmount,
                dto.PropertyLossPercentage,
                dto.DisasterImpactScore
            );
            claim.SetEstimatedLoss(estimatedLoss);

            await _claimsRepository.UpdateAsync(claim);
            await _claimsRepository.SaveChangesAsync();

            return MapToResponse(claim, policy);
        }

        public async Task<ClaimResponse> ApproveClaimAsync(int officerId, ApproveClaimDto dto)
        {
            var claim = await _claimsRepository.GetByIdAsync(dto.ClaimId);
            if (claim == null)
                throw new NotFoundException("Claim not found.");

            if (claim.ClaimsOfficerId != officerId)
                throw new ForbiddenException("This claim is not assigned to you.");

            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
            if (policy == null)
                throw new NotFoundException("Policy not found.");

            // Update policy coverage directly upon officer approval and settle it
            claim.Approve(dto.ApprovedAmount, dto.ReviewNotes);
            claim.Settle(); // Move to settled to indicate it's fully processed
            policy.DeductCoverage(dto.ApprovedAmount);

            await _claimsRepository.UpdateAsync(claim);
            await _policyRepository.UpdateAsync(policy);
            await _claimsRepository.SaveChangesAsync();

            // Generate Payout Invoice/Advice
            await _invoiceService.GenerateInvoiceAsync(InvoiceType.Claim, claim.Id);

            return MapToResponse(claim, policy);
        }

        public async Task<ClaimResponse> AcceptClaimAsync(int customerId, int claimId)
        {
            var claim = await _claimsRepository.GetByIdAsync(claimId);
            if (claim == null)
                throw new NotFoundException("Claim not found.");

            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
            if (policy == null)
                throw new NotFoundException("Policy not found.");

            if (policy.CustomerId != customerId)
                throw new ForbiddenException("This claim does not belong to you.");

            if (claim.Status != ClaimStatus.Approved)
                throw new BadRequestException("Only approved claims can be accepted.");

            // Atomically update policy and claim
            claim.AcceptClaim();
            policy.DeductCoverage(claim.ApprovedAmount);

            await _claimsRepository.UpdateAsync(claim);
            await _policyRepository.UpdateAsync(policy);
            await _claimsRepository.SaveChangesAsync();

            return MapToResponse(claim, policy);
        }

        public async Task<ClaimResponse> RejectClaimAsync(int officerId, RejectClaimDto dto)
        {
            var claim = await _claimsRepository.GetByIdAsync(dto.ClaimId);
            if (claim == null)
                throw new InvalidOperationException("Claim not found.");

            if (claim.ClaimsOfficerId != officerId)
                throw new UnauthorizedAccessException("This claim is not assigned to you.");

            claim.Reject(dto.ReviewNotes);
            await _claimsRepository.UpdateAsync(claim);
            await _claimsRepository.SaveChangesAsync();

            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
            return MapToResponse(claim, policy);
        }

        public async Task<ClaimAnalysisResultDto> AnalyzeClaimAsync(int claimId)
        {
            var claim = await _claimsRepository.GetByIdAsync(claimId);
            if (claim == null) throw new KeyNotFoundException("Claim not found.");

            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId);
            if (policy == null) throw new InvalidOperationException("Policy associated with claim not found.");

            var customer = await _customerRepository.GetByIdAsync(policy.CustomerId);
            
            // 1. Find the Policy Invoice
            var invoice = await _invoiceRepository.GetByRelatedIdAsync(InvoiceType.PolicyApplication, policy.ApplicationId);
            if (invoice == null) throw new InvalidOperationException("No policy invoice found for OCR analysis.");

            // 2. OCR Extraction
            string extractedText = "";
            var storagePath = _configuration["FileUploadSettings:StoragePath"] ?? "uploads/documents";
            var absolutePath = Path.Combine(Directory.GetCurrentDirectory(), storagePath, invoice.FilePath);

            if (File.Exists(absolutePath))
            {
                try
                {
                    using (var pdf = PdfDocument.Open(absolutePath))
                    {
                        foreach (var page in pdf.GetPages())
                        {
                            extractedText += string.Join(" ", page.GetWords().Select(w => w.Text)) + " ";
                        }
                    }
                }
                catch (Exception ex) { extractedText = "OCR Error: " + ex.Message; }
            }

            // 3. Rule-Based Validation
            var customerName = customer?.User?.FullName ?? policy.Customer?.User?.FullName ?? "Unknown";
            bool nameMatch = extractedText.ToLower().Contains(customerName.ToLower().Split(' ')[0]);
            
            bool isWithinPeriod = claim.IncidentDate >= policy.StartDate && claim.IncidentDate <= policy.EndDate;
            int daysSinceStart = (int)(claim.IncidentDate - policy.StartDate).TotalDays;
            bool passesWaitingPeriod = daysSinceStart >= 15;

            var result = new ClaimAnalysisResultDto
            {
                ClaimId = claimId,
                ExtractedText = extractedText.Length > 1500 ? extractedText.Substring(0, 1500) + "..." : extractedText,
                IsNameMatch = nameMatch,
                NameMatchScore = nameMatch ? 100 : 0,
                IsWithinPolicyPeriod = isWithinPeriod,
                PassesWaitingPeriod = passesWaitingPeriod,
                PolicyStartDate = policy.StartDate,
                PolicyEndDate = policy.EndDate,
                ClaimDate = claim.IncidentDate,
                DaysSincePolicyStart = daysSinceStart,
                Recommendation = "Pending AI...",
                Reasoning = ""
            };

            // 4. AI Recommendation via Groq (Wait-period aware)
            var apiKey = _configuration["ClaimVerificationSettings:ApiKey"];
            if (!string.IsNullOrEmpty(apiKey))
            {
                await GetAiClaimRecommendation(result, customerName, extractedText);
            }
            else
            {
                result.Recommendation = (isWithinPeriod && passesWaitingPeriod) ? "Approve" : "Reject";
                result.Reasoning = "AI key missing. Rule-based assessment completed.";
            }

            return result;
        }

        private async Task GetAiClaimRecommendation(ClaimAnalysisResultDto result, string customerName, string extractedText)
        {
            var apiKey = _configuration["ClaimVerificationSettings:ApiKey"];
            var url = "https://api.groq.com/openai/v1/chat/completions";
            
            var isWithinVal = result.IsWithinPolicyPeriod ? "Yes" : "No";
            var passesWaitVal = result.PassesWaitingPeriod ? "Yes" : "No";

            var prompt = $@"
Analyze the following claim for ShieldSure Insurance. 
VALDIATION PARAMETERS:
- Applicant Name: {customerName}
- Policy Start Date: {result.PolicyStartDate:yyyy-MM-dd}
- Claim Incident Date: {result.ClaimDate:yyyy-MM-dd}
- Days Since Policy Start: {result.DaysSincePolicyStart}
- Within Policy Period: {isWithinVal}
- Passes 15-day Waiting Period: {passesWaitVal}

DOCUMENT TEXT (INVOICE):
---
{extractedText}
---

TASK:
1. Verify if the name '{customerName}' appears as the policyholder in the invoice.
2. Confirm the incident occurred during the policy period.
3. CRITICAL: Evaluate the 15-day waiting period. If days since policy start ({result.DaysSincePolicyStart}) is less than 15, the claim must be REJECTED unless there is an extreme justification (rare).
4. Provide a final recommendation and professional reasoning.

RESPOND STRICTLY IN JSON:
{{
  ""name_score"": 0-100,
  ""recommendation"": ""Approve/Reject/Manual Review"",
  ""reasoning"": ""Professional summary of findings including waiting period status.""
}}
";

            var payload = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[] { new { role = "user", content = prompt } },
                response_format = new { type = "json_object" }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = JsonContent.Create(payload);

            try
            {
                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var json = JsonSerializer.Deserialize<JsonElement>(content);
                    var aiText = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                    var parsed = JsonSerializer.Deserialize<JsonElement>(aiText);

                    result.NameMatchScore = parsed.GetProperty("name_score").GetDouble();
                    result.Recommendation = parsed.GetProperty("recommendation").GetString();
                    result.Reasoning = parsed.GetProperty("reasoning").GetString();
                }
            }
            catch (Exception ex)
            {
                result.Recommendation = "Manual Review";
                result.Reasoning = "AI component error: " + ex.Message;
            }
        }

        private decimal CalculateFraudRiskScore(Claims claim)
        {
            // Improved fraud detection logic for Disaster & Casualty Insurance
            decimal score = 0;

            // 1. Inflated Claim Check (Claimed vs Estimated Loss)
            if (claim.EstimatedLossAmount > 0)
            {
                var ratio = claim.ClaimedAmount / claim.EstimatedLossAmount;
                if (ratio > 2.0m) score += 40;
                else if (ratio > 1.5m) score += 20;
            }

            // 2. Incident Timing (Claim filed very soon after creation)
            var tenureDays = (claim.CreatedAt - claim.IncidentDate).TotalDays;
            if (tenureDays < 2) score += 15;

            // 3. Description Length/Detail (Vague descriptions are suspicious)
            if (string.IsNullOrWhiteSpace(claim.IncidentDescription) || claim.IncidentDescription.Length < 20)
                score += 10;

            // 4. Missing Proof
            if (!claim.DocumentId.HasValue)
                score += 20;

            return Math.Min(score, 100);
        }

        private decimal CalculateEstimatedLoss(decimal coverageAmount, decimal propertyLossPercentage, decimal disasterImpactScore)
        {
            // Formula: Coverage Amount × Property Loss % × Disaster Impact Score
            return coverageAmount * (propertyLossPercentage / 100) * disasterImpactScore;
        }

        private ClaimResponse MapToResponse(Claims claim, Policy policy)
        {
            // We'll calculate the regional density synchronously for the response
            // In a high-traffic app, this would be cached or pre-calculated
            int regionalCount = _claimsRepository.GetCountByZipCodeAsync(claim.IncidentZipCode).GetAwaiter().GetResult();

            return new ClaimResponse
            {
                Id = claim.Id,
                PolicyId = claim.PolicyId,
                PolicyNumber = policy?.PolicyNumber,
                PolicyName = policy?.Application?.PolicyProduct?.Name ?? "N/A",
                ClaimNumber = $"CLM-{claim.Id}",
                ClaimsOfficerId = claim.ClaimsOfficerId,
                IncidentDate = claim.IncidentDate,
                IncidentLocation = claim.IncidentLocation,
                IncidentZipCode = claim.IncidentZipCode,
                IncidentDescription = claim.IncidentDescription,
                ClaimedAmount = claim.ClaimedAmount,
                EstimatedLossAmount = claim.EstimatedLossAmount,
                ApprovedAmount = claim.ApprovedAmount,
                DisasterImpactScore = claim.DisasterImpactScore,
                FraudRiskScore = claim.FraudRiskScore,
                PropertyLossPercentage = claim.PropertyLossPercentage,
                ReviewNotes = claim.ReviewNotes,
                Status = claim.Status.ToString(),
                DocumentId = claim.DocumentId,
                RegionalClaimCount = regionalCount,
                CreatedAt = claim.CreatedAt
            };
        }
    }
}
