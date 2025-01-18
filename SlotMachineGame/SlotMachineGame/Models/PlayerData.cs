using SlotMachineGame.Helpers;
using System.Text.Json.Serialization;

namespace SlotMachineGame.Models
{
    public class PlayerData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("cash")]
        public int Cash { get; set; }

        [JsonPropertyName("gamesPlayed")]
        public int GamesPlayed { get; set; }

        [JsonPropertyName("totalSpent")]
        public int TotalSpent { get; set; }

        [JsonPropertyName("totalWon")]
        public int TotalWon { get; set; }

        public PlayerData()
        {
            Id = string.Empty;
            Name = string.Empty;
            Cash = Constants.DefaultCash;
            GamesPlayed = 0;
            TotalSpent = 0;
            TotalWon = 0;
        }
    }
}
