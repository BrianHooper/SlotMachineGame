using System.Text.Json.Serialization;
using System.Xml.Linq;

namespace SlotMachineGame.Models
{
    public class PlayerData
    {
        private const int DEFAULT_CASH = 100;

        [JsonPropertyName("name")]
        public string Name { get; init; }

        [JsonPropertyName("cash")]
        public int Cash { get; set; }

        [JsonPropertyName("gamesPlayed")]
        public int GamesPlayed { get; set; }

        public PlayerData()
        {
            Name = string.Empty;
            Cash = DEFAULT_CASH;
            GamesPlayed = 0;
        }

        public PlayerData(string name)
        {
            Name = name;
            Cash = DEFAULT_CASH;
            GamesPlayed = 0;
        }

        public PlayerData(string name, int cash, int gamesPlayed)
        {
            Name = name;
            Cash = cash;
            GamesPlayed = gamesPlayed;
        }
    }
}
