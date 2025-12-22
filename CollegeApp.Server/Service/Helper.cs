using CollegeApp.Server.Controllers;
using CollegeApp.Server.Models;

namespace CollegeApp.Server.Service
{

    public struct NameAndProfileColor
    {
        public Guid CommonName;
        public string ProfileColor;

        public NameAndProfileColor(Guid commonName, string profileColor)
        {
            CommonName = commonName;
            ProfileColor = profileColor;
        }
    }
    public class Helper
    {
        Random random = new Random();
        public string RandomRGB()
        {
            int r = random.Next(256); // 0–255
            int g = random.Next(256);
            int b = random.Next(256);

            return $"rgb({r}, {g}, {b})";
        }

        public PaginationResult<T> NormalPagination<T>(int pageSize, int page, IQueryable<T> dbo)// this is for the normal pagination that takes place 
        {
            try
            {
                var totalObjects = dbo.Count();
                var takeSkip = dbo.Skip((page - 1) * pageSize).Take(pageSize).ToList();
                int totalPages = (int)Math.Ceiling(totalObjects / (double)pageSize);
                return new PaginationResult<T> { totalPages = totalPages, data = takeSkip, totalObjects = totalObjects };
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
        
        // We want to re-user this, assigning random RGB value and common name here
        public NameAndProfileColor CommonNameAndProfile(Comments? previousUserComment)
        {

            Guid commonName;
            string profileColor;
            if (!(previousUserComment == null))
            {
                commonName = previousUserComment.AnonymousName;
                profileColor = previousUserComment.profileColor;
            }
            else
            {
                // if it's not null then assign new name
                commonName = Guid.NewGuid();
                profileColor = RandomRGB();
            }
            return new NameAndProfileColor(commonName, profileColor);
        }


        /* Want to hide the confession that are deleted by the Admin user due to some report.
         * Now what we can do is write this method in many form cause we have a methods for
         lazy loading, loading in bulk. We do not need to worry cause we are using pagination and it should be fine.*/
        public IQueryable<Confession> hideDeletedConfession(IQueryable<Confession> confessionList)
        {
            if (confessionList == null)
            {
                throw new Exception("Confession list is null");
            }

            foreach (var i in confessionList)
            {
                if (i.deleted)
                {
                    i.Description = "This confession has been deleted by the admin. Due to reports!";
                }
            }
            return confessionList;
        }

        public Comments hideDeletedComment(Comments comment)
        {
            if (comment == null)
            {
                throw new Exception("Comment is null");
            }
            if (comment.deleted)
            {
                comment.comments = "This comment has been deleted by the admin. Due to reports!";
            }
            return comment;
        }

        public Confession hideDeletedConfession(Confession confession)
        {
            if (confession == null)
            {
                throw new Exception("Confession is null");
            }
            if (confession.deleted)
            {
                confession.Description = "This confession has been deleted by the admin. Due to reports!";
            }
            return confession;
        }

        public List<CommentWithReplyCount> hideDeletedConfession(List<CommentWithReplyCount> commentsList)
        {
            if (commentsList == null)
            {
                throw new Exception("Comments list is null");
            }
            foreach (var i in commentsList)
            {
                if (i.deleted)
                {
                    i.comments = "This comment has been deleted by the admin. Due to reports!";
                }
            }
            return commentsList;
        }
        public IQueryable<Comments> hideDeletedConfession(IQueryable<Comments> commentsList)
        {
            if (commentsList == null)
            {
                throw new Exception("Comments list is null");
            }
            foreach (var i in commentsList)
            {
                if (i.deleted)
                {
                    i.comments = "This comment has been deleted by the admin. Due to reports!";
                }
            }
            return commentsList;
        }
    }

    public class T
    {
    }
}
