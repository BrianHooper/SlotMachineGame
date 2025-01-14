import { Colors, PostData } from "./SlotConstants.js";
import { Slot } from "./SlotController.js";
import { SlotIcon, SlotList } from "./SlotIcon.js"
import { PlayerData, PollForPlayerAsync, GetCurrentPlayerAsync } from "./PlayerHandler.js";

interface Prize {
    amount: number,
    length: number
}

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

    new WinLine(0, [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]]),
    new WinLine(0, [[1, 0], [2, 1], [3, 2], [2, 3], [1, 4]]),
    new WinLine(0, [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4]]),
    new WinLine(0, [[3, 0], [2, 1], [1, 2], [2, 3], [3, 4]]),

    new WinLine(10, [[0, 0], [1, 1], [0, 2], [1, 3], [0, 4]]),
    new WinLine(-10, [[1, 0], [0, 1], [1, 2], [0, 3], [1, 4]]),
    new WinLine(10, [[1, 0], [2, 1], [1, 2], [2, 3], [1, 4]]),
    new WinLine(-10, [[2, 0], [1, 1], [2, 2], [1, 3], [2, 4]]),
    new WinLine(10, [[2, 0], [3, 1], [2, 2], [3, 3], [2, 4]]),
    new WinLine(-10, [[3, 0], [2, 1], [3, 2], [2, 3], [3, 4]]),

    new WinLine(20, [[0, 0], [1, 1], [1, 2], [1, 3], [0, 4]]),
    new WinLine(20, [[1, 0], [2, 1], [2, 2], [2, 3], [1, 4]]),
    new WinLine(20, [[2, 0], [3, 1], [3, 2], [3, 3], [2, 4]]),
    new WinLine(-20, [[1, 0], [0, 1], [0, 2], [0, 3], [1, 4]]),
    new WinLine(-20, [[2, 0], [1, 1], [1, 2], [1, 3], [2, 4]]),
    new WinLine(-20, [[3, 0], [2, 1], [2, 2], [2, 3], [3, 4]]),
];


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

function UpdatePlayerInfo(name: string, cash: number, bet: number): void {
    $("#playerName").text(name);
    $("#playerCash").text(`$${cash}`);
    $("#playerBet").text(`$${bet}`);
}

async function SendQuitGameSignal() {
    return await $.ajax({
        type: "GET",
        url: `/Home/ResetPlayer`,
        contentType: "application/json; charset=utf-8"
    });
}

class SlotGame {
    private Slots: Slot[];
    private NumLines: number;

    constructor(private player: PlayerData)
    {
        $("#resultContainer").text("");
        UpdatePlayerInfo("", 0, 0);
        $("#slotsContainer").css("grid-template-columns", `repeat(${SLOT_COLS}, 1fr)`);
        $("#slotsContainer").css("grid-template-rows", `repeat(${SLOT_ROWS}, 1fr)`);
        $("#slotsContainer").empty();

        this.Slots = new Array(SLOT_ROWS * SLOT_COLS)
        for (let rIdx = 0; rIdx < SLOT_ROWS; rIdx++) {
            for (let cIdx = 0; cIdx < SLOT_COLS; cIdx++) {
                this.Slots[rIdx * SLOT_COLS + cIdx] = new Slot($("#slotsContainer"), rIdx, cIdx);
            }
        }

        this.SetLines($("#lines4Button"), false);
        UpdatePlayerInfo(this.player.name, this.player.cash, this.NumLines);
        ToggleVisibility($("#loginOverlayBackground"), false);
        $("#slotPageContainer").removeClass("hidden");
    }

    public async Spin(): Promise<void> {
        this.ResetContext();
        $("#resultContainer").text("");

        if (this.player === undefined) {
            return;
        }

        const betAmount = -1 * this.NumLines;
        if (this.player.cash + betAmount < 0) {
            console.log("Not enough money to place bet!");
            return;
        }

        ToggleVisibility($("#buttonsContainer"), false);
        let dataUpdatePromise = ExchangeMoneyAsync(this.player, betAmount);
        for (let i = 1; i <= -1 * betAmount; i++) {
            UpdatePlayerInfo(this.player.name, this.player.cash - i, this.NumLines);
            await new Promise(resolve => setTimeout(resolve, 25));
        }

        let updatedPlayerData = await dataUpdatePromise;
        if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
            console.log("ExchangeMoneyAsync error!");
            return;
        }

        this.player = updatedPlayerData;
        UpdatePlayerInfo(this.player.name, this.player.cash, this.NumLines);

        const results = await Promise.all(this.Slots.map(v => v.Spin()));
        const winnings = await this.CalculateWinnings();

