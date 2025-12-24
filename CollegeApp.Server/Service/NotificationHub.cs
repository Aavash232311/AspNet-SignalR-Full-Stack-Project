using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CollegeApp.Server.Service
{
    /* 
    When we make the application rely on single userId and send message to groups we will have an problem
    
    We might be targeted to Insecure Direct Object Reference (IDOR) attack if we are not careful.
    
    */
    [Authorize]
    public class NotificationHub: Hub
    {

    }
}
