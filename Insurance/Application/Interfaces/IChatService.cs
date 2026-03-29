using Application.DTOs.Chat;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Application.Interfaces
{
    public interface IChatService
    {
        Task<ChatResponseDto> GetChatResponseAsync(List<ChatMessageDto> messages);
        IAsyncEnumerable<string> GetChatResponseStreamAsync(List<ChatMessageDto> messages);
    }
}
