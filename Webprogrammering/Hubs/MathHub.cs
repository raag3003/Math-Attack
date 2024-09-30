using Microsoft.AspNetCore.SignalR;
using System.Net.Http;
using System.Text.Json;

namespace Webprogrammering.Hubs
{
    public class MathHub : Hub
    {
        private static readonly HttpClient client = new HttpClient();
        private static Dictionary<string, string> correctAnswers = new Dictionary<string, string>();

        // Fetch math problem from API and send it to the group
        public async Task SendMathProblem(string groupName)
        {
            // Fetch the problem from the API
            var response = await client.GetStringAsync("https://opentdb.com/api.php?amount=10&category=19&difficulty=easy");
            var result = JsonDocument.Parse(response).RootElement.GetProperty("results")[0];
            var problem = result.GetProperty("question").GetString();
            var correctAnswer = result.GetProperty("correct_answer").GetString();

            // Store the correct answer for this group
            correctAnswers[groupName] = correctAnswer;

            // Send the problem to the group
            await Clients.Group(groupName).SendAsync("ReceiveMathProblem", problem);
        }

        // Check the submitted answer
        public async Task SubmitAnswer(string groupName, string userAnswer)
        {
            if (correctAnswers.TryGetValue(groupName, out var correctAnswer))
            {
                bool isCorrect = SanitizeAnswer(userAnswer) == SanitizeAnswer(correctAnswer);
                string feedbackMessage = isCorrect
                    ? "Correct!"
                    : $"Incorrect! The correct answer is '{correctAnswer}'.";

                await Clients.Caller.SendAsync("AnswerFeedback", isCorrect, feedbackMessage);
            }
        }

        // Helper method to sanitize the answer (ignore if the user added extra spaces and upper-/lowercase)
        private static string SanitizeAnswer(string answer)
        {
            return string.Join("", answer.Trim().ToLower().Split());
        }

        // Create a new group and adds the user to it
        public async Task CreateGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("GroupCreated", groupName);
        }

        // Add the user to an existing group
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("JoinedGroup", groupName);
        }

        // Remove the user from a group
        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("LeftGroup", groupName);
        }
    }
}