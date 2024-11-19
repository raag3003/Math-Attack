using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace Webprogrammering.Hubs
{
    public class GameHub : Hub
    {
        // A list over all users wating for an opponenent
        private static Dictionary<string, List<string>> waitingPlayers = new();
        // An object with two strings (two users), that make sure these two users doesn't interrupt with the other users watting for a opponent.
        private static Dictionary<string, string> playerMatches = new();
        private static Dictionary<string, int> QuestionsPerDifficulty = new()
        {
            // Remember to update the number of quetions whenever quetions to the JSON-file gets updated or deleted
            { "4. Klasse", 6 },
            { "5. Klasse", 5 },
            { "6. Klasse", 4 },
            { "7. Klasse", 6 },
            { "8. Klasse", 5 },
            { "9. Klasse", 5 },
            { "10. Klasse", 1 }
        };

        public async Task JoinGame(string difficulty)
        {
            string connectionId = Context.ConnectionId;

            if (!waitingPlayers.ContainsKey(difficulty))
            {
                waitingPlayers[difficulty] = new List<string>();
            }

            waitingPlayers[difficulty].Add(connectionId);

            if (waitingPlayers[difficulty].Count >= 2)
            {
                string player1 = waitingPlayers[difficulty][0];
                string player2 = waitingPlayers[difficulty][1];
                waitingPlayers[difficulty].RemoveRange(0, 2);

                // Remember witch two users (clients) have matched each other
                playerMatches[player1] = player2;
                playerMatches[player2] = player1;

                string gameGroup = $"game_{player1}_{player2}";
                await Groups.AddToGroupAsync(player1, $"game_{player1}_{player2}");
                await Groups.AddToGroupAsync(player2, $"game_{player1}_{player2}");

                // Generte a question order for both clients
                var questionOrder = GenerateQuestionOrder(difficulty);

                // Sending gameGroup & questionOrder to both clients (player 1 & player 2)
                await Clients.Clients(player1, player2).SendAsync("GameStart", gameGroup, questionOrder);
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            string disconnectedPlayer = Context.ConnectionId;

            // Itterate through the waiting list and removeing users who isn't active longer
            foreach (var difficulty in waitingPlayers.Keys.ToList())
            {
                waitingPlayers[difficulty].Remove(disconnectedPlayer);
            }

            // Checks if a player in an active game is rage quitted, for then inform the user and sending them back to the difficulty menu screen
            if (playerMatches.TryGetValue(disconnectedPlayer, out string opponent))
            {
                // Inform the user that the connecetion is lost
                await Clients.Client(opponent).SendAsync("UserLeftBehind");

                // Remove both palyers from the object "playerMatches" so they can search for a new match if they want
                playerMatches.Remove(disconnectedPlayer);
                playerMatches.Remove(opponent);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task CorrectAnswer(string playerId)
        {
            if (playerMatches.TryGetValue(playerId, out string opponent))
            {
                // Send message to the oppoent that the question is answered corectly and they will lose some lives
                await Clients.Client(opponent).SendAsync("OpponentAnsweredCorrectly");
            }
        }

        private List<int> GenerateQuestionOrder(string difficulty)
        {
            if (!QuestionsPerDifficulty.TryGetValue(difficulty, out int questionCount))
            {
                return new List<int>();
            }

            // Generate a list of the ID's from the JSON-file based on the choosen difficulty
            var questionIds = Enumerable.Range(1, questionCount).ToList();

            // Randomize the ID's
            Random rng = new Random();
            var shuffledIds = questionIds.OrderBy(x => rng.Next()).ToList();

            return shuffledIds;
        }
    }
}
