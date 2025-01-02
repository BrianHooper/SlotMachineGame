using SlotMachineGame.Models;
using Tenray.ZoneTree.Comparers;
using Tenray.ZoneTree.Serializers;
using Tenray.ZoneTree;
using System.Text.Json;

namespace SlotMachineGame
{
    public class PlayerHandler : IPlayerHandler
    {
        private readonly ILogger<PlayerHandler> Logger;

        private PlayerData? CurrentPlayer;

        private string DatabaseFileDirectory { get; }

        private IZoneTree<string, string> ZoneTree { get; }

        public PlayerHandler(ILogger<PlayerHandler> logger)
        {
            this.CurrentPlayer = null;
            this.Logger = logger;
            this.DatabaseFileDirectory = @"C:\SlotMachineDataStore";
            this.ZoneTree = new ZoneTreeFactory<string, string>()
                .SetComparer(new StringOrdinalIgnoreCaseComparerAscending())
                .SetDataDirectory(Path.Combine(this.DatabaseFileDirectory, "ZoneTreeDb"))
                .SetKeySerializer(new Utf8StringSerializer())
                .SetValueSerializer(new Utf8StringSerializer())
                .OpenOrCreate();
        }

        public void SetCurrentPlayer(string id)
        {
            if (TryReadPlayerData(id, out var player) && player != null)
            {
                this.Logger.LogInformation("Set current player \"{0}\" from DB", id);
                this.CurrentPlayer = player;
            }
            else
            {
                this.Logger.LogInformation("Set current player to new player \"{0}\"", id);
                var playerData = new PlayerData();
                playerData.Id = id;
                UpdatePlayerData(playerData);
                this.CurrentPlayer = playerData;
            }
        }

        public bool TryGetCurrentPlayer(out PlayerData? player)
        {
            //this.SetCurrentPlayer("brian");
            if (this.CurrentPlayer != null)
            {
                this.Logger.LogInformation("Got current player \"{0}\"", this.CurrentPlayer.Id);
                player = this.CurrentPlayer;
                this.CurrentPlayer = null;
                return true;
            }
            this.Logger.LogDebug("Current player is null.");
            player = null;
            return false;
        }

        public bool TryReadPlayerData(string id, out PlayerData? player)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                this.Logger.LogWarning("Requested player name is null");
                player = null;
                return false;
            }

            if (!this.ZoneTree.TryGet(id, out var jsonData))
            {
                this.Logger.LogInformation("No DB data for player \"{0}\"", id);
                player = null;
                return false;
            }

            if (!TryDeserialize(jsonData, out player))
            {
                this.Logger.LogWarning("Failed to deserialize DB data for player \"{0}\"", id);
                player = null;
                return false;
            }

            if (player == null)
            {
                this.Logger.LogWarning("Deserialize DB data is null for player \"{0}\"", id);
                player = null;
                return false;
            }

            this.Logger.LogInformation("Deserialized DB data for player \"{0}\", name: {1}, cash: {2}, games played: {3}", id, player.Name, player.Cash, player.GamesPlayed);
            return true;
        }

        public void UpdatePlayerData(PlayerData player)
        {
            if (string.IsNullOrWhiteSpace(player?.Id))
            {
                return;
            }
            var playerJson = JsonSerializer.Serialize(player);
            this.ZoneTree.Upsert(player.Id, playerJson);
            this.Logger.LogInformation("Updated DB data for player \"{0}\"", player.Id);
        }

        private static bool TryDeserialize<T>(string json, out T? data)
        {
            try
            {
                data = JsonSerializer.Deserialize<T>(json);
                return data != null;
            }
            catch
            {
                data = default;
                return false;
            }
        }
    }
}
