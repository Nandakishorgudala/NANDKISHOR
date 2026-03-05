using Insurance.Application.DTOs.Claim;
using Insurance.Application.Exceptions;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;

namespace Application.Services
{
    public class ClaimsService : IClaimsService
    {
        private readonly IClaimsRepository _claimsRepository;
        private readonly IPolicyRepository _policyRepository;
        private readonly IClaimsOfficerRepository _officerRepository;
        private readonly ICustomerRepository _customerRepository;

        public ClaimsService(
            IClaimsRepository claimsRepository,
            IPolicyRepository policyRepository,
            IClaimsOfficerRepository officerRepository,
            ICustomerRepository customerRepository)
        {
            _claimsRepository = claimsRepository;
            _policyRepository = policyRepository;
            _officerRepository = officerRepository;
            _customerRepository = customerRepository;
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

            var claim = new Claims(
                dto.PolicyId,
                dto.IncidentDate,
                dto.IncidentLocation,
                dto.IncidentZipCode,
                dto.IncidentDescription,
                dto.ClaimedAmount
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

            // Deduct approved amount from policy coverage
            policy.DeductCoverage(dto.ApprovedAmount);
            await _policyRepository.UpdateAsync(policy);

            claim.Approve(dto.ApprovedAmount, dto.ReviewNotes);
            await _claimsRepository.UpdateAsync(claim);
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

        private decimal CalculateFraudRiskScore(Claims claim)
        {
            // Simplified fraud detection logic
            decimal score = 0;

            // Check if claimed amount is suspiciously high
            if (claim.ClaimedAmount > claim.EstimatedLossAmount * 1.5m)
                score += 30;

            // Check incident timing (claims filed immediately after policy start might be suspicious)
            // This would require policy start date - simplified here
            score += 10;

            // Geographic consistency check would go here
            score += 5;

            return Math.Min(score, 100);
        }

        private decimal CalculateEstimatedLoss(decimal coverageAmount, decimal propertyLossPercentage, decimal disasterImpactScore)
        {
            // Formula: Coverage Amount × Property Loss % × Disaster Impact Score
            return coverageAmount * (propertyLossPercentage / 100) * disasterImpactScore;
        }

        private ClaimResponse MapToResponse(Claims claim, Policy policy)
        {
            return new ClaimResponse
            {
                Id = claim.Id,
                PolicyId = claim.PolicyId,
                PolicyNumber = policy?.PolicyNumber,
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
                CreatedAt = claim.CreatedAt
            };
        }
    }
}
