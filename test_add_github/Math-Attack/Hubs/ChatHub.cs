using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Webprogrammering.Hubs
{
    public class ChatHub : Hub
    {
        // Metode til at oprette en gruppe
        public async Task CreateGroup(string groupName)
        {
            // Tilføj brugeren til gruppen
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("GroupCreated", groupName);
        }

        // Metode til at deltage i en gruppe
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("JoinedGroup", groupName);
        }

        // Metode til at sende beskeder til gruppen
        public async Task SendMessage(string groupName, string user, string message)
        {
            await Clients.Group(groupName).SendAsync("ReceiveMessage", user, message);
        }

        // Metode til at forlade gruppen
        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("LeftGroup", groupName);
        }

    }
}