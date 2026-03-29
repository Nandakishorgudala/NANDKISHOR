namespace Application.DTOs.Policy
{
    /// <summary>Returned after a successful document upload.</summary>
    public class DocumentUploadResultDto
    {
        public int DocumentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
    }

    /// <summary>Document metadata returned alongside an application.</summary>
    public class ApplicationDocumentDto
    {
        public int DocumentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
