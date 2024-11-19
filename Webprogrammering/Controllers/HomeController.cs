using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using Webprogrammering.Models;

namespace Webprogrammering.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }
        public IActionResult chatHub()
        {
            return View();
        }
        public IActionResult mathHub()
        {
            return View();
        }
        [Authorize]
        public IActionResult fantasyVillage()
        {
            return View();
        }
        [Authorize]
        public IActionResult denSorteSkole()
        {
            return View();
        }
        [Authorize]
        public IActionResult kampplads()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}