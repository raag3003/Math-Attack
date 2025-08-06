using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace MathAttack.Services
{
    // Class to hold MailerSend settings
    public class MailerSendSettings
    {
        public string Server { get; set; }
        public int Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string SenderEmail { get; set; }
        public string SenderName { get; set; }
    }

    public class EmailSender : IEmailSender
    {
        private readonly MailerSendSettings _mailerSendSettings;

        // Get the settings from dependency injection
        public EmailSender(IOptions<MailerSendSettings> mailerSendSettings)
        {
            _mailerSendSettings = mailerSendSettings.Value;
        }

        public Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            // Create the SmtpClient
            var client = new SmtpClient(_mailerSendSettings.Server, _mailerSendSettings.Port)
            {
                Credentials = new NetworkCredential(_mailerSendSettings.Username, _mailerSendSettings.Password),
                EnableSsl = true // MailerSend requires SSL/TLS
            };

            // Create the MailMessage
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_mailerSendSettings.SenderEmail, _mailerSendSettings.SenderName),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };
            mailMessage.To.Add(email);

            // Send the email
            return client.SendMailAsync(mailMessage);
        }
    }
}
