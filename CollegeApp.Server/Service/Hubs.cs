using Microsoft.AspNetCore.SignalR;

namespace CollegeApp.Server.Service
{
    public class ChatHub : Hub
    {
        public async Task JoinChat(string chatId) // chatId = id of confession id
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
        }
    }
}
