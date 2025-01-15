import { PostData, ADMIN_ID } from "./SlotConstants.js";
import { PlayerData, PollForPlayerAsync } from "./PlayerHandler.js";

async function AddCash() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get("id");
    if (playerId === null || playerId === undefined || playerId.length === 0) {
        alert("ERROR, ID PARAMETER");
        return;
    }
    const result = await PostData("ExchangeMoney", { "id": playerId, "amount": "200" });
    if (result === 200) {
        await PostData("SetPlayer", { "player": playerId });
        location.href = "/Home/Index";
    } else {
        alert("Failed to add cash");
    }
}

function IsValidAdmin(player: PlayerData): boolean {
    if (player === null || player === undefined) {
        return false;
    }

    if (player.id === null || player.id === undefined || player.id.length === 0) {
        return false;
    }

    return player.id === ADMIN_ID;
}

async function PollForBankLoop() {
    let player: PlayerData | null = null;
    while (!IsValidAdmin(player)) {
        player = await PollForPlayerAsync();
    }
    if (IsValidAdmin(player)) {
        AddCash();
    }
}

PollForBankLoop();