using Microsoft.AspNetCore.Mvc;
using SlotMachineGame.Database;
using SlotMachineGame.Helpers;
using SlotMachineGame.Models;
using System.Diagnostics;

namespace SlotMachineGame.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> Logger;
        private IPlayerDatabase PlayerDatabase;

        public HomeController(ILogger<HomeController> logger, IPlayerDatabase playerDatabase)
        {
            this.Logger = logger;
            this.PlayerDatabase = playerDatabase;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        public IActionResult Editor()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [HttpGet]
        public IActionResult GetCurrentPlayer()
        {
            if (this.PlayerDatabase.TryGetCurrentPlayer(out var player) && player != null)
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
                this.PlayerDatabase.SetCurrentPlayer(id);
                return Ok(id);
            }

            this.Logger.LogWarning("Failed to set current player");
            return BadRequest();
        }

        [HttpPost]
        public IActionResult UpdatePlayerData([FromBody] PlayerData player)
        {
            this.Logger.LogInformation("Updating player data for \"{0}\"", player.Id);
            this.PlayerDatabase.TryUpdatePlayerData(player);
            return Ok(player.Id);
        }

        [HttpPost]
        public IActionResult ExchangeMoney([FromBody] Dictionary<string, string> request)
        {
            if (request == null)
            {
                this.Logger.LogWarning("Invalid exchange request");
                return BadRequest();
            }

            if (!request.TryGetValue("amount", out var amountStr) || !int.TryParse(amountStr, out var amount) || amount == 0)
            {
                this.Logger.LogWarning("Invalid exchange amount");
                return BadRequest();
            }

            if (!request.TryGetValue("id", out var id) || string.IsNullOrWhiteSpace(id)
                || !this.PlayerDatabase.TryReadPlayerData(id, out var player) || player == null)
            {
                this.Logger.LogWarning("Failed to get player data");
                return BadRequest();
            }

            if (player.Cash + amount < 0)
            {
                this.Logger.LogWarning("Player has insufficient funds");
                return Error();
            }

            player.Cash += amount;
            this.PlayerDatabase.TryUpdatePlayerData(player);

            if (!this.PlayerDatabase.TryReadPlayerData(Constants.BankerId, out var banker) || banker == null)
            {
                this.Logger.LogError("Failed to get banker data");
                return Error();
            }

            banker.Cash -= amount;
            if (banker.Cash < 0)
            {
                this.Logger.LogInformation("Bank is broke! Resetting...");
                banker.Cash = Constants.BankerCash;
            }
            this.PlayerDatabase.TryUpdatePlayerData(banker);

            this.Logger.LogInformation("Exchanged ${0}, player now has ${1}, bank now has ${2}", amount, player.Cash, banker.Cash);
            return Ok(player);
        }

        [HttpPost]
        public IActionResult GetPlayerData([FromBody] Dictionary<string, string> request)
        {
            if (request != null
                && request.TryGetValue("id", out var id)
                && !string.IsNullOrWhiteSpace(id)
                && this.PlayerDatabase.TryReadPlayerData(id, out var player)
                && player != null)
            {
                this.Logger.LogInformation("Got current player \"{0}\"", player.Id);
                return Ok(player);
            }

            this.Logger.LogWarning("No player found");
            return BadRequest();
        }
    }
}