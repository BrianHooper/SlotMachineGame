using SlotMachineGame.Helpers;
using SlotMachineGame.Models;
using System.Numerics;

namespace SlotMachineGame.Database
{
    public class PlayerDatabase : IPlayerDatabase
    {
        private readonly TimeSpan SignalTimeout = TimeSpan.FromSeconds(5);

        private readonly ILogger<PlayerDatabase> Logger;
        private readonly JsonDatabase<string, PlayerData> Database;

        private PlayerData? CurrentPlayer;
        private DateTime? CurrentPlayerSetTime;

        public PlayerDatabase(IFilePathProvider filePathProvider, ILogger<PlayerDatabase> logger)
        {
            this.Logger = logger;
            this.Database = new JsonDatabase<string, PlayerData>(filePathProvider, this.Logger, "PlayerData.json");
            this.ValidateBanker();
        }

        public void SetCurrentPlayer(string? id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                this.CurrentPlayer = null;
                this.CurrentPlayerSetTime = null;
            }
            else if (TryReadPlayerData(id, out var player) && player != null)
            {
                this.Logger.LogInformation("Set current player \"{0}\" from DB", id);
                this.CurrentPlayer = player;
                this.CurrentPlayerSetTime = DateTime.Now;
            }
            else
            {
                this.Logger.LogInformation("Set current player to new player \"{0}\"", id);
                var playerData = new PlayerData();
                playerData.Id = id;
                TryUpdatePlayerData(playerData);
                this.CurrentPlayer = playerData;
                this.CurrentPlayerSetTime = DateTime.Now;
            }
        }

        public bool TryGetCurrentPlayer(out PlayerData? player)
        {
            this.SetCurrentPlayer("1234");

            var currentPlayer = this.CurrentPlayer;
            var currentPlayerSetTime = this.CurrentPlayerSetTime;
            this.SetCurrentPlayer(null);

            if (currentPlayer == null || currentPlayerSetTime == null)
            {
                this.Logger.LogDebug("Current player is null.");
                player = null;
                return false;
            }

            var timeSinceSignal = (DateTime.Now - currentPlayerSetTime.Value);
            if (timeSinceSignal > this.SignalTimeout)
            {
                this.Logger.LogInformation("Signal timeout, seconds since signal: {0}", timeSinceSignal.TotalSeconds);
                player = null;
                return false;
            }

            this.Logger.LogInformation("Got current player \"{0}\", seconds since signal: {1}", currentPlayer.Id, timeSinceSignal.TotalSeconds);
            player = currentPlayer;
            return true;
        }

        public bool TryReadPlayerData(string id, out PlayerData? player)
        {
            if (!this.Database.TryRead(id, out player) || player == null)
            {
                this.Logger.LogInformation($"Requested player id \"{id}\" not found in database");
                return false;
            }

            this.Logger.LogInformation("Deserialized DB data for player \"{0}\", name: {1}, cash: {2}, games played: {3}", id, player.Name, player.Cash, player.GamesPlayed);
            return true;
        }

        public bool TryUpdatePlayerData(PlayerData player)
        {
            if (!this.Database.TryWrite(player.Id, player))
            {
                this.Logger.LogError($"UpdatePlayerData: Database updated failed for player \"{player.Id}\"");
                return false;
            }
            this.Logger.LogInformation("Updated DB data for player \"{0}\"", player.Id);
            return true;
        }

        private void ValidateBanker()
        {
            if (this.TryReadPlayerData(Constants.BankerId, out var banker) && banker != null)
            {
                this.Logger.LogInformation($"ValidateBanker: Found banker \"{banker.Name}\" with ${banker.Cash}");
                return;
            }

            var newBanker = new PlayerData()
            {
                Id = Constants.BankerId,
                Name = Constants.BankerName,
                Cash = Constants.BankerCash,
                GamesPlayed = 0
            };

            if (!this.TryUpdatePlayerData(newBanker))
            {
                var ex = new Exception("ValidateBanker: Failed to initialize banker");
                this.Logger.LogError(ex.Message);
                throw ex;
            };
        }
    }
}
