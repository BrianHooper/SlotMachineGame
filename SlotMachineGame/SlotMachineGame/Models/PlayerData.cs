using SlotMachineGame.Helpers;
using System.Text.Json.Serialization;

namespace SlotMachineGame.Models
{
    public class PlayerData
    {
        [JsonPropertyName("name")]
        public string Name { get; init; }

        [JsonPropertyName("cash")]
        public int Cash { get; set; }

        [JsonPropertyName("gamesPlayed")]
        public int GamesPlayed { get; set; }

        [JsonPropertyName("id")]
        public string Id { get; set; }

        public PlayerData()
        {
            Name = string.Empty;
            Cash = Constants.DefaultCash;
            GamesPlayed = 0;
            Id = string.Empty;
        }
    }
}
