using SlotMachineGame.Models;

namespace SlotMachineGame
{
    public interface IPlayerHandler
    {
        public bool TryGetCurrentPlayer(out PlayerData? player);

        public void SetCurrentPlayer(string name);

        public bool TryReadPlayerData(string name, out PlayerData? player);

        public void UpdatePlayerData(PlayerData player);
    }
}
