using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CollegeApp.Server.Models
{
    public class Comments
    {
        public Guid Id { get; set; }

        [Required]
        [MaxLength(2000)] 
        public string comments { get; set; } = string.Empty;
        public int likes { get; set; } = 0;
        public DateTime Added { get; set; } = DateTime.UtcNow;
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
        public string UserId { get; set; } = string.Empty; // UserId of the user who made the comment from auth0
        public Guid? ConfessionId { get; set; } // required foregin key property according to microsoft
        [JsonIgnore] // why well because,
        /* It's like pointing each other for mistake, so it throws error Just for the database to apply cascade behaviour we do that.
         * for navigation from parent confession we figure it out */
        public Confession? Confessions { get; set; } // required navigational property

        /* Now we are going to use something called self referencing */
        public ICollection<Comments> Replies { get; set; } = new List<Comments>(); // for self referencing, so that we can have reply to comments

        [JsonIgnore]
        public Comments? Parent { get; set; } // parent comment
        public Guid? ParentId { get; set; } // foregin key for parent comment
        [MaxLength(20)]
        public string profileColor { get; set; } = string.Empty;
        public Guid AnonymousName { get; set; } = Guid.Empty;
        public bool deleted { get; set; } = false;
        [JsonIgnore]
        public int depth { get; set; } // this we will keep track in the backend
    }
}

// https://learn.microsoft.com/en-us/ef/core/modeling/relationships/one-to-many

/*
 Learned this using two different ways, first used AI, it couldn't figure out
second read the docs got the answer.

 */