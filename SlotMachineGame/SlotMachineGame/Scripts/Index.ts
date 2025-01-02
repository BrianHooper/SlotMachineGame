const NUM_ICONS = 5;
const NUM_SLOTS = 50;
const SLOT_HEIGHT = 150;
const SLOT_UPPER_POSITION = -1 * (SLOT_HEIGHT / 2);
const SLOT_LOWER_POSITION = -1 * ((NUM_SLOTS - 3) * SLOT_HEIGHT - (SLOT_HEIGHT / 2));

interface PrizeResult {
    value: number,
    first: number,
    second: number,
    third: number
}

interface PlayerData {
    cash: number,
    gamesPlayed: number,
    name: string,
    id: string
}

function getRandomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function CalculateWinnings(first: number, second: number, third: number): number {
    if (first == second && second == third) {
        return 100;
    } else if (first == second || first == third || second == third) {
        return 10;
    } else {
        return 0;
    }
}

function GeneratePrize(): PrizeResult {
    const first = getRandomIntInRange(1, NUM_ICONS);
    const second = getRandomIntInRange(1, NUM_ICONS);
    const third = getRandomIntInRange(1, NUM_ICONS);
    const value = CalculateWinnings(first, second, third);

    const prize: PrizeResult = {
        value: value,
        first: first,
        second: second,
        third: third
    };
    console.log(prize);
    return prize;
}

function AddBoxes(module: JQuery<HTMLElement>) {
    module.empty();
    for (var i = 0; i < NUM_SLOTS; i++) {
        jQuery("<div/>", { "class": "innerBox", "data-index": i.toString() })
            .css("height", `${SLOT_HEIGHT}px`)
            .html(getRandomIntInRange(1, NUM_ICONS).toString())
            .appendTo(module);
    }
}

function RandomizeSlots(slot: JQuery<HTMLElement>) {
    slot.find(`[data-index='${NUM_SLOTS-3}']`).text(slot.find(`[data-index='${0}']`).text());
    slot.find(`[data-index='${NUM_SLOTS-2}']`).text(slot.find(`[data-index='${1}']`).text());
    slot.find(`[data-index='${NUM_SLOTS-1}']`).text(slot.find(`[data-index='${2}']`).text());

    for (var i = 0; i < NUM_SLOTS - 3; i++) {
        slot.find(`[data-index='${1}']`).html(getRandomIntInRange(1, NUM_ICONS).toString());
    }
}

async function PostData(endpoint: string, data: any): Promise<boolean> {
    return await $.ajax({
        type: "POST",
        url: `/Home/${endpoint}`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
    });
}

async function UpdatePlayerData(playerData: PlayerData): Promise<boolean> {
    return await PostData("UpdatePlayerData", playerData);
}

async function PollForPlayerAsync(): Promise<PlayerData> {
    console.log(`Start polling`);
    let idx: number = 0;
    let player: PlayerData | undefined = undefined;
    while (player === undefined) {
        player = await new Promise(resolve => setTimeout(resolve, 500)).then(() => {
            return GetPlayerAsync();
        });
        console.log(`idx: ${idx}, player === undefined: ${player === undefined}`);
        idx++;
    }
    console.log(`Done polling - found player ${player.name}`);
    return player;
}

async function GetPlayerAsync(): Promise < PlayerData | undefined > {
    return await $.ajax({
        type: "GET",
        url: `/Home/GetPlayer`
    }).then(function (player: PlayerData | undefined, t) {
        if (t === "success") {
            return player;
        } else {
            return undefined;
        }
    });
}

function UpdatePlayerInfo(name: string, cash: number): void {
    $("#playerName").text(name);
    $("#playerCash").text(`$${cash}`);
}

function ResetGame(): void {
    ToggleVisibility($("#loginOverlayBackground"), true);
    $("#resultContainer").text("");
    UpdatePlayerInfo("", 0);
}

class SlotGame {
    constructor(private player: PlayerData)
    {
        this.Initialize();
    }

    private Initialize(): void {
        $(".slotContainer").each(function (e) {
            console.log(SLOT_UPPER_POSITION);
            $(this).css("top", `${SLOT_UPPER_POSITION}px`);
            AddBoxes($(this));
        })
        UpdatePlayerInfo(this.player.name, this.player.cash);
        ToggleVisibility($("#loginOverlayBackground"), false);
    }

    private async SpinSlot(slot: JQuery<HTMLElement>, prizeIcon: number, delay: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, delay));

        // at top position
        //RandomizeSlots(slot);

        console.log("Copying to lower slots");
        slot.find(`[data-index='${NUM_SLOTS - 4}']`).text(slot.find(`[data-index='${0}']`).text());
        slot.find(`[data-index='${NUM_SLOTS - 3}']`).text(slot.find(`[data-index='${1}']`).text());
        slot.find(`[data-index='${NUM_SLOTS - 2}']`).text(slot.find(`[data-index='${2}']`).text());
        slot.find(`[data-index='${NUM_SLOTS - 1}']`).text(slot.find(`[data-index='${3}']`).text());


        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Moving to lower position");
        slot.css("top", `${SLOT_LOWER_POSITION}px`);

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Randomizing remaining slots");
        for (var i = 0; i < NUM_SLOTS - 4; i++) {
            slot.find(`[data-index='${1}']`).html(getRandomIntInRange(1, NUM_ICONS).toString());
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Setting winning slot");
        const findValue = `[data-index='${1}']`;
        const prizeBox = slot.find(findValue)
        prizeBox.text(prizeIcon.toString());

        await new Promise(resolve => setTimeout(resolve, 50));
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Running animation");
        slot.addClass("animateRoll");
        slot.css("top", `${SLOT_UPPER_POSITION}px`);

        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log("Ending animation");
        slot.removeClass("animateRoll");
    }

    public async Spin(): Promise<void> {
        if (this.player === undefined) {
            return;
        }

        ToggleVisibility($("#buttonsContainer"), false);
        $("#resultContainer").text("");

        //this.player.cash -= 1;
        //await PostData("PlaceBet", { "amount": `${1}` });
        //this.player.gamesPlayed += 1;
        //UpdatePlayerInfo(this.player.name, this.player.cash);

        const prize = GeneratePrize();
        var first = this.SpinSlot($("#tallBox1"), prize.first, 1000);
        await first;
        //var second = this.SpinSlot($("#tallBox2"), prize.second, 2000);
        //var third = this.SpinSlot($("#tallBox3"), prize.third, 3000);

        //await Promise.all([first, second, third]);
        //await new Promise(resolve => setTimeout(resolve, 1000));
        //if (prize.value > 0) {
        //    $("#resultContainer").text(`Won ${prize.value}`);
        //} else {
        //    $("#resultContainer").text(`-`);
        //}
        //this.player.cash += prize.value;
        //UpdatePlayerInfo(this.player.name, this.player.cash);
        //await UpdatePlayerData(this.player);
        ToggleVisibility($("#buttonsContainer"), true);
    }
}


function ToggleVisibility(element: JQuery<HTMLElement>, visible: boolean) {
    if (visible === true) {
        element.show();
    } else {
        element.hide();
    }
}

async function PlayGame(): Promise<void> {
    ResetGame();
    let player = await PollForPlayerAsync();
    if (player.name === undefined || player.name.length === 0) {
        let name = prompt("Enter your name");
        if (name === undefined || name.length === 0) {
            location.reload();
        }
        player.name = name;
        await UpdatePlayerData(player);
    }
    let game = new SlotGame(player);
    $("#spinButton").on("click", async function (e) {
        await game.Spin();
    });
}

PlayGame();
$("#quitButton").on("click", async function (e) {
    await PlayGame();
});

