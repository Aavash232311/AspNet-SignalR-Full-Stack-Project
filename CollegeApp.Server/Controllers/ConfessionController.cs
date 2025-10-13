using CollegeApp.Server.Data;
using CollegeApp.Server.Models;
using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CollegeApp.Server.Controllers
{

    [Route("[controller]")]
    [ApiController]
    public class ConfessionController : ControllerBase
    {
        public ApplicationDbContext _context;
        public Auth0 _userManager;
        private readonly IHubContext<ChatHub> _hubContext;
        public Helper helper;
        public ConfessionController(ApplicationDbContext context, Auth0 _userManager, IHubContext<ChatHub> _hubContext, Helper helper)
        {
            this._context = context;
            this._userManager = _userManager;   
            this._hubContext = _hubContext;
            this.helper = helper;
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

            confession.LastModified = DateTime.Now;
            confession.Description = newConfession.Description;
            confession.Topic = newConfession.Topic;
            await _context.SaveChangesAsync();
            return new JsonResult(Ok());
        }

        [Route("YourConfession")]
        [HttpGet]
        [Authorize]
        public IActionResult GetConfessions(int page)
        {
            if (page == 0) return new JsonResult(BadRequest()); 
            int pageSize = 5;
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new {message = "User not found"}));
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
            return new JsonResult(Ok(confession));
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

        [Route("AddComment")]
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddComments(string comments, Guid confessionId)
        {
            var getConfessions = _context.Confessions.FirstOrDefault(x => x.Id == confessionId);
            if (getConfessions == null) return new JsonResult(NotFound(new { message = "Confession not found" }));

            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" }));
            // in comment for the default cascade behaviour to work
            // we need need to specify foregin key
            Comments newComment = new Comments()
            {
                comments = comments,
                UserId = userId,
                ConfessionId = getConfessions.Id,
                Confessions = getConfessions,
                profileColor = helper.RandomRGB()
            };
            _context.Comments.Add(newComment);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group((getConfessions.Id).ToString()).SendAsync("ReceiveMessage", newComment);
            return new JsonResult(Ok(newComment));
        }


        [Route("GetComments")]
        [HttpGet]
        public async Task<IActionResult> GetComments(Guid confessionId, int page)
        {
            if (page == 0) return new JsonResult(BadRequest(new { message = "Page number cannot be zero" }));
            var getConfessions = _context.Confessions.FirstOrDefault(x => x.Id == confessionId);
            if (getConfessions == null) return new JsonResult(NotFound(new { message = "Confession not found" }));
            var comments = _context.Comments.Where(b => b.Parent == null).Include(r => r.Replies);
            /* From the prespective of runtime complexity, okay if we load all at once then its a nexted structure right,
             * then we might end up with lots of user driven data like high resolution image and stuff. 
             We need to load only whats needed so that we can make this endpoint effective we need to explicitely call the fetch api from
            front-end for that.*/
            int pageSize = 5;
            return new JsonResult(Ok(helper.NormalPagination(pageSize, page, comments)));
        }

        [Route("get-children-comments")]
        [HttpGet]
        public async Task<IActionResult> GetReplyComments(Guid parentId)
        {
            var getParentComment = _context.Comments.Include(r => r.Replies).FirstOrDefault(x => x.Id == parentId);
            if (getParentComment == null) return new JsonResult(NotFound(new { message = "Parent comment not found" }));

            return new JsonResult(Ok(getParentComment.Replies)); // load everyting for now, if we were to scale this application to very large then we could add pagination here to ex: by scrolling
        }

        [Route("ReplyComment")]
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> ReplyComment(string comment, Guid parentId, Guid confessionId)
        {
            var parentComment = _context.Comments.FirstOrDefault(x => x.Id == parentId);
            if (parentComment == null) return new JsonResult(BadRequest(new {message = "No parent found."}));
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return new JsonResult(Unauthorized(new { message = "User not found" })); // even though use is always authoprize to get to this point, i get annoyed by that underline
            var getConfession = _context.Confessions.FirstOrDefault(x => x.Id == confessionId);
            if (getConfession == null) return new JsonResult(NotFound(new { message = "Confession not found" }));

            Comments newComment = new Comments() // creating a reply comment
            {
                comments = comment,
                UserId = userId,
                Parent = parentComment, // referencing it with parent
                ParentId = parentComment.Id, // setting the parentId to the parent comment's Id, even though cascade delete logic wont work here,
                ConfessionId = parentComment.ConfessionId, // setting the confessionId to the parent comment's confessionId
                Confessions = getConfession, // setting the confession to the current confession,
                // a clever way to use cascade in this sort of like hierarchial structure is to pass in parent reference in the every child comment
                profileColor = helper.RandomRGB() // setting the profile color to a random color
            };

            parentComment.Replies.Add(newComment); // adding the new comment to the parent comment's children list for easy navigation 
            _context.Comments.Add(newComment); // adding that to the databse

            // sending the reply comment to the websocket
            await _hubContext.Clients.Group((confessionId).ToString()).SendAsync("ReceiveMessage", newComment);
            await _context.SaveChangesAsync(); // saving the changes
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

    }
}
