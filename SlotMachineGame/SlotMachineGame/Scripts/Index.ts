const NUM_ICONS = 5;
const NUM_SLOTS = 50;

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

async function UpdatePlayerData(playerData: PlayerData): Promise<boolean> {
    let jsonText = JSON.stringify(playerData);

    return await $.ajax({
        type: "POST",
        url: `/Home/UpdatePlayerData`,
        contentType: "application/json; charset=utf-8",
        data: jsonText
    }).then(function (x, t) {
        if (t === "success") {
            return true;
        } else {
            return false;
        }
    }).catch(function (e) {
        return false;
    });
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
            AddBoxes($(this));
        })
        UpdatePlayerInfo(this.player.name, this.player.cash);
        ToggleVisibility($("#loginOverlayBackground"), false);
    }

    private async SpinSlot(slot: JQuery<HTMLElement>, prizeIcon: number, delay: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, delay));
        slot.addClass("hideBoxes");
        slot.removeClass("animateRoll");
        RandomizeSlots(slot);

        const findValue = `[data-index='${1}']`;
        const prizeBox = slot.find(findValue)
        prizeBox.text(prizeIcon.toString());

        await new Promise(resolve => setTimeout(resolve, 50));
        slot.removeClass("hideBoxes");
        slot.addClass("animateRoll");

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    public async Spin(): Promise<void> {
        if (this.player === undefined) {
            return;
        }
        ToggleVisibility($("#buttonsContainer"), false);
        $("#resultContainer").text("");
        const prize = GeneratePrize();
        this.player.cash -= 1;
        this.player.gamesPlayed += 1;
        UpdatePlayerInfo(this.player.name, this.player.cash);

        var first = this.SpinSlot($("#tallBox1"), prize.first, 1000);
        var second = this.SpinSlot($("#tallBox2"), prize.second, 2000);
        var third = this.SpinSlot($("#tallBox3"), prize.third, 3000);

        await Promise.all([first, second, third]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (prize.value > 0) {
            $("#resultContainer").text(`Won ${prize.value}`);
        } else {
            $("#resultContainer").text(`-`);
        }
        this.player.cash += prize.value;
        UpdatePlayerInfo(this.player.name, this.player.cash);
        await UpdatePlayerData(this.player);
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

