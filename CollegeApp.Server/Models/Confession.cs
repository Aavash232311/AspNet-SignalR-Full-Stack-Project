using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CollegeApp.Server.Models
{
    public class Confession
    {
        public Guid Id { get; set; }
        [MaxLength(50)]
        [Required]
        public string Topic { get; set; } = string.Empty;
        [MaxLength(2500)]
        [Required]
        public string Description { get; set; } = string.Empty;
        [MaxLength(100)]
        [JsonIgnore] // Don't send this to the client, haha even tough its public in jwt why send it 
        public string? UserId { get; set; } = string.Empty; // autho user id 
        public DateTime Added { get; set; } = DateTime.UtcNow;
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
        public ICollection<Comments> Comments { get; set; } = new List<Comments>(); // one confession can have many comments, so we can use list here
        /* Rest of the related model like, likes and comments we can keep in different database model */
        public bool deleted { get; set; } = false;
    }
}
// https://learn.microsoft.com/en-us/ef/core/modeling/relationships/one-to-many