using Application.DTOs.Verification;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Application.Interfaces;
using Insurance.Domain.Enums;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Net.Http.Json;
using UglyToad.PdfPig;

namespace Application.Services
{
    public class VerificationService : IVerificationService
    {
        private readonly IPolicyApplicationRepository _policyApplicationRepository;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public VerificationService(
            IPolicyApplicationRepository policyApplicationRepository, 
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _policyApplicationRepository = policyApplicationRepository;
            _configuration = configuration;
            _httpClient = httpClient;
            _apiKey = _configuration["VerificationSettings:ApiKey"] ?? "";
        }

        public async Task<VerificationResultDto> VerifyApplicationAsync(int applicationId, int agentId)
        {
            var application = await _policyApplicationRepository.GetByIdWithDetailsAsync(applicationId);

            if (application == null) throw new KeyNotFoundException("Application not found.");
            if (application.Document == null) throw new InvalidOperationException("No identity document found for this application.");

            // 1. Extract Text from PDF
            string extractedText = "";
            var storagePath = _configuration["FileUploadSettings:StoragePath"] ?? "uploads/documents";
            var absolutePath = Path.Combine(Directory.GetCurrentDirectory(), storagePath, application.Document.StoredFileName);

            if (File.Exists(absolutePath) && application.Document.ContentType == "application/pdf")
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
                catch (Exception ex)
                {
                    extractedText = "Error extracting text: " + ex.Message;
                }
            }

            // 2. Perform Match Scoring
            var customer = application.Customer;
            var fullName = customer.User.FullName;
            var address = $"{customer.Address}, {customer.City}";
            var age = customer.Age;

            double nameScore = CalculateFuzzyMatch(fullName, extractedText);
            double addressScore = CalculateFuzzyMatch(address, extractedText);
            double ageScore = extractedText.Contains(age.ToString()) ? 100 : 0;
            
            double averageScore = (nameScore + addressScore + ageScore) / 3;

            // 3. Risk Calculation
            int existingPolicies = customer.Policies.Count(p => p.Status == PolicyStatus.Active);
            // High policy count (> 3) adds risk. Matching failure adds risk.
            double riskScore = 0;
            if (averageScore < 60) riskScore += 40;
            if (existingPolicies > 2) riskScore += 20;
            if (existingPolicies > 5) riskScore += 30;
            riskScore = Math.Min(100, riskScore);

            var result = new VerificationResultDto
            {
                ApplicationId = applicationId,
                ExtractedText = extractedText.Length > 1000 ? extractedText.Substring(0, 1000) + "..." : extractedText,
                NameMatchScore = Math.Round(nameScore, 1),
                AddressMatchScore = Math.Round(addressScore, 1),
                AgeMatchScore = ageScore,
                AverageMatchScore = Math.Round(averageScore, 1),
                ExtractedName = FindInText(fullName, extractedText),
                ExtractedAddress = FindInText(customer.City, extractedText),
                ExtractedAge = extractedText.Contains(age.ToString()) ? age : null,
                ExistingPoliciesCount = existingPolicies,
                RiskScore = riskScore,
                RiskAssessment = riskScore > 70 ? "High" : (riskScore > 30 ? "Medium" : "Low")
            };

            // 4. AI Recommendation via Groq
            if (!string.IsNullOrEmpty(_apiKey) && !string.IsNullOrWhiteSpace(extractedText))
            {
                try
                {
                    await GetAiRecommendation(result, application, extractedText);
                }
                catch
                {
                    result.Recommendation = averageScore > 70 ? "Approve" : "Manual Review Required";
                    result.Reasoning = "AI component unavailable. Rule-based recommendation provided.";
                }
            }
            else
            {
                result.Recommendation = averageScore > 70 ? "Approve" : "Manual Review Required";
                result.Reasoning = "AI key missing or text empty. Rule-based recommendation provided.";
            }

            return result;
        }

        private double CalculateFuzzyMatch(string target, string source)
        {
            if (string.IsNullOrEmpty(target) || string.IsNullOrEmpty(source)) return 0;
            target = target.ToLower().Trim();
            source = source.ToLower();

            if (source.Contains(target)) return 100;

            // Simple word-by-word overlap for name/address
            var targetWords = target.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            int matches = targetWords.Count(w => source.Contains(w));
            
            return (double)matches / targetWords.Length * 100;
        }

        private string FindInText(string hint, string text)
        {
            // Simple helper to "highlight" what we found
            if (string.IsNullOrEmpty(hint) || string.IsNullOrEmpty(text)) return "Not clearly visible";
            return text.ToLower().Contains(hint.ToLower().Split(' ')[0]) ? $"Likely matches '{hint}'" : "Not found";
        }

        private async Task GetAiRecommendation(VerificationResultDto result, PolicyApplication app, string extractedText)
        {
            var url = "https://api.groq.com/openai/v1/chat/completions";
            var prompt = $@"
Analyze the following insurance application verification data for ShieldSure:

CUSTOMER DATA TO MATCH:
- Name: {app.Customer.User.FullName}
- Age: {app.Customer.Age}
- Address: {app.Customer.Address}, {app.Customer.City}

EXTRACTED TEXT FROM IDENTITY DOCUMENT (RAW OCR OUTPUT):
---
{extractedText}
---

TASK:
1. Match Applicant Name: Find the applicant's name in the text. CRITICAL: Ignore labels and values for 'Father's Name', 'Mother's Name', or 'Spouse Name'. Focus only on the primary name and English characters.
2. Match Age/DOB: Extract any Date of Birth (DOB) found. Reconcile it with the provided age ({app.Customer.Age}).
3. Match Address: Check if the provided address exists in the document.
4. Risk Check: With {result.ExistingPoliciesCount} active policies, is this a normal profile?

RESPOND STRICTLY IN JSON FORMAT:
{{ 
  ""name_score"": 0-100, 
  ""address_score"": 0-100, 
  ""age_score"": 0-100, 
  ""extracted_dob"": ""YYYY-MM-DD or Not Found"",
  ""recommendation"": ""Approve/Reject/Manual Review"", 
  ""reasoning"": ""Professional explanation of matching and risk findings."" 
}}
";

            var payload = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[] { new { role = "user", content = prompt } },
                response_format = new { type = "json_object" }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(payload);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                result.Recommendation = "Manual Review";
                result.Reasoning = "AI Recommendation Service unreachable.";
                return;
            }

            var content = await response.Content.ReadAsStringAsync();
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            var aiText = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiText);
            
            result.NameMatchScore = parsed.GetProperty("name_score").GetDouble();
            result.AddressMatchScore = parsed.GetProperty("address_score").GetDouble();
            result.AgeMatchScore = parsed.GetProperty("age_score").GetDouble();
            result.AverageMatchScore = Math.Round((result.NameMatchScore + result.AddressMatchScore + result.AgeMatchScore) / 3, 1);
            
            result.ExtractedDOB = parsed.GetProperty("extracted_dob").GetString();
            result.Recommendation = parsed.GetProperty("recommendation").GetString();
            result.Reasoning = parsed.GetProperty("reasoning").GetString();

            // Refine risk assessment based on AI scores
            if (result.AverageMatchScore < 50) result.RiskAssessment = "High";
        }
    }
}
