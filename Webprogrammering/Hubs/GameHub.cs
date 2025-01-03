﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace Webprogrammering.Hubs
{
    public class GameHub : Hub
    {
        private static Dictionary<string, List<string>> waitingPlayers = new(); // A list over all users and there corresponding choosen difficulty, wating for an opponenent
        private static Dictionary<string, string> playerDifficulties = new(); // A list over all users and there corresponding choosen difficulty
        // An object with two strings (two users), that make sure these two users doesn't interrupt with the other users watting for a opponent.
        private static Dictionary<string , string> playerSelectedDifficulties = new();
        private static Dictionary<string, string> pinGames = new();
        private static Dictionary<string, string> playerMatches = new();
        private static Dictionary<string, bool> rematchRequests = new(); // A list over which two users that is eligible to play a rematch against each other, and if they have said yes
        private static Dictionary<string, int> QuestionsPerDifficulty = new()
        {
            // Remember to update the number of quetions whenever quetions to the JSON-file gets updated or deleted
            { "4. Klasse", 21 },
            { "5. Klasse", 20 },
            { "6. Klasse", 18 },
            { "7. Klasse", 21 },
            { "8. Klasse", 17 },
            { "9. Klasse", 16 },
            { "10. Klasse", 11 }

        };

        public async Task JoinGame(string difficulty)
        {
            string connectionId = Context.ConnectionId;

            if (!waitingPlayers.ContainsKey(difficulty))
            {
                waitingPlayers[difficulty] = new List<string>();
            }

            waitingPlayers[difficulty].Add(connectionId);
            playerDifficulties[connectionId] = difficulty; // Store users choosen difficulty
            playerSelectedDifficulties[connectionId] = difficulty; // Add this line to store selected difficulty

            if (waitingPlayers[difficulty].Count >= 2)
            {
                string player1 = waitingPlayers[difficulty][0];
                string player2 = waitingPlayers[difficulty][1];
                waitingPlayers[difficulty].RemoveRange(0, 2);

                // Remember witch two users (clients) have matched each other
                playerMatches[player1] = player2;
                playerMatches[player2] = player1;

                string gameGroup = $"game_{player1}_{player2}";
                await Groups.AddToGroupAsync(player1, gameGroup);
                await Groups.AddToGroupAsync(player2, gameGroup);

                // Generte a question order for both clients
                var questionOrder = GenerateQuestionOrder(difficulty);

                // Send gameGroup, questionOrder, and difficulty to both clients
                await Clients.Clients(player1, player2).SendAsync("GameStart", gameGroup, questionOrder, difficulty);
            }
        }

        public async Task HostGame(string difficulty, string pin, string selectedDifficulty)
        {
            string connectionId = Context.ConnectionId;

            if (pinGames.ContainsKey(pin))
            {
                await Clients.Client(connectionId).SendAsync("Error", "PIN already in use. Try again.");
                return;
            }

            // Stores the values of pin, difficulty, selectedDifficulty
            pinGames[pin] = connectionId;
            playerDifficulties[connectionId] = difficulty;
            playerSelectedDifficulties[connectionId] = selectedDifficulty;


            await Clients.Client(connectionId).SendAsync("GameHosted", pin);

        }

        public async Task JoinGameByPin(string pin)
        {
            string connectionId = Context.ConnectionId;

            //Check if pin is correct
            if (!pinGames.ContainsKey(pin)) 
            {
                await Clients.Client(connectionId).SendAsync("Error", "Invalid PIN.");
                return;
            }

            string hostConnectionId = pinGames[pin];

            // PIN is no longer needed after the match is made
            pinGames.Remove(pin); 

            // Gives the joining player the values of difficulty selected by the host
            string difficulty = playerDifficulties[hostConnectionId];
            string klasse = playerSelectedDifficulties[hostConnectionId];


            playerMatches[hostConnectionId] = connectionId;
            playerMatches[connectionId] = hostConnectionId;

            string gameGroup = $"game_{hostConnectionId}_{connectionId}";

            await Groups.AddToGroupAsync(hostConnectionId, gameGroup);
            await Groups.AddToGroupAsync(connectionId, gameGroup);

            var questionOrder = GenerateQuestionOrder(difficulty);

            await Clients.Clients(hostConnectionId, connectionId).SendAsync("GameStart", gameGroup, questionOrder, klasse);


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

                // Remove both palyers from the object "playerMatches" and "playerDifficulties" so they can search for a new match and choose a new difficulty if they want
                playerDifficulties.Remove(disconnectedPlayer);
                playerMatches.Remove(disconnectedPlayer);
                playerMatches.Remove(opponent);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task CorrectAnswer(string playerId)
        {
            if (playerMatches.TryGetValue(playerId, out string opponent))
            {
                // Synchronizing the 20% damage to the opponent
                await Clients.Client(opponent).SendAsync("TakeDamage", 20);
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

        // Synchronizing the rematch funtionalities, so when both users press rematch it will synchronize it and start the game
        public async Task RequestRematch(string playerId)
        {
            if (playerMatches.TryGetValue(playerId, out string opponent))
            {
                await Clients.Client(opponent).SendAsync("RematchRequested");
                rematchRequests[playerId] = true;

                // If both players/clients have requested a rematch
                if (rematchRequests.ContainsKey(opponent) && rematchRequests[opponent])
                {
                    // Resests both the requests
                    rematchRequests.Remove(playerId);
                    rematchRequests.Remove(opponent);

                    string gameGroup = $"game_{playerId}_{opponent}";

                    // Looking in the dictionary "playerDifficulties" to match these player ID's with whose in "rematchRequests" to see if both players have submitted a rematch
                    if (playerDifficulties.TryGetValue(playerId, out string difficulty))
                    {
                        var questionOrder = GenerateQuestionOrder(difficulty);
                        await Clients.Clients(playerId, opponent).SendAsync("GameStart", gameGroup, questionOrder);
                    }
                }
            }
        }

    }
}
