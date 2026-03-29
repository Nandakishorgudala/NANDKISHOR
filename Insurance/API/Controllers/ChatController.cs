using Application.DTOs.Chat;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace API.Controllers
{
    [AllowAnonymous] // Allow unauthenticated users on the landing page to use the chatbot
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost("stream")]
        public async Task GetResponseStream([FromBody] ChatRequestDto dto)
        {
            if (dto.Messages == null || dto.Messages.Count == 0)
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("Messages cannot be empty.");
                return;
            }

            Response.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            Response.Headers.Connection = "keep-alive";

            await foreach (var chunk in _chatService.GetChatResponseStreamAsync(dto.Messages))
            {
                await Response.WriteAsync($"data: {chunk}\n\n");
                await Response.Body.FlushAsync();
            }
        }
    }
}
