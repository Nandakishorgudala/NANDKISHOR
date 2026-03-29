namespace Application.DTOs.Chat
{
    public class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty; // "user" or "assistant"
        public string Content { get; set; } = string.Empty;
    }

    public class ChatRequestDto
    {
        public System.Collections.Generic.List<ChatMessageDto> Messages { get; set; } = new System.Collections.Generic.List<ChatMessageDto>();
    }

    public class ChatResponseDto
    {
        public string Response { get; set; } = string.Empty;
    }
}
