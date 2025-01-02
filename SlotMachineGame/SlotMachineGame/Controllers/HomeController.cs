using Microsoft.AspNetCore.Mvc;
using SlotMachineGame.Models;
using System.Diagnostics;
using System.Text.Json;

namespace SlotMachineGame.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> Logger;
        private IPlayerHandler playerHandler;

        public HomeController(ILogger<HomeController> logger, IPlayerHandler playerHandler)
        {
            this.Logger = logger;
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
            if (this.playerHandler.TryGetCurrentPlayer(out var player) && player != null)
            {
                this.Logger.LogInformation("Got current player \"{0}\"", player.Id);
                return Ok(player);
            }

            this.Logger.LogDebug("No current player");
            return NoContent();
        }

        [HttpPost]
        public IActionResult SetPlayer([FromBody] Dictionary<string, string> request)
        {
            if (request != null && request.TryGetValue("player", out var id) && !string.IsNullOrWhiteSpace(id))
            {
                this.Logger.LogInformation("Setting current player to \"{0}\"", id);
                this.playerHandler.SetCurrentPlayer(id);
                return Ok(id);
            }

            this.Logger.LogWarning("Failed to set current player");
            return BadRequest();
        }

        [HttpPost]
        public IActionResult UpdatePlayerData([FromBody] PlayerData player)
        {
            this.Logger.LogInformation("Updating player data for \"{0}\"", player.Id);
            this.playerHandler.UpdatePlayerData(player);
            return Ok(player.Id);
        }

        [HttpPost]
        public IActionResult PlaceBet([FromBody] Dictionary<string, string> request)
        {
            if (request == null || !request.TryGetValue("amount", out var amountStr) || !int.TryParse(amountStr, out var amount) || amount < 0)
            {
                this.Logger.LogWarning("Invalid bet amount");
                return BadRequest();
            }

            this.Logger.LogWarning("Failed to set current player");
            return BadRequest();
        }
    }
}