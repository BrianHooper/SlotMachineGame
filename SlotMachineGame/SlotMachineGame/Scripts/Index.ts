const BET_AMOUNT = -1;
const NUM_ICONS = 5;
const NUM_SLOTS = 50;
const SLOT_HEIGHT = 200;
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
            .html(CreateImage(getRandomIntInRange(1, NUM_ICONS)))
            .appendTo(module);
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
            return GetCurrentPlayerAsync();
        });
        console.log(`idx: ${idx}, player === undefined: ${player === undefined}`);
        idx++;
    }
    console.log(`Done polling - found player ${player.name}`);
    return player;
}

async function GetCurrentPlayerAsync(): Promise < PlayerData | undefined > {
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

async function ExchangeMoneyAsync(player: PlayerData, amount: number): Promise<PlayerData | undefined> {
    let data = { "id": player.id, "amount": amount.toString() };
    return await $.ajax({
        type: "POST",
        url: `/Home/ExchangeMoney`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
        //dataType: "json",
        //success: function (response: PlayerData | undefined, x, t) {
        //    alert(response);
        //}
    }).then(function (result: PlayerData | undefined, t) {
        if (t === "success") {
            return result;
        } else {
            return undefined;
        }
    }).catch(function (x, t) {
        console.log(x);
        return undefined;
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

function CreateImage(index: number): string {
    return `<img src="/images/${index}.jpg" />`;
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

        slot.find(`[data-index='${NUM_SLOTS - 4}']`).html(slot.find(`[data-index='${0}']`).html());
        slot.find(`[data-index='${NUM_SLOTS - 3}']`).html(slot.find(`[data-index='${1}']`).html());
        slot.find(`[data-index='${NUM_SLOTS - 2}']`).html(slot.find(`[data-index='${2}']`).html());
        slot.find(`[data-index='${NUM_SLOTS - 1}']`).html(slot.find(`[data-index='${3}']`).html());

        slot.css("top", `${SLOT_LOWER_POSITION}px`);

        for (var i = 0; i < NUM_SLOTS - 4; i++) {
            slot.find(`[data-index='${1}']`).html(getRandomIntInRange(1, NUM_ICONS).toString());
        }

        const findValue = `[data-index='${1}']`;
        const prizeBox = slot.find(findValue)
        prizeBox.html(CreateImage(prizeIcon));

        await $.when(
            slot.animate({
                top: `${SLOT_UPPER_POSITION}px`
            }, {
                duration: 5000,
                specialEasing: {
                    width: "linear",
                    height: "easeOutBounce"
                }
            })
        );

        $(this).css("top", `${SLOT_UPPER_POSITION}px`);
    }

    public async Spin(): Promise<void> {
        $("#resultContainer").text("");

        if (this.player === undefined) {
            return;
        }

        if (this.player.cash + BET_AMOUNT < 0) {
            console.log("Not enough money to place bet!");
            return;
        }

        ToggleVisibility($("#buttonsContainer"), false);

        let updatedPlayerData = await ExchangeMoneyAsync(this.player, BET_AMOUNT);
        if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
            console.log("ExchangeMoneyAsync error!");
            return;
        }

        this.player = updatedPlayerData;
        UpdatePlayerInfo(this.player.name, this.player.cash);

        const prize = GeneratePrize();
        var first = this.SpinSlot($("#tallBox1"), prize.first, 1000);
        var second = this.SpinSlot($("#tallBox2"), prize.second, 2000);
        var third = this.SpinSlot($("#tallBox3"), prize.third, 3000);

        await Promise.all([first, second, third]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (prize.value > 0) {
            updatedPlayerData = await ExchangeMoneyAsync(this.player, prize.value);
            if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
                console.log("ExchangeMoneyAsync error!");
                return;
            }
            this.player = updatedPlayerData;
            $("#resultContainer").text(`Won ${prize.value}`);
        } else {
            $("#resultContainer").text(`-`);
        }

        UpdatePlayerInfo(this.player.name, this.player.cash);
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
    if (player.id === "0000") {
        location.href = "/Home/Editor";
    }
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

