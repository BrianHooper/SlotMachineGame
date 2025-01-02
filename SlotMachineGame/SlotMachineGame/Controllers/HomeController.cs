using Microsoft.AspNetCore.Mvc;
using SlotMachineGame.Models;
using System.Diagnostics;
using System.Text.Json;

namespace SlotMachineGame.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private IPlayerHandler playerHandler;

        public HomeController(ILogger<HomeController> logger, IPlayerHandler playerHandler)
        {
            _logger = logger;
            this.playerHandler = playerHandler;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


        [HttpGet]
        public IActionResult GetPlayer()
        {
            if (this.playerHandler.TryGetCurrentPlayer(out var player))
            {
                return Ok(player);
            }

            return NoContent();
        }

        [HttpPost]
        public IActionResult SetPlayer([FromBody] Dictionary<string, string> request)
        {
            if (request != null && request.TryGetValue("player", out var name) && !string.IsNullOrWhiteSpace(name))
            {
                this.playerHandler.SetCurrentPlayer(name);
                return Ok(name);
            }

            return BadRequest();
        }

        [HttpPost]
        public IActionResult UpdatePlayerData([FromBody] PlayerData player)
        {
            this.playerHandler.UpdatePlayerData(player);
            return Ok();
        }
    }
}