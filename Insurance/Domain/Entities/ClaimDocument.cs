using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    public class ClaimDocument : BaseEntity
    {
        public string FileName { get; private set; }
        public string ContentType { get; private set; }
        public string FilePath { get; private set; }
        public long FileSize { get; private set; }
        public DateTime UploadedAt { get; private set; }

        private ClaimDocument() { }

        public ClaimDocument(string fileName, string contentType, string filePath, long fileSize)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name is required.");
            if (string.IsNullOrWhiteSpace(contentType))
                throw new ArgumentException("Content type is required.");
            if (string.IsNullOrWhiteSpace(filePath))
                throw new ArgumentException("File path is required.");
            if (fileSize <= 0)
                throw new ArgumentException("File size must be greater than zero.");

            FileName = fileName;
            ContentType = contentType;
            FilePath = filePath;
            FileSize = fileSize;
            UploadedAt = DateTime.UtcNow;

            SetCreationTime();
        }
    }
}
