using SlotMachineGame.Models;

namespace SlotMachineGame.Database
{
    public interface IPlayerDatabase
    {
        public bool TryGetCurrentPlayer(out PlayerData? player);

        public void SetCurrentPlayer(string? id);

        public bool TryReadPlayerData(string id, out PlayerData? player);

        public bool TryUpdatePlayerData(PlayerData player);

        public IEnumerable<PlayerData> GetPlayers();
    }
}
