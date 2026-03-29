using Application.DTOs.Chat;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Application.Services
{
    public class ChatService : IChatService
    {
        private readonly string _apiKey;
        private readonly HttpClient _httpClient;
        private readonly string _systemPrompt = @"You are the ShieldSure AI Insurance Expert. 
Your goal is to provide accurate, helpful, and professional advice about insurance products only within the context of the ShieldSure project.

CRITICAL GUARDRAILS:
1. ONLY respond to queries related to insurance, the ShieldSure project, policies, claims, or account management within this app.
2. If a user asks a question UNRELATED to insurance or ShieldSure (e.g., general knowledge, jokes, coding, math, world news), politely decline and state that you are here specifically to assist with ShieldSure Insurance matters.
3. Do NOT provide general advice outside of the insurance domain.
4. Always maintain a professional, helpful tone.

Always use Indian Rupee (₹) for currency.
BE CONCISE and use CLEAN FORMATTING.
- Use **bold** for key terms and amounts.
- Use bullet points (*) for lists of benefits or rules.
- Use clear spacing between paragraphs.
- If you don't know an answer based on the provided knowledge, politely say so.

### ShieldSure Knowledge Base:
1. Core Products:
   - Wildfire Policy: Up to ₹5,00,000 coverage. Features: Natural fire coverage, smoke damage, evacuation support.
   - Earthquake Policy: Up to ₹10,00,000 coverage. Features: Seismic damage, structural assessment, temporary housing, priority claims.
   - Fire & Smoke Policy: Up to ₹7,50,000 coverage. Features: Residential/commercial fires, smoke inhalation, content replacement.
   - Floods Policy: Up to ₹2,00,000 coverage.
2. Ecosystem Covered: Home Owners, Businesses, Agriculture, and Infrastructure.
3. Enrollment & Claims:
   - User Registration: Users must be at least 18 years old to join.
   - Initial logic involves AI risk assessment based on property/location.
   - Claims processing is rapid (under 60 seconds to file).
   - Evidence requirement: Valid photos or documents proving damage. Allowed formats: PDF, JPEG, PNG (Max 10MB).
   - Approval Process: A human Claims Officer reviews uploads against the policy ledger before payout. All actions are recorded on a transparent, immutable ledger.";

        public ChatService(IConfiguration configuration)
        {
            _apiKey = configuration["GrokSettings:ApiKey"] ?? throw new ArgumentNullException("Grok API Key is missing in configuration.");
            _httpClient = new HttpClient();
            
            if (!string.IsNullOrEmpty(_apiKey) && _apiKey.Length > 8)
            {
                var start = _apiKey.Substring(0, 4);
                var end = _apiKey.Substring(_apiKey.Length - 4);
                Console.WriteLine($"[ChatService] Loaded Grok API Key: {start}...{end}");
            }
        }

        public async Task<ChatResponseDto> GetChatResponseAsync(List<ChatMessageDto> messages)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return new ChatResponseDto
                {
                    Response = "The Grok API Key is not configured correctly in the backend. Please add your API key to 'appsettings.json'."
                };
            }

            try
            {
                // Using Groq API endpoint (compatible with OpenAI format)
                var url = "https://api.groq.com/openai/v1/chat/completions";

                var grokMessages = new List<object>
                {
                    new { role = "system", content = _systemPrompt }
                };

                foreach (var msg in messages)
                {
                    grokMessages.Add(new { role = msg.Role == "user" ? "user" : "assistant", content = msg.Content });
                }

                var payload = new 
                { 
                    model = "llama-3.1-8b-instant",
                    messages = grokMessages.ToArray(),
                    stream = false
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(payload);

                var response = await _httpClient.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[ChatService Error]: xAI API returned {response.StatusCode}. Body: {errorBody}");
                    return new ChatResponseDto { Response = "I'm sorry, I am having trouble connecting to my brain right now." };
                }

                var jsonResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
                var responseText = jsonResponse
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return new ChatResponseDto
                {
                    Response = responseText ?? "I'm sorry, I couldn't generate a response at this time."
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatService Exception]: {ex.Message}");
                return new ChatResponseDto
                {
                    Response = "An error occurred while connecting to the AI assistant."
                };
            }
        }
        public async IAsyncEnumerable<string> GetChatResponseStreamAsync(List<ChatMessageDto> messages)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                yield return "Error: API Key missing.";
                yield break;
            }

            // Using Groq API endpoint (compatible with OpenAI format)
            var url = "https://api.groq.com/openai/v1/chat/completions";

            var grokMessages = new List<object>
            {
                new { role = "system", content = _systemPrompt }
            };

            foreach (var msg in messages)
            {
                grokMessages.Add(new { role = msg.Role == "user" ? "user" : "assistant", content = msg.Content });
            }

            var payload = new 
            { 
                model = "llama-3.1-8b-instant",
                messages = grokMessages.ToArray(),
                stream = true
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(payload);

            var sw = System.Diagnostics.Stopwatch.StartNew();
            var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
            Console.WriteLine($"[ChatService] Response headers received in {sw.ElapsedMilliseconds}ms");
            
            if (!response.IsSuccessStatusCode)
            {
                yield return "I'm sorry, I am having trouble connecting to my brain right now.";
                yield break;
            }

            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new System.IO.StreamReader(stream);
            int chunkCount = 0;

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (line == "data: [DONE]") 
                {
                    Console.WriteLine($"[ChatService] Stream completed. Total chunks: {chunkCount}. Total time: {sw.ElapsedMilliseconds}ms");
                    break;
                }

                if (line.StartsWith("data: "))
                {
                    var data = line.Substring(6);
                    string? textToYield = null;
                    try 
                    {
                        var json = JsonDocument.Parse(data);
                        var delta = json.RootElement
                            .GetProperty("choices")[0]
                            .GetProperty("delta");

                        if (delta.TryGetProperty("content", out var content))
                        {
                            chunkCount++;
                            textToYield = content.GetString() ?? "";
                            if (chunkCount == 1) Console.WriteLine($"[ChatService] First chunk received in {sw.ElapsedMilliseconds}ms");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[ChatService] JSON Parse Error: {ex.Message} on line: {line}");
                    }

                    if (textToYield != null)
                    {
                        yield return textToYield;
                    }
                }
            }
        }
    }
}
