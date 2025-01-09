using SlotMachineGame.Models;

namespace SlotMachineGame.Database
{
    public interface IPlayerDatabase
    {
        public bool TryGetCurrentPlayer(out PlayerData? player);

        public void SetCurrentPlayer(string name);

        public bool TryReadPlayerData(string name, out PlayerData? player);

        public bool TryUpdatePlayerData(PlayerData player);
    }
}
