namespace CollegeApp.Server.Models
{
    public class Notification
    {
        public Guid id { get; set; }
        public string title { get; set; } = string.Empty; // anonymous message, or system message
        public string message { get; set; } = string.Empty; // the actual message
        public DateTime createdAt { get; set; } = DateTime.UtcNow;
        public bool isRead { get; set; } = false;
        public string type { get; set; } = string.Empty;
        public Guid? CommentId { get; set; } // notification might be about comment so we need to track the reference here
        public string? userId { get; set; } = string.Empty; // we want to know for which user is this comment sent to!

    }
}
