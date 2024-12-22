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
            ViewBag.BackgroundMusic = null;
            return View();
        }

        public IActionResult Privacy()
        {
            ViewBag.BackgroundMusic = null;
            return View();
        }
        public IActionResult chatHub()
        {
            ViewBag.BackgroundMusic = null;
            return View();
        }
        public IActionResult mathHub()
        {
            ViewBag.BackgroundMusic = null;
            return View();
        }
        [Authorize]
        public IActionResult fantasyVillage()
        {
            ViewBag.BackgroundMusic = Url.Content("~/audio/Medieval fantacy Music No Copyright.mp3");
            return View();
        }
        [Authorize]
        public IActionResult denSorteSkole()
        {
            ViewBag.BackgroundMusic = Url.Content("~/audio/Medieval fantacy Music No Copyright.mp3");
            return View();
        }
        [Authorize]
        public IActionResult kampplads()
        {
            ViewBag.BackgroundMusic = Url.Content("~/audio/Medieval fantacy Music No Copyright.mp3");
            return View();
        }
        

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}