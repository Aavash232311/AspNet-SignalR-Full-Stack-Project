using CollegeApp.Server.Data;
using CollegeApp.Server.Models;
using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using System.ComponentModel.DataAnnotations;

namespace CollegeApp.Server.Controllers
{
    public class CommentProfiles : Profile
    {
        public CommentProfiles() // when we use Select() in asp.net then it's hard to select everything so we are using a mapper 
        {
            CreateMap<Comments, CommentWithReplyCount>()
                .ForMember(dest => dest.ReplyCount,
                    opt => opt.MapFrom(src => src.Replies.Count));
        }
    }

    public class ReportType : Report
    {
        [Required]
        [MaxLength(100)]
        public string type { get; set; } = string.Empty;
    }

    public class CommentWithReplyCount: Comments
    {
        public int ReplyCount { get; set; } = 0;
        public List<Comments> Replies { get; set; } = new List<Comments>(); // Because we have lazy loading on the client side
    }
    [Route("[controller]")]
    [ApiController]
    public class ConfessionController : ControllerBase
    {
        public ApplicationDbContext _context;
        public Auth0 _userManager;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IHubContext<NotificationHub> _pushNotification;
        public Helper helper;
        private readonly IMapper _mapper;
        public ConfessionController(ApplicationDbContext context, Auth0 _userManager, IHubContext<ChatHub> _hubContext, IHubContext<NotificationHub> pushNotification ,Helper helper, IMapper mapper)
        {
            this._context = context;
            this._userManager = _userManager;   
            this._hubContext = _hubContext;
            this.helper = helper;
            _mapper = mapper; 
            this._pushNotification = pushNotification;
        }

        [Route("AddConfession")]
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddConfession(Confession confession)
        {
            if (confession == null) {
                return new JsonResult(BadRequest(new { errorString = "Confession cannot be null" }));
            }
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Confession newConfession = new Confession
            {
                Topic = confession.Topic,
                Description = confession.Description,
                UserId = userId,
            };
            _context.Confessions.Add(newConfession);
            await _context.SaveChangesAsync();
            return new JsonResult(Ok(userId));
        }

        [Route("EditConfession")]
        [HttpPut]
        [Authorize]
        public async Task<IActionResult> EditConfession(Guid editUserId, Confession newConfession)
        {
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // although the thing is obv, ofc the user need to authorize to get here but still
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));

            var confession = _context.Confessions.FirstOrDefault(x => x.Id == editUserId && x.UserId == userId); // can only confession which belong to them
            if (confession == null) return new JsonResult(NotFound(new { message = "Confession not found" }));

