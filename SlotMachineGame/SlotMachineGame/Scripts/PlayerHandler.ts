export interface PlayerData {
    cash: number,
    gamesPlayed: number,
    name: string,
    id: string
}

export async function PollForPlayerAsync(): Promise<PlayerData> {
    console.log(`Start polling`);
    let idx: number = 0;
    let player: PlayerData | undefined = undefined;
    while (player === undefined) {
        player = await new Promise(resolve => setTimeout(resolve, 500)).then(() => {
            return GetCurrentPlayerAsync();
        });
        console.log(`idx: ${idx}, player === undefined: ${player === undefined}`);
        idx++;
    }
    console.log(`Done polling - found player ${player.name}`);
    return player;
}

export async function GetCurrentPlayerAsync(): Promise<PlayerData | undefined> {
    return await $.ajax({
        type: "GET",
        url: `/Home/GetCurrentPlayer`
    }).then(function (player: PlayerData | undefined, t) {
        if (t === "success") {
            return player;
        } else {
            return undefined;
        }
    });
}