using SlotMachineGame.Models;
using Tenray.ZoneTree.Comparers;
using Tenray.ZoneTree.Serializers;
using Tenray.ZoneTree;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection.KeyManagement;

namespace SlotMachineGame
{
    public class PlayerHandler : IPlayerHandler
    {
        private PlayerData? CurrentPlayer;

        private string DatabaseFileDirectory { get; }

        private IZoneTree<string, string> ZoneTree { get; }

        public PlayerHandler()
        {
            this.CurrentPlayer = null;
            this.DatabaseFileDirectory = @"C:\SlotMachineDataStore";
            this.ZoneTree = new ZoneTreeFactory<string, string>()
                .SetComparer(new StringOrdinalIgnoreCaseComparerAscending())
                .SetDataDirectory(Path.Combine(this.DatabaseFileDirectory, "ZoneTreeDb"))
                .SetKeySerializer(new Utf8StringSerializer())
                .SetValueSerializer(new Utf8StringSerializer())
                .OpenOrCreate();
        }

        public void SetCurrentPlayer(string name)
        {
            if (TryReadPlayerData(name, out var player))
            {
                this.CurrentPlayer = player;
            }
            else
            {
                var playerData = new PlayerData(name);
                UpdatePlayerData(playerData);
                this.CurrentPlayer = playerData;
            }
            //if (this.Players.TryGetValue(name, out var playerData))
            //{
            //    this.CurrentPlayer = playerData;
            //}
            //else
            //{
            //    this.CurrentPlayer = new PlayerData(name);
            //    this.Players.Add(name, this.CurrentPlayer);
            //}
        }

        public bool TryGetCurrentPlayer(out PlayerData? player)
        {
            //this.SetCurrentPlayer("brian");
            if (this.CurrentPlayer != null)
            {
                player = this.CurrentPlayer;
                this.CurrentPlayer = null;
                return true;
            }
            player = null;
            return false;
        }

        public bool TryReadPlayerData(string name, out PlayerData? player)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                player = null;
                return false;
            }

            if (!this.ZoneTree.TryGet(name, out var jsonData))
            {
                player = null;
                return false;
            }

            if (!TryDeserialize(jsonData, out player))
            {
                player = null;
                return false;
            }

            return player != null;
        }

        public void UpdatePlayerData(PlayerData player)
        {
            if (string.IsNullOrWhiteSpace(player?.Name))
            {
                return;
            }
            var playerJson = JsonSerializer.Serialize(player);
            this.ZoneTree.Upsert(player.Name, playerJson);
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