            confession.LastModified = DateTime.UtcNow;
            confession.Description = newConfession.Description;
            confession.Topic = newConfession.Topic;
            await _context.SaveChangesAsync();
            return new JsonResult(Ok());
        }

        [Route("YourConfession")]
        [HttpGet]
        [Authorize]
        public IActionResult GetConfessions([FromQuery, Range(1, int.MaxValue)] int page = 1)
        {
            int pageSize = 5;
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));
            var query = _context.Confessions.Where(x => x.UserId == userId);
            if (query.Any())
            {
                return new JsonResult(Ok(helper.NormalPagination(pageSize, page, query)));
            }
            return new JsonResult(NotFound());
        }

        [Route("GetCurrentConfession")]
        [HttpGet]
        public IActionResult GetCurrentConfession(Guid id)
        {
            var confession = _context.Confessions.FirstOrDefault(x => x.Id == id);
            if (confession == null) return new JsonResult(NotFound());
            return new JsonResult(Ok(helper.hideDeletedConfession(confession)));
        }

        [Route("DeleteConfession")]
        [Authorize]
        [HttpDelete]
        public async Task<IActionResult> DeleteConfessions(Guid id)
        {
            var obj = _context.Confessions.FirstOrDefault(x => x.Id == id); 
            if (obj == null) return new JsonResult(NotFound(new { message = "Confession not found", confessionId = id }));

            _context.Confessions.Remove(obj);
            await _context.SaveChangesAsync();  
            return new JsonResult(Ok());
        }

        // now what we want to do is, send a notification to whoever's the confession is about the notification. 



        /* This api is for adding top level comments, not replying to threads,
         * it's a direct reply to confession!! */
        [Route("AddComment")]
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddComments(string comments, Guid confessionId)
        {
            var getConfessions = _context.Confessions.FirstOrDefault(x => x.Id == confessionId);
            if (getConfessions == null) return new JsonResult(NotFound(new { message = "Confession not found" }));
            if (getConfessions.deleted)
            {
                // we will handle other problems in the front end, I have made the button disabled, if someone tries to manupulate the code in the client then server stops it anyway.
                return new JsonResult(BadRequest(new { message = "Cannot comment on deleted confession" }));
            }

             string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));

            /* Now we want the game profile color if the customer is same,
             * Here let's search in our database with the same user_id and same confession.
             * A user can have a different profile color for different confession,
             */

            // Since comment is in different table
            var previousUserComment = _context.Comments.FirstOrDefault(x => x.UserId == userId && x.ConfessionId == confessionId);

            NameAndProfileColor nameAndProfile = helper.CommonNameAndProfile(previousUserComment);

            // Not just the profile color, we want their label "Anonymous Id" to be the same as well



            // in comment for the default cascade behaviour to work
            // we need to specify foregin key


            Comments newComment = new Comments()
            {
                comments = comments,
                UserId = userId,
                ConfessionId = getConfessions.Id,
                Confessions = getConfessions,
                profileColor = nameAndProfile.ProfileColor,
                AnonymousName = nameAndProfile.CommonName
            };
            var parentComment = _context.Comments.Add(newComment);
            await _context.SaveChangesAsync();
            // this socket is sending message to a particular group
            await _hubContext.Clients.Group((confessionId).ToString()).SendAsync("ReceiveMessage", new {
                value = new List<Comments>() { newComment },
                parent = newComment,
                order = "top-level"
            });

            /* 
                We can sent push notification in two ways, first one is if someone has confessed and get got a reply from someone,
                And every reply and comments associated with that confession should get a notification.

                Other one is, if someone has commented on something, and someone replies to that particular comment, then only that user should get notification.
                
                We can work with one case at a time.
            */

            // okay in this notification the group name is going to be the user id, since notifcation is associated with particular user.
            Notification newPushNotification = new Notification()
            {
                title = $"New Comment on your Confession by anonymous user", // userId is the user who commented
                message = comments,
                type = "New comment",
                CommentId = newComment.Id,
                userId = getConfessions.UserId // the owner of the confession
            };

            _context.Notifications.Add(newPushNotification);


            await _context.SaveChangesAsync();

            await _pushNotification.Clients.User(getConfessions.UserId.ToString()).SendAsync("ReceiveNotification", newPushNotification);

            return new JsonResult(Ok(newComment));
        }

        /* If web socket load is success we are calling this API */
        [Route("GetComments")]
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetComments(Guid confessionId, [FromQuery, Range(1, int.MaxValue)] int page = 1)
        {
            var getConfessions = _context.Confessions.FirstOrDefault(x => x.Id == confessionId);
            if (getConfessions == null) return new JsonResult(NotFound(new { message = "Confession not found" }));
            var comments = _context.Comments.Where(b => b.Parent == null).OrderByDescending(d => d.Added);
            /* From the point of runtime complexity, okay if we load all at once then it's a nexted structure right,
             * then we might end up with lots of user driven data like high resolution image and stuff.
             We need to load only what's needed so that we can make this endpoint effective we need to explicitly call the fetch api from
            front-end for that.*/
            int pageSize = 5;

            var pagination = helper.NormalPagination(pageSize, page, helper.hideDeletedConfession(comments));

            // Here since pagination is used, the time complexity for iterating over time is not that much so we can do that
            return new JsonResult(Ok(pagination));
        }
        [Route("get-children-comments")]
        [HttpGet]
        public async Task<IActionResult> GetReplyComments(Guid parentId)
        {
            // this is replies, to one depth, we are using auto mapper here
            var getParentComments = _context.Comments.Where(x => x.ParentId == parentId).ProjectTo<CommentWithReplyCount>(_mapper.ConfigurationProvider).ToList();
            // here the comment might be deleted, so we need to account for that as well!

            
            return new JsonResult(Ok(helper.hideDeletedConfession(getParentComments))); // load everything for now, if we were to scale this application to very large then we could add pagination here to ex: by scrolling
        }

        [Route("ReplyComment")]
        [Authorize]
        [HttpPost]
        /* The way it's developed is you cannot reply to comment if they are deleted.
         * If the confession is deleted you can still reply to their comments. */
        public async Task<IActionResult> ReplyComment(string comment, Guid parentId, Guid confessionId)
        {
            var parentComment = _context.Comments.Include(r => r.Replies).FirstOrDefault(x => x.Id == parentId);

            if (parentComment == null) return new JsonResult(BadRequest(new {message = "No parent found."}));

            if (parentComment.deleted) return new JsonResult(BadRequest(new { message = "Cannot reply to deleted comment." }));

            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" })); // even though use is always authorize to get to this point, i get annoyed by that underline
            var getConfession = _context.Confessions.FirstOrDefault(x => x.Id == confessionId); // this is the confession in which reply is being sent to
            if (getConfession == null) return new JsonResult(NotFound(new { message = "Confession not found" }));

            // Since comment is in different table
            var previousUserComment = _context.Comments.FirstOrDefault(x => x.UserId == userId && x.ConfessionId == confessionId);

            NameAndProfileColor nameAndProfile = helper.CommonNameAndProfile(previousUserComment);


            Comments newComment = new Comments() // creating a reply comment
            {
                comments = comment,
                UserId = userId,
                Parent = parentComment, // referencing it with parent
                ParentId = parentComment.Id, // setting the parentId to the parent comment's Id, even though cascade delete logic wont work here,
                ConfessionId = parentComment.ConfessionId, // setting the confessionId to the parent comment's confessionId
                Confessions = getConfession, // setting the confession to the current confession,
                // a clever way to use cascade in this sort of like hierarchial structure is to pass in parent reference in the every child comment
                profileColor = nameAndProfile.ProfileColor, // setting the profile color to a random color,
                AnonymousName = nameAndProfile.CommonName // setting the anonymous name to a random guid
            };

            parentComment.Replies.Add(newComment); // adding the new comment to the parent comment's children list for easy navigation 
            var updatedParent = _context.Comments.Add(newComment); // adding that to the databse

            // sending the reply comment to the websocket
            await _hubContext.Clients.Group((confessionId).ToString()).SendAsync("ReceiveMessage", new { value = parentComment.Replies, parent = parentComment, order = "thread" });


            Notification newPushNotification = new Notification()
            {
                title = $"New Reply to your Comment by anonymous user",
                message = comment,
                type = "reply-comment",
                CommentId = newComment.Id,
                userId = parentComment.UserId // the owner of the parent comment
            };
            _context.Notifications.Add(newPushNotification);

            /* Now we might want to send a push notification to the confession owner on any associated reply.
             * If that is a first order comment then we might not want to do so cause there will be conflicting notification*/

            Notification NotificationConfOnwer = new Notification()
            {
                title = $"New Reply on Confession Comment by anonymous user",
                message = comment,
                type = "reply-confession-owner",
                CommentId = newComment.Id,
                userId = getConfession.UserId // the owner of the confession
            };

            _context.Notifications.Add(NotificationConfOnwer);

            // let's look at the edge case here,
            // what if the owner of comment is the owner of confession


            if (parentComment.UserId == getConfession.UserId)
            {
                // then we don't want to send double notification
                // so we can just skip sending notification to confession owner
                // and just remove the notification added for confession owner
                _context.Notifications.Remove(NotificationConfOnwer);
                await _pushNotification.Clients.User(parentComment.UserId.ToString()).SendAsync("ReceiveNotification", newPushNotification); // just one push notification! :)
            }
            else
            {
                // otherwise we can send notification to both parties
                await _pushNotification.Clients.User(getConfession.UserId.ToString()).SendAsync("ReceiveNotification", NotificationConfOnwer);
                await _pushNotification.Clients.User(parentComment.UserId.ToString()).SendAsync("ReceiveNotification", newPushNotification);
            }
            await _context.SaveChangesAsync(); // saving the changes


            /* Now even if someone replies to the comment, send a message to associate user
             * that someone has replied to their message, whoever the owner might be. */
            return new JsonResult(Ok());
        }

        [Route("getParticularComment")]
        [HttpGet]
        public IActionResult GetParticularComment(Guid commentId)
        {
            var comment = _context.Comments.Include(r => r.Replies).FirstOrDefault(i => i.Id == commentId);
            if (comment == null) return new JsonResult(NotFound(new { message = "Comment not found!" }));

            return new JsonResult(Ok(comment));
        }

        [Route("deleted-user-comment")]
        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> DeleteOwnUserComment(Guid commentId)
        {
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));

            // User can only delete comment associated with him, we will later look at the default database behaviour regarding this
            var getComment = _context.Comments.FirstOrDefault(x => x.Id == commentId && x.UserId == userId);
            if (getComment == null) return new JsonResult(NotFound(new { message = "Comment not found" }));
            _context.Comments.Remove(getComment);
            await _context.SaveChangesAsync();
            return new JsonResult(Ok());
        }

        // Report on comment/confession
        [Route("report")]
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Report(ReportType report)
        {
            // We always want to make sure the user is valid, even though it's authorize to get here, but we still user id
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));

            // there either one of `Confession` or `Comments` is required, cause a report might be for either one of them.
            // we need to check if either one is there

            if (report.Confession == null && report.Comments == null) // here null, because we don't want to send initial value as guid.empty from the client side
            {
                return new JsonResult(BadRequest(new
                {
                    errorCode = "No reference to the table",
                    entry = report
                }));
            }

            Confession associatedConfession = new Confession();
            Comments associatedComments = new Comments();

            // check if the confession or comments exist, and search them
            if (report.type == "confession") 
            {
                var getConfession = _context.Confessions.FirstOrDefault(x => x.Id == report.Confession);

                if (getConfession == null)
                {
                    return new JsonResult(NotFound(new
                    {
                        errorCode = "confession not found",
                        entry = report
                    }));
                }
                else
                {
                    // if it is not null, we just want to make sure we are not reporting a thing that is already deleted
                    if (getConfession.deleted)
                    {
                        return new JsonResult(BadRequest(new
                        {
                            errorCode = "confession already deleted",
                            entry = report
                        }));
                    }
                }
                associatedConfession = getConfession;
            }
            else
            {
                var getComments = _context.Comments.FirstOrDefault(x => x.Id == report.Comments);
                if (getComments == null)
                {
                    return new JsonResult(NotFound(new
                    {
                        errorCode = "comments not found",
                        entry = report
                    }));
                }
                else
                {
                    if (getComments.deleted)
                    {
                        return new JsonResult(BadRequest(new
                        {
                            errorCode = "comment already deleted",
                            entry = report
                        }));
                    }
                }
                associatedComments = getComments;
            }


            Report newReport = new Report()
            {
                reason = report.reason,
                Confession = associatedConfession.Id, // just making sure, that those two exists before adding them.
                Comments = associatedComments.Id,
                reportedByUserId = userId,
                parentConfessionId = report.type == "confession" ? associatedConfession.Id : associatedComments.ConfessionId
            };
            _context.Reports.Add(newReport);
            await _context.SaveChangesAsync();
            return new JsonResult(Ok());
        }

        /* This api let's user get single comment object */
        [Route("get-comment")]
        [HttpGet]
        public async Task<IActionResult> getSingleComment(Guid id)
        {
            var comment = _context.Comments.FirstOrDefault(x => x.Id == id);
            return new JsonResult(Ok(new
            {
                comment
            }));
        }

        [Route("notification")]
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetNotification(int page)
        {
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // we will send the notification associated with each user
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));

            var notifications = _context.Notifications.Where(u => u.userId == userId).OrderByDescending(d => d.createdAt);

            return new JsonResult(Ok(helper.NormalPagination(10, page, notifications)));
        }

        [Route("clear-notification")]
        [Authorize]
        [HttpDelete]
        public async Task<IActionResult> DeleteNotification(Guid notificationId)
        {
            var getNotification = _context.Notifications.FirstOrDefault(x => x.id == notificationId);   
            var getUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getUser == null) return new JsonResult(NotFound());

            if (!(getNotification.userId == getUser)) return new JsonResult(Unauthorized(new {message = "Cannot clear others notification!"})); // this sort of things cannot happen in normal circumstances, if and only if someone tries to modify client side code
            _context.Notifications.Remove(getNotification);
            await _context.SaveChangesAsync();

            return new JsonResult(Ok());
        }
    }
}