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
    name: string
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
    for (var i = 0; i < NUM_SLOTS; i++) {
        jQuery("<div/>", { "class": "innerBox", "data-index": i.toString() })
            .html(getRandomIntInRange(1, NUM_ICONS).toString())
            .appendTo(module);
    }
}

function RandomizeSlots(module: JQuery<HTMLElement>) {
    for (var i = 0; i < NUM_SLOTS - 2; i++) {
        jQuery("<div/>", { "class": "innerBox", "data-index": i.toString() })
            .html(getRandomIntInRange(1, NUM_ICONS).toString())
            .appendTo(module);
    }
}

class SlotGame {
    private player: PlayerData | undefined = undefined;

    public SlotGame() {
        $(".slotContainer").each(function (e) {
            AddBoxes($(this));
        })
    }

    private async UpdatePlayerData(playerData: PlayerData) {
        var jsonText = JSON.stringify(playerData);

        $.ajax({
            type: "POST",
            url: `/Home/UpdatePlayerData`,
            contentType: "application/json; charset=utf-8",
            data: jsonText,
            dataType: "json",
            success: function (response) {
                alert(response);
            }
        });
    }

    public async PollForPlayerAsync() {
        this.player = undefined;
        ToggleVisibility($("#loginOverlayBackground"), true);
        $("#resultContainer").text("");
        console.log(`Start polling`);
        var idx = 0;
        while (this.player === undefined) {
            this.player = await new Promise(resolve => setTimeout(resolve, 500)).then(() => {
                return this.GetPlayerAsync();
            });
            console.log(`idx: ${idx}, player === undefined: ${this.player === undefined}`);
            idx++;
        }
        console.log(`Done polling - found player ${this.player.name}`);
        this.UpdatePlayerInfo();
        ToggleVisibility($("#loginOverlayBackground"), false);
    }

    private async GetPlayerAsync(): Promise<PlayerData | undefined> {
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

    private async SpinSlot(slot: JQuery<HTMLElement>, prizeIcon: number, delay: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, delay));
        slot.addClass("hideBoxes");
        slot.removeClass("animateRoll");
        AddBoxes(slot);

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
        this.UpdatePlayerInfo();

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
        this.UpdatePlayerInfo();
        await this.UpdatePlayerData(this.player);
        ToggleVisibility($("#buttonsContainer"), true);
    }

    private UpdatePlayerInfo(): void {
        $("#playerName").text(this.player.name);
        $("#playerCash").text(`$${this.player.cash}`);
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
    let game = new SlotGame();
    await game.PollForPlayerAsync();
    $("#quitButton").on("click", async function (e) {
        await game.PollForPlayerAsync();
    });
    $("#spinButton").on("click", async function (e) {
        await game.Spin();
    });
}
PlayGame();
