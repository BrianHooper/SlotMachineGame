import { getRandomIntInRange, Colors } from "./SlotConstants.js";
import { Slot } from "./SlotController.js";

const BET_AMOUNT = -1;
const SLOT_ROWS = 4;
const SLOT_COLS = 5;

class WinLine {
    public Points: number[][];
    public Offset: number;

    constructor(offset: number, points: number[][]) {
        this.Offset = offset;
        this.Points = points;
    }
}


const Lines: WinLine[] = [
    new WinLine(0, [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]),
    new WinLine(0, [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]]),
    new WinLine(0, [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]]),
    new WinLine(0, [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]]),

    new WinLine(10, [[0, 0], [1, 1], [0, 2], [1, 3], [0, 4]]),
    new WinLine(-10, [[1, 0], [0, 1], [1, 2], [0, 3], [1, 4]]),
    new WinLine(10, [[1, 0], [2, 1], [1, 2], [2, 3], [1, 4]]),
    new WinLine(-10, [[2, 0], [1, 1], [2, 2], [1, 3], [2, 4]]),
    new WinLine(10, [[2, 0], [3, 1], [2, 2], [3, 3], [2, 4]]),
    new WinLine(-10, [[3, 0], [2, 1], [3, 2], [2, 3], [3, 4]]),
];

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

class SlotGame {
    private Slots: Slot[];
    private NumLines: number;

    constructor(private player: PlayerData)
    {
        $("#slotsContainer").css("grid-template-columns", `repeat(${SLOT_COLS}, 1fr)`);
        $("#slotsContainer").css("grid-template-rows", `repeat(${SLOT_ROWS}, 1fr)`);
        $("#slotsContainer").empty();

        this.Slots = new Array(SLOT_ROWS * SLOT_COLS)
        for (let rIdx = 0; rIdx < SLOT_ROWS; rIdx++) {
            for (let cIdx = 0; cIdx < SLOT_COLS; cIdx++) {
                this.Slots[rIdx * SLOT_COLS + cIdx] = new Slot($("#slotsContainer"), rIdx, cIdx);
            }
        }

        this.SetLines($("#lines4Button"), 4, false);
        UpdatePlayerInfo(this.player.name, this.player.cash);
        ToggleVisibility($("#loginOverlayBackground"), false);
    }

    public async Spin(): Promise<void> {
        this.ResetContext();
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

        const results = await Promise.all(this.Slots.map(v => v.Spin()));
        const winnings = await this.CalculateWinnings();

        await new Promise(resolve => setTimeout(resolve, 1000));
        if (winnings > 0) {
            updatedPlayerData = await ExchangeMoneyAsync(this.player, winnings);
            if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
                console.log("ExchangeMoneyAsync error!");
                return;
            }
            this.player = updatedPlayerData;
            $("#resultContainer").text(`Won ${winnings}`);
        } else {
            $("#resultContainer").text(`-`);
        }

        UpdatePlayerInfo(this.player.name, this.player.cash);
        ToggleVisibility($("#buttonsContainer"), true);
    }

    private DrawLine(index: number, line: WinLine, context: CanvasRenderingContext2D): void {
        for (let i = 0; i < line.Points.length - 1; i++) {
            const startPoint = line.Points[i];
            const endPoint = line.Points[i + 1];
            const startSlot = this.Slots[startPoint[0] * SLOT_COLS + startPoint[1]].CenterPosition();
            const endSlot = this.Slots[endPoint[0] * SLOT_COLS + endPoint[1]].CenterPosition();
            context.beginPath();
            context.moveTo(startSlot.left, startSlot.top + line.Offset);
            context.lineTo(endSlot.left, endSlot.top + line.Offset);
            context.lineWidth = 10;
            context.lineCap = "round";
            context.strokeStyle = Colors[index];
            context.stroke();
        }
    }

    private ResetContext(): CanvasRenderingContext2D {
        const canvasWidth = $("#slotsContainer").width();
        const canvasHeight = $("#slotsContainer").height();
        $("#linesCanvas").attr("width", `${canvasWidth}px`);
        $("#linesCanvas").attr("height", `${canvasHeight}px`);
        const canvas = $("#linesCanvas").get(0) as HTMLCanvasElement;
        const context = canvas.getContext("2d");
        context.reset();
        return context;
    }

    private DrawLines(): void {

        const context = this.ResetContext();
        Lines.slice(0, this.NumLines).forEach((line, index) => this.DrawLine(index, line, context));
    }

    public SetLines(button: JQuery<HTMLElement>, numLines: number, draw: boolean) {
        this.ResetContext();
        this.NumLines = numLines;

        $(".linesButton").each(function () {
            $(this).removeClass("glow");
        });
        button.addClass("glow");
        if (draw) {
            this.DrawLines();
        }
    }

    private async CalculateWinnings(): Promise<number> {
        const lines = Lines.slice(0, this.NumLines);
        let winnings = 0;
        for (let i = 0; i < lines.length; i++) {
            const iconList = this.ToIconList(lines[i]);
            const winAmount = this.CalculateWin(iconList);
            if (winAmount > 0) {
                winnings += winAmount;
                $("#resultContainer").text(`Won ${winnings}`);
                const context = this.ResetContext();
                this.DrawLine(i, lines[i], context);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        this.ResetContext();
        return winnings;


        //const results = Lines.slice(0, this.NumLines).map(line => this.ToIconList(line));
        //const winnings = results.map(result => this.CalculateWin(result));
        //const sum = winnings.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        //return sum;
    }

    private ToIconList(line: WinLine): number[] {
        return line.Points.map(pair => {
            return this.Slots[pair[0] * SLOT_COLS + pair[1]].Result()
        });
    }

    private CalculateWin(result: number[]): number {
        const start = result[0];
        for (let i = 1; i < result.length; i++) {
            if (start !== result[i]) {
                return 0;
            }
        }
        return 10;
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
    $("#lines4Button").on("click", function (e) {
        game.SetLines($(this), 4, true);
    });
    $("#lines8Button").on("click", function (e) {
        game.SetLines($(this), 10, true);
    });
    $("#lines12Button").on("click", function (e) {
        game.SetLines($(this), 12, true);
    });
}

PlayGame();
$("#quitButton").on("click", async function (e) {
    await PlayGame();
});

