using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using Webprogrammering.Data;
using Webprogrammering.Hubs;

namespace Webprogrammering
{
    public class Program
    {
        // Application entry point
        // <param name="args">Command line arguments</param>
        public static void Main(string[] args)
        {
            // Create a new WebApplication builder instance
            var builder = WebApplication.CreateBuilder(args);

            // Get the database connection string from configuration
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            // Configure Entity Framework with SQL Server
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // Add development-time database error page
            builder.Services.AddDatabaseDeveloperPageExceptionFilter();

            // Enable SignalR for real-time communication with other clients
            builder.Services.AddSignalR();

            // Configure Identity system for user authentication
            builder.Services.AddDefaultIdentity<IdentityUser>(options =>
                options.SignIn.RequireConfirmedAccount = true)
                .AddEntityFrameworkStores<ApplicationDbContext>();

            // Add MVC services
            builder.Services.AddControllersWithViews();

            // Configure JSON serialization to ignore null values in our json script
            builder.Services.Configure<JsonOptions>(options =>
                options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull);

            // Load math questions from our JSON file
            var data = JsonSerializer.Deserialize<object>(
                File.ReadAllText("wwwroot/json/mathQuestions.json"));

            // Build the application
            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseMigrationsEndPoint();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // Enable HSTS (HTTP Strict Transport Security)
                app.UseHsts();
            }

            // Configure middleware pipeline
            app.UseHttpsRedirection();     // Redirect HTTP to HTTPS to make it more secure
            app.UseStaticFiles();          // Serve static files
            app.UseRouting();              // Enable routing
            app.UseAuthentication();       // Enable authentication
            app.UseAuthorization();        // Enable authorization

            // Configure default route pattern
            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            // Enable Razor Pages
            app.MapRazorPages();

            // Map SignalR hubs
            app.MapHub<ChatHub>("/chatHub");
            app.MapHub<MathHub>("/mathHub");
            app.MapHub<GameHub>("/gameHub");

            // Configure API endpoint for our math questions
            app.MapGet("/questions", () => data); //The API is "https://localhost:44300/questions/"

            // Start the application
            app.Run();
        }
    }
}