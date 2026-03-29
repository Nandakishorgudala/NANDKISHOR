using Application.Interfaces;
using Insurance.Application.Interfaces;
using Insurance.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IAgentRepository _agentRepository;
        private readonly IClaimsOfficerRepository _officerRepository;
        private readonly IPolicyApplicationRepository _applicationRepository;
        private readonly IClaimsRepository _claimsRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IPolicyRepository _policyRepository;
        private readonly ICommissionRepository _commissionRepository;

        public DashboardController(
            ICustomerRepository customerRepository,
            IAgentRepository agentRepository,
            IClaimsOfficerRepository officerRepository,
            IPolicyApplicationRepository applicationRepository,
            IClaimsRepository claimsRepository,
            IPaymentRepository paymentRepository,
            IPolicyRepository policyRepository,
            ICommissionRepository commissionRepository)
        {
            _customerRepository = customerRepository;
            _agentRepository = agentRepository;
            _officerRepository = officerRepository;
            _applicationRepository = applicationRepository;
            _claimsRepository = claimsRepository;
            _paymentRepository = paymentRepository;
            _policyRepository = policyRepository;
            _commissionRepository = commissionRepository;
        }

        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminStats()
        {
            var totalCustomers = await _customerRepository.GetTotalCountAsync();
            var totalAgents = await _agentRepository.GetTotalCountAsync();
            var totalOfficers = await _officerRepository.GetTotalCountAsync();
            var pendingApplications = (await _applicationRepository.GetPendingApplicationsAsync()).Count();
            var pendingClaims = (await _claimsRepository.GetUnassignedClaimsAsync()).Count();
            var totalSystemRevenue = await _paymentRepository.GetTotalRevenueAsync();

            return Ok(new
            {
                totalCustomers = totalCustomers,
                totalAgents = totalAgents,
                totalClaimsOfficers = totalOfficers,
                pendingApplications = pendingApplications,
                pendingClaims = pendingClaims,
                totalSystemRevenue = totalSystemRevenue
            });
        }

        [HttpGet("admin/charts")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminCharts([FromQuery] int days = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);

            // Fetch base data
            var applications = await _applicationRepository.GetAllWithDetailsAsync();
            var policies = await _policyRepository.GetAllWithDetailsAsync();
            var payments = await _paymentRepository.GetAllAsync();
            var commissions = await _commissionRepository.GetAllAsync();
            var agents = await _agentRepository.GetAllWithDetailsAsync();
            var claims = await _claimsRepository.GetAllAsync();

            var result = new Insurance.Application.DTOs.Dashboard.AdminChartDataDto();

            // 1. Policies Over Time
            var recentPolicies = policies.Where(p => p.CreatedAt >= cutoffDate).ToList();
            var dates = Enumerable.Range(0, days).Select(offset => cutoffDate.AddDays(offset).Date).ToList();
            
            result.PoliciesOverTime = dates.Select(date => new Insurance.Application.DTOs.Dashboard.DailyPolicyTrendsDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                NewPolicies = recentPolicies.Count(p => p.CreatedAt.Date == date && p.Status == PolicyStatus.Active),
                Renewals = 0 // Mocking renewals for now as the model currently lacks renewal dates
            }).ToList();

            // 2. Policy Status Breakdown
            var recentApps = applications.Where(a => a.SubmittedAt >= cutoffDate).ToList();
            result.PolicyStatusBreakdown = new Insurance.Application.DTOs.Dashboard.PolicyStatusBreakdownDto
            {
                Approved = recentApps.Count(a => a.Status == ApplicationStatus.Approved),
                Pending = recentApps.Count(a => a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.Assigned),
                Rejected = recentApps.Count(a => a.Status == ApplicationStatus.Rejected)
            };

            // 3. Profit & Revenue Breakdown
            var soldPolicies = policies.Where(p => p.CreatedAt >= cutoffDate).ToList();
            var totalRevenue = soldPolicies.Sum(p => p.PremiumAmount);
            var totalCommission = commissions.Where(c => c.CreatedAt >= cutoffDate).Sum(c => c.Amount);

            result.ProfitAndRevenue = new Insurance.Application.DTOs.Dashboard.RevenueBreakdownDto
            {
                TotalRevenue = totalRevenue,
                AgentCommission = totalCommission,
                Profit = totalRevenue - totalCommission
            };

            // 4. Top Agents
            result.TopAgents = agents.Select(a => new Insurance.Application.DTOs.Dashboard.TopAgentDto
            {
                AgentName = a.User?.FullName ?? "Unknown",
                Commission = commissions.Where(c => c.AgentId == a.Id).Sum(c => c.Amount),
                Revenue = applications.Where(app => app.AgentId == a.Id && app.Status == ApplicationStatus.Approved).Sum(app => app.CalculatedPremium)
            })
            .OrderByDescending(a => a.Revenue)
            .Take(10)
            .ToList();

            // 5. Claims Trend
            var recentClaims = claims.Where(c => c.IncidentDate >= cutoffDate).ToList();
            result.ClaimsTrend = dates.Select(date => new Insurance.Application.DTOs.Dashboard.ClaimsTrendDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Opened = recentClaims.Count(c => c.IncidentDate.Date == date),
                Resolved = recentClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.Approved || c.Status == Insurance.Domain.Enums.ClaimStatus.Rejected && c.IncidentDate.Date == date),
                AvgResolutionDays = 5.5 // mock for now
            }).ToList();

            // 6. Policies by Product
            var productGroups = policies.GroupBy(p => p.Application?.PolicyProduct?.Name ?? "Unknown");
            var totalPolicies = policies.Count();
            
            result.PoliciesByProduct = productGroups.Select(g => new Insurance.Application.DTOs.Dashboard.ProductShareDto
            {
                ProductName = g.Key,
                Count = g.Count(),
                Percentage = totalPolicies > 0 ? Math.Round((double)g.Count() / totalPolicies * 100, 1) : 0
            }).ToList();

            return Ok(result);
        }

        [HttpGet("agent/stats")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentStats()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            
            if (agent == null)
                return BadRequest("Agent profile not found.");

            var assignedApplications = await _applicationRepository.GetByAgentIdAsync(agent.Id);
            var pendingReview = assignedApplications.Count(a => a.Status == ApplicationStatus.Assigned);
            var approved = assignedApplications.Count(a => a.Status == ApplicationStatus.Approved);

            return Ok(new
            {
                TotalAssigned = assignedApplications.Count(),
                PendingReview = pendingReview,
                Approved = approved
            });
        }

        [HttpGet("officer/stats")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> GetOfficerStats()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var officer = await _officerRepository.GetByUserIdAsync(userId);
            
            if (officer == null)
                return BadRequest("Claims officer profile not found.");

            var assignedClaims = await _claimsRepository.GetByClaimsOfficerIdAsync(officer.Id);
            var underReview = assignedClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.UnderReview);
            var approved = assignedClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.Approved);
            var rejected = assignedClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.Rejected);

            return Ok(new
            {
                TotalAssigned = assignedClaims.Count(),
                UnderReview = underReview,
                Approved = approved,
                Rejected = rejected
            });
        }

        // --- CUSTOMER DASHBOARD CHARTS ---

        [HttpGet("customer/{id}/payments/history")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCustomerPaymentsHistory(int id, [FromQuery] int months = 12)
        {
            // Verify access (basic check)
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var customer = await _customerRepository.GetByUserIdAsync(int.Parse(currentUserId ?? "0"));
            if (customer == null || customer.Id != id) return Forbid();

            var cutoff = DateTime.UtcNow.AddMonths(-months);
            var payments = await _paymentRepository.GetByCustomerIdAsync(id);
            var recentPayments = payments.Where(p => p.PaymentDate >= cutoff && p.Status == PaymentStatus.Successful).ToList();

            var result = new Insurance.Application.DTOs.Dashboard.PaymentsHistoryDto();
            
            // Group by month
            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = DateTime.UtcNow.AddMonths(-i);
                var label = monthDate.ToString("yyyy-MM");
                result.Labels.Add(label);
                
                var sum = recentPayments
                    .Where(p => p.PaymentDate.Year == monthDate.Year && p.PaymentDate.Month == monthDate.Month)
                    .Sum(p => p.Amount);
                result.Amounts.Add(sum);
            }

            return Ok(result);
        }

        [HttpGet("customer/{id}/coverage/summary")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCustomerCoverageSummary(int id)
        {
            var customer = await _customerRepository.GetByUserIdAsync(int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0"));
            if (customer == null || customer.Id != id) return Forbid();

            var policies = await _policyRepository.GetByCustomerIdAsync(id);
            var activePolicies = policies.Where(p => p.Status == PolicyStatus.Active).ToList();

            decimal limit = activePolicies.Sum(p => p.CoverageAmount + p.TotalClaimedAmount); // Base original limit
            decimal used = activePolicies.Sum(p => p.TotalClaimedAmount);
            decimal remaining = activePolicies.Sum(p => p.CoverageAmount);

            return Ok(new Insurance.Application.DTOs.Dashboard.CoverageSummaryDto
            {
                Limit = limit,
                Used = used,
                Remaining = remaining
            });
        }

        [HttpGet("customer/{id}/claims/summary")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCustomerClaimsSummary(int id, [FromQuery] int months = 12)
        {
            var customer = await _customerRepository.GetByUserIdAsync(int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0"));
            if (customer == null || customer.Id != id) return Forbid();

            var cutoff = DateTime.UtcNow.AddMonths(-months);
            var claims = await _claimsRepository.GetByCustomerIdAsync(id);
            var recentClaims = claims.Where(c => c.IncidentDate >= cutoff).ToList();

            var result = new Insurance.Application.DTOs.Dashboard.ClaimsSummaryDto();
            var statuses = new[] { "Pending", "UnderReview", "Approved", "Rejected", "Settled" };

            // Init datasets
            foreach (var status in statuses)
            {
                result.Datasets.Add(new Insurance.Application.DTOs.Dashboard.ClaimStatusDatasetDto { Status = status });
            }

            // Fill data
            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = DateTime.UtcNow.AddMonths(-i);
                result.Labels.Add(monthDate.ToString("yyyy-MM"));

                foreach (var dataset in result.Datasets)
                {
                    Enum.TryParse(dataset.Status, out Insurance.Domain.Enums.ClaimStatus enumStatus);
                    var matchedClaims = recentClaims.Where(c => c.IncidentDate.Year == monthDate.Year 
                        && c.IncidentDate.Month == monthDate.Month
                        && c.Status == enumStatus).ToList();

                    dataset.Counts.Add(matchedClaims.Count());
                    dataset.Amounts.Add(matchedClaims.Sum(c => c.ClaimedAmount));
                }
            }

            return Ok(result);
        }

        [HttpGet("customer/{id}/policies/mix")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCustomerPolicyMix(int id)
        {
            var customer = await _customerRepository.GetByUserIdAsync(int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0"));
            if (customer == null || customer.Id != id) return Forbid();

            var policies = await _policyRepository.GetByCustomerIdAsync(id);
            var activePolicies = policies.Where(p => p.Status == PolicyStatus.Active).ToList();

            // Needs explicit includes mapped if running full EF, fallback to asset type for demonstration
            var groups = activePolicies.GroupBy(p => p.Application?.PolicyProduct?.Name ?? "General");

            var result = new Insurance.Application.DTOs.Dashboard.PolicyMixDto();
            foreach (var group in groups)
            {
                result.Labels.Add(group.Key);
                result.Values.Add(group.Count());
                result.Details.Add(new Insurance.Application.DTOs.Dashboard.PolicyMixDetailDto
                {
                    Type = group.Key,
                    Premium = group.Sum(p => p.PremiumAmount)
                });
            }

            return Ok(result);
        }

        [HttpGet("customer/{id}/policies/renewals")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCustomerRenewals(int id)
        {
            var customer = await _customerRepository.GetByUserIdAsync(int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0"));
            if (customer == null || customer.Id != id) return Forbid();

            var policies = await _policyRepository.GetByCustomerIdAsync(id);
            var activePolicies = policies.Where(p => p.Status == PolicyStatus.Active || p.Status == PolicyStatus.Expired).ToList();

            var result = activePolicies.Select(p => new Insurance.Application.DTOs.Dashboard.PolicyRenewalDto
            {
                PolicyId = p.Id,
                Name = p.Application?.PolicyProduct?.Name ?? "Policy #" + p.PolicyNumber,
                DaysToRenew = (int)(p.EndDate - DateTime.UtcNow).TotalDays,
                Premium = p.PremiumAmount
            })
            .OrderBy(r => r.DaysToRenew)
            .ToList();

            return Ok(result);
        }

        [HttpGet("customer/{id}/savings/trend")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCustomerSavingsTrend(int id, [FromQuery] int months = 12)
        {
            var customer = await _customerRepository.GetByUserIdAsync(int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0"));
            if (customer == null || customer.Id != id) return Forbid();

            // Mocked savings logic: representing loyalty discounts over time
            var result = new Insurance.Application.DTOs.Dashboard.SavingsTrendDto();
            result.TotalSavings = 1540.00m; // Example fixed total

            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = DateTime.UtcNow.AddMonths(-i);
                result.Labels.Add(monthDate.ToString("yyyy-MM"));
                result.Values.Add(100 + (i * 5)); // Arbitrary increasing savings trend
            }

            return Ok(result);
        }

        // --- AGENT DASHBOARD CHARTS ---

        [HttpGet("agent/{id}/performance")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentPerformance(int id, [FromQuery] int months = 12)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var cutoff = DateTime.UtcNow.AddMonths(-months);
            var applications = await _applicationRepository.GetByAgentIdAsync(id);
            var commissions = await _commissionRepository.GetByAgentIdAsync(id);
            var policies = await _policyRepository.GetByAgentIdAsync(id);

            var result = new Insurance.Application.DTOs.Dashboard.AgentPerformanceDto();

            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = DateTime.UtcNow.AddMonths(-i);
                var label = monthDate.ToString("yyyy-MM");
                result.Labels.Add(label);

                // Premiums from approved applications/policies in that month
                var monthlyPremiums = policies
                    .Where(p => p.CreatedAt.Year == monthDate.Year && p.CreatedAt.Month == monthDate.Month)
                    .Sum(p => p.PremiumAmount);
                result.Premiums.Add(monthlyPremiums);

                // Policies Issued
                var monthlyPolicies = policies
                    .Count(p => p.CreatedAt.Year == monthDate.Year && p.CreatedAt.Month == monthDate.Month && p.Status == PolicyStatus.Active);
                result.PoliciesIssued.Add(monthlyPolicies);

                // Commission earned
                var monthlyCommission = commissions
                    .Where(c => c.CreatedAt.Year == monthDate.Year && c.CreatedAt.Month == monthDate.Month)
                    .Sum(c => c.Amount);
                result.Commission.Add(monthlyCommission);
            }

            return Ok(result);
        }

        [HttpGet("agent/{id}/commission/breakdown")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentCommissionBreakdown(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var commissions = await _commissionRepository.GetByAgentIdAsync(id);
            
            // Group by policy product name
            var groups = commissions
                .GroupBy(c => c.Policy?.Application?.PolicyProduct?.Name ?? "General");

            var result = new Insurance.Application.DTOs.Dashboard.AgentCommissionBreakdownDto();
            result.TotalCommission = commissions.Sum(c => c.Amount);
            
            var now = DateTime.UtcNow;
            var mtdComm = commissions.Where(c => c.CreatedAt.Month == now.Month && c.CreatedAt.Year == now.Year).Sum(c => c.Amount);
            var lastMonth = now.AddMonths(-1);
            var lastMonthComm = commissions.Where(c => c.CreatedAt.Month == lastMonth.Month && c.CreatedAt.Year == lastMonth.Year).Sum(c => c.Amount);
            result.MtdDelta = lastMonthComm > 0 ? ((mtdComm - lastMonthComm) / lastMonthComm) * 100 : 0;

            foreach (var group in groups)
            {
                result.Labels.Add(group.Key);
                var amount = group.Sum(c => c.Amount);
                result.Values.Add(amount);
                result.Percentages.Add((double)Math.Round(result.TotalCommission > 0 ? (amount / result.TotalCommission) * 100 : 0, 1));
            }

            return Ok(result);
        }

        [HttpGet("agent/{id}/tasks/summary")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentTasksSummary(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var apps = await _applicationRepository.GetByAgentIdAsync(id);
            var pendingApps = apps.Where(a => a.Status != ApplicationStatus.Approved && a.Status != ApplicationStatus.Rejected).ToList();

            var result = new Insurance.Application.DTOs.Dashboard.AgentTaskSummaryDto();
            result.Labels = new List<string> { "Pending Documents", "Approve Requests", "Follow-ups" };
            
            // Mocking different slices for demonstration as we don't have separate Task entity
            // Urgent: > 7 days old
            // DueSoon: 3-7 days old
            // OnTrack: < 3 days old
            
            var cutoffUrgent = DateTime.UtcNow.AddDays(-7);
            var cutoffSoon = DateTime.UtcNow.AddDays(-3);

            // Pending Docs (Mock using applications where doc is missing or requires review)
            var docApps = pendingApps.Where(a => a.DocumentId == null).ToList();
            result.Urgent.Add(docApps.Count(a => a.CreatedAt < cutoffUrgent));
            result.DueSoon.Add(docApps.Count(a => a.CreatedAt >= cutoffUrgent && a.CreatedAt < cutoffSoon));
            result.OnTrack.Add(docApps.Count(a => a.CreatedAt >= cutoffSoon));

            // Approve Requests
            var approveApps = pendingApps.Where(a => a.Status == ApplicationStatus.Assigned).ToList();
            result.Urgent.Add(approveApps.Count(a => a.CreatedAt < cutoffUrgent));
            result.DueSoon.Add(approveApps.Count(a => a.CreatedAt >= cutoffUrgent && a.CreatedAt < cutoffSoon));
            result.OnTrack.Add(approveApps.Count(a => a.CreatedAt >= cutoffSoon));

            // Follow-ups (Mock using other pending)
            var followApps = pendingApps.Where(a => a.Status == ApplicationStatus.Pending).ToList();
            result.Urgent.Add(followApps.Count(a => a.CreatedAt < cutoffUrgent));
            result.DueSoon.Add(followApps.Count(a => a.CreatedAt >= cutoffUrgent && a.CreatedAt < cutoffSoon));
            result.OnTrack.Add(followApps.Count(a => a.CreatedAt >= cutoffSoon));

            return Ok(result);
        }

        [HttpGet("agent/{id}/claims/summary")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentClaimsSummary(int id, [FromQuery] int months = 12)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var claims = await _claimsRepository.GetByAgentIdAsync(id);
            var result = new Insurance.Application.DTOs.Dashboard.AgentClaimsSummaryDto();
            
            var statuses = new[] { "Filed", "Processed", "Rejected" };
            foreach (var status in statuses)
            {
                result.Datasets.Add(new Insurance.Application.DTOs.Dashboard.AgentClaimStatusDatasetDto { Status = status });
            }

            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = DateTime.UtcNow.AddMonths(-i);
                result.Labels.Add(monthDate.ToString("yyyy-MM"));
                
                // Mocking average processing days
                result.AvgProcessingDays.Add(Math.Round(3.0 + (new Random().NextDouble() * 2), 1));

                foreach (var dataset in result.Datasets)
                {
                    // Map "Filed" to Submitted, "Processed" to Approved/Settled
                    int count = 0;
                    decimal amount = 0;
                    
                    if (dataset.Status == "Filed")
                    {
                        var matches = claims.Where(c => c.IncidentDate.Month == monthDate.Month && c.IncidentDate.Year == monthDate.Year && c.Status == ClaimStatus.Submitted).ToList();
                        count = matches.Count;
                        amount = matches.Sum(m => m.ClaimedAmount);
                    }
                    else if (dataset.Status == "Processed")
                    {
                        var matches = claims.Where(c => c.IncidentDate.Month == monthDate.Month && c.IncidentDate.Year == monthDate.Year && (c.Status == ClaimStatus.Approved || c.Status == ClaimStatus.Settled)).ToList();
                        count = matches.Count;
                        amount = matches.Sum(m => m.ClaimedAmount);
                    }
                    else
                    {
                        var matches = claims.Where(c => c.IncidentDate.Month == monthDate.Month && c.IncidentDate.Year == monthDate.Year && c.Status == ClaimStatus.Rejected).ToList();
                        count = matches.Count;
                        amount = matches.Sum(m => m.ClaimedAmount);
                    }
                    
                    dataset.Counts.Add(count);
                    dataset.Amounts.Add(amount);
                }
            }

            return Ok(result);
        }

        [HttpGet("agent/{id}/funnel")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentFunnel(int id, [FromQuery] string range = "30d")
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var apps = await _applicationRepository.GetByAgentIdAsync(id);
            // Mocking funnel stages using ApplicationStatus
            // Leads (All), Quotes (Not Pending), Proposals (Assigned/Reviewing), Issued (Approved)
            
            var result = new Insurance.Application.DTOs.Dashboard.AgentFunnelDto();
            result.Steps = new List<string> { "Leads", "Quotes", "Proposals", "Issued" };
            
            result.Values.Add(apps.Count()); // All leads
            result.Values.Add(apps.Count(a => a.Status != ApplicationStatus.Pending)); // Quotes
            result.Values.Add(apps.Count(a => a.Status == ApplicationStatus.Assigned || a.Status == ApplicationStatus.Approved)); // Proposals
            result.Values.Add(apps.Count(a => a.Status == ApplicationStatus.Approved)); // Issued

            return Ok(result);
        }

        [HttpGet("agent/{id}/top/customers")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentTopCustomers(int id, [FromQuery] int limit = 10)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var policies = await _policyRepository.GetByAgentIdAsync(id);
            var topCustomers = policies
                .GroupBy(p => new { p.CustomerId, p.Customer.User.FullName })
                .Select(g => new Insurance.Application.DTOs.Dashboard.TopCustomerDto
                {
                    CustomerId = g.Key.CustomerId,
                    Name = g.Key.FullName,
                    Premium = g.Sum(p => p.PremiumAmount)
                })
                .OrderByDescending(c => c.Premium)
                .Take(limit)
                .ToList();

            return Ok(topCustomers);
        }

        [HttpGet("agent/{id}/portfolio/risk")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentPortfolioRisk(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            var policies = await _policyRepository.GetByAgentIdAsync(id);
            var result = policies.Select(p => new Insurance.Application.DTOs.Dashboard.PolicyRiskBubbleDto
            {
                PolicyId = p.Id,
                Name = p.Application?.PolicyProduct?.Name ?? "Motor - ABC",
                Premium = p.PremiumAmount,
                RiskScore = (double)(p.Application?.RiskScore ?? 50) / 100.0,
                Exposure = p.CoverageAmount
            }).ToList();

            return Ok(result);
        }

        [HttpGet("agent/{id}/branches/performance")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentBranchesPerformance(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null || agent.Id != id) return Forbid();

            // Agents are tied to one branch usually, but for manager view or multi-branch agents:
            var result = new Insurance.Application.DTOs.Dashboard.BranchPerformanceDto();
            result.Branches.Add(agent.Branch);
            
            var policies = await _policyRepository.GetByAgentIdAsync(id);
            result.Premiums.Add(policies.Sum(p => p.PremiumAmount));
            result.Policies.Add(policies.Count());
            
            // Add a mock comparison branch if only one
            if (result.Branches.Count == 1)
            {
                result.Branches.Add("Global Average");
                result.Premiums.Add(150000);
                result.Policies.Add(120);
            }

            return Ok(result);
        }
    }
}
