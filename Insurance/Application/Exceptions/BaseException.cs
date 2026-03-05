using System;

namespace Insurance.Application.Exceptions
{
    public abstract class BaseException : Exception
    {
        public int StatusCode { get; }

        protected BaseException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class NotFoundException : BaseException
    {
        public NotFoundException(string message) : base(message, 404) { }
    }

    public class BadRequestException : BaseException
    {
        public BadRequestException(string message) : base(message, 400) { }
    }

    public class UnauthorizedException : BaseException
    {
        public UnauthorizedException(string message) : base(message, 401) { }
    }

    public class ForbiddenException : BaseException
    {
        public ForbiddenException(string message) : base(message, 403) { }
    }

    public class ConflictException : BaseException
    {
        public ConflictException(string message) : base(message, 409) { }
    }

    public class ValidationException : BaseException
    {
        public ValidationException(string message) : base(message, 422) { }
    }
}