        if (winnings > 0) {
            $("#resultContainer").text(`Won ${winnings}`);
            updatedPlayerData = await ExchangeMoneyAsync(this.player, winnings);
            if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
                console.log("ExchangeMoneyAsync error!");
                return;
            }

            this.player = updatedPlayerData;

        } else {
            $("#resultContainer").text(`-`);
        }

        UpdatePlayerInfo(this.player.name, this.player.cash, this.NumLines);
        ToggleVisibility($("#buttonsContainer"), true);
    }

    private DrawLine(index: number, line: WinLine, context: CanvasRenderingContext2D, length: number): void {
        for (let i = 0; i < length - 1; i++) {
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
        Lines.slice(0, this.NumLines).forEach((line, index) => this.DrawLine(index, line, context, line.Points.length));
    }

    public SetLines(button: JQuery<HTMLElement>, draw: boolean) {
        this.ResetContext();
        const numLines = parseInt(button.attr("data-lines"));
        this.NumLines = numLines;
        UpdatePlayerInfo(this.player.name, this.player.cash, this.NumLines);

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
        const context = this.ResetContext();
        let winnings = 0;
        for (let i = 0; i < lines.length; i++) {
            const iconList = this.ToIconList(lines[i]);
            const prize = this.CalculateWin(iconList);
            if (prize.amount > 0) {                
                this.DrawLine(i, lines[i], context, prize.length);
                for (let c = 0; c < prize.amount; c++) {
                    winnings += 1;
                    UpdatePlayerInfo(this.player.name, this.player.cash + winnings, this.NumLines);
                    $("#resultContainer").text(`Won ${winnings}`);
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            }
        }
        return winnings;
    }

    private ToIconList(line: WinLine): SlotIcon[] {
        return line.Points.map(pair => {
            return this.Slots[pair[0] * SLOT_COLS + pair[1]].Result()
        });
    }

    private CalculateWin(line: SlotIcon[]): Prize {
        let specialWinFirst = this.IsSpecialWin(SlotList[11], line, new Set());
        if (specialWinFirst.amount > 0) {
            return specialWinFirst;
        }

        let specialWinSecond = this.IsSpecialWin(SlotList[10], line, new Set([12]));
        if (specialWinSecond.amount > 0) {
            return specialWinSecond;
        }

        let wildcards = new Set([11, 12]);
        let prizeIcon = line.filter(s => !wildcards.has(s.Index))[0];
        let matchingCount = this.CountMatching(prizeIcon, line, wildcards);
        
        if (matchingCount === 3) {
            return {
                amount: prizeIcon.Value3,
                length: 3
            };
        } else if (matchingCount === 4) {
            return {
                amount: prizeIcon.Value4,
                length: 4
            };
        } else if (matchingCount === 5) {
            return {
                amount: prizeIcon.Value5,
                length: 5
            };
        }

        return {
            amount: 0,
            length: 0
        };
    }

    private IsSpecialWin(first: SlotIcon, line: SlotIcon[], wildcards: Set<number>): Prize {

        if (line[0].Index !== first.Index) {
            return {
                amount: 0,
                length: 0
            };
        }

        let matchingCount = this.CountMatching(first, line, new Set())
        if (matchingCount === 3) {
            return {
                amount: first.Value3,
                length: 3
            };
        } else if (matchingCount === 4) {
            return {
                amount: first.Value4,
                length: 4
            };
        } else if (matchingCount === 5) {
            return {
                amount: first.Value5,
                length: 5
            };
        } else {
            return {
                amount: 0,
                length: 0
            };
        }
    }

    private CountMatching(first: SlotIcon, line: SlotIcon[], wildcards: Set<number>) {
        let idx = 0;
        while (idx < line.length && (wildcards.has(line[idx].Index) || first.Index === line[idx].Index)) {
            idx++;
        }
        return idx;
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
    let player = await GetCurrentPlayerAsync();
    if (player === null || player === undefined) {
        ToggleVisibility($("#loginOverlayBackground"), true);
        $("#slotPageContainer").removeClass("hidden");
        player = await PollForPlayerAsync();
    }

    if (player === null || player === undefined) {
        location.reload();
    }

    if (player.name === null || player.name === undefined || player.name.length === 0) {
        location.href = `/Home/NameEditor?id=${player.id}`;
    } else {
        let game = new SlotGame(player);
        $("#spinButton").on("click", async function (e) {
            await game.Spin();
        });

        $(".linesButton").each(function () {
            $(this).on("click", async function (e) {
                game.SetLines($(this), true);
            });
        });
    }
}


PlayGame();
$("#quitButton").on("click", async function (e) {
    await SendQuitGameSignal();
    location.reload();
});

