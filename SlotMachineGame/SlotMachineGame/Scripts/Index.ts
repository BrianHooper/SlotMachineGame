import { Colors, PostData, ADMIN_ID } from "./SlotConstants.js";
import { Slot } from "./SlotController.js";
import { SlotIcon, SlotList } from "./SlotIcon.js"
import { PlayerData, PollForPlayerAsync, GetCurrentPlayerAsync, PollForPlayerWithCancelAsync } from "./PlayerHandler.js";

interface Prize {
    amount: number,
    length: number,
    line: WinLine
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

const WinLines: WinLine[] = [
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


async function ExchangeMoneyAsync(player: PlayerData, amount: number, transactionType: string): Promise<PlayerData | undefined> {
    let data = { "id": player.id, "amount": amount.toString(), "type": transactionType };
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

async function SendQuitGameSignal() {
    return await $.ajax({
        type: "GET",
        url: `/Home/ResetPlayer`,
        contentType: "application/json; charset=utf-8"
    });
}

async function GetAllPlayerDataAsync(): Promise<PlayerData[] | null> {
    return await $.ajax({
        type: "GET",
        url: `/Home/GetAllPlayerData`
    }).then(function (data: PlayerData[] | null, t, xhr) {
        if (xhr !== null && xhr !== undefined && xhr.status === 200) {
            return data;
        } else {
            return null;
        }
    }).catch(_ => {
        return null;
    });
}

class SlotGame {
    private Slots: Slot[];
    private NumLines: number;

    constructor(private player: PlayerData)
    {
        $("#resultContainer").text("");
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
        this.UpdatePlayerInfo();
    }

    public async Start() {
        $("#loginOverlayBackground").addClass("hidden");
        $("#slotPageContainer").removeClass("hidden");
        if (this.player.name === null || this.player.name === undefined || this.player.name.length === 0) {
            await this.ShowNameInput();
        }

        this.ToggleBetAmountButtons(this.player);
    }

    public UpdatePlayerInfo(cash: Number = this.player.cash): void {
        $("#playerName").text(this.player.name);
        $("#playerCash").text(`$${cash}`);
        $("#playerBet").text(`$${this.NumLines}`);
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

        $("#buttonsContainer").addClass("hidden");
        $("#editNameButton").addClass("hidden");
        $("#spinButton").addClass("hidden");
        let dataUpdatePromise = ExchangeMoneyAsync(this.player, betAmount, "bet");
        for (let i = 1; i <= -1 * betAmount; i++) {
            this.UpdatePlayerInfo(this.player.cash - i);
            await new Promise(resolve => setTimeout(resolve, 25));
        }

        let updatedPlayerData = await dataUpdatePromise;
        if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
            console.log("ExchangeMoneyAsync error!");
            return;
        }

        this.player = updatedPlayerData;
        this.UpdatePlayerInfo();

        const results = await Promise.all(this.Slots.map(v => v.Spin()));
        const winnings = await this.CalculateWinnings();

        if (winnings > 0) {
            $("#resultContainer").text(`Won ${winnings}`);
            updatedPlayerData = await ExchangeMoneyAsync(this.player, winnings, "win");
            if (updatedPlayerData === undefined || updatedPlayerData.name === undefined) {
                console.log("ExchangeMoneyAsync error!");
                return;
            }

            this.player = updatedPlayerData;

        } else {
            $("#resultContainer").text(`-`);
        }

        this.UpdatePlayerInfo();
        this.ToggleBetAmountButtons(this.player);
        $("#editNameButton").removeClass("hidden");
        $("#buttonsContainer").removeClass("hidden");
    }

    private ToggleBetAmountButtons(player: PlayerData): void {
        $(".linesButton").each(function () {
            const lineCount = parseInt($(this).attr("data-lines"));
            if (player.cash < lineCount) {
                $(this).addClass("hidden");
            } else {
                $(this).removeClass("hidden");
            }
        });

        if (this.NumLines > player.cash) {
            const game = this;
            game.NumLines = 4;
            $(".linesButton").each(function () {
                const lineCount = parseInt($(this).attr("data-lines"));
                if (player.cash >= lineCount && lineCount >= game.NumLines) {
                    $(this).trigger("click");
                    game.ResetContext();
                }
            });
        }

        if (player.cash < 4) {
            $("#spinButton").addClass("hidden");
        } else {
            $("#spinButton").removeClass("hidden");
        }
    }

    private DrawLine(index: number, line: WinLine, context: CanvasRenderingContext2D, length: number): void {
        console.log(`Drawing line: ${index}, ${length}`)
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

    private DrawPrizeLine(index: number, prize: Prize, context: CanvasRenderingContext2D): void {
        this.DrawLine(index, prize.line, context, prize.length);
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
        WinLines.slice(0, this.NumLines).forEach((line, index) => this.DrawLine(index, line, context, line.Points.length));
    }

    public SetLines(button: JQuery<HTMLElement>, draw: boolean) {
        this.ResetContext();
        const numLines = parseInt(button.attr("data-lines"));
        this.NumLines = numLines;
        this.UpdatePlayerInfo();

        $(".linesButton").each(function () {
            $(this).removeClass("glow");
        });
        button.addClass("glow");
        if (draw) {
            this.DrawLines();
        }
    }

    private async SpinIcons(index: number, prize: Prize, context: CanvasRenderingContext2D) {
        const now = new Date();
        //console.log(`Starting spin: ${now.getSeconds()}.${now.getMilliseconds()}, amount: ${prize.amount}, length: ${prize.length}`); 
        for (let i = 0; i < prize.length; i++) {
            const point = prize.line.Points[i];
            const slot = this.Slots[point[0] * SLOT_COLS + point[1]];
            slot.Rotate();
        }
        this.DrawPrizeLine(index, prize, context);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    private async CalculateWinnings(): Promise<number> {
        const lines = WinLines.slice(0, this.NumLines);
        const context = this.ResetContext();

        const prizes = lines.map(l => this.CalculatePrize(l));
        const winningPrizes = prizes.filter(p => p.amount > 0);
        const total = winningPrizes.map(p => p.amount).reduce((partialSum, a) => partialSum + a, 0);

        if (total === 0) {
            return 0;
        }

        var prizeAmount = 0;
        for (let i = 0; i < winningPrizes.length; i++) {
            console.log(`Prize: ${prizeAmount}`);
            await Promise.all([
                this.SpinIcons(i, winningPrizes[i], context),
                this.ShowWinningsAmount(prizeAmount, prizeAmount + winningPrizes[i].amount)
            ]);
            prizeAmount += winningPrizes[i].amount;

        }
        
        return total;
    }

    private CalculatePrize(line: WinLine): Prize {
        const iconList = this.ToIconList(line);
        const prize = this.CalculateWin(line, iconList);
        return prize;
    }

    private async ShowWinningsAmount(start: number, end: number) {
        for (let c = start; c <= end; c++) {
            this.UpdatePlayerInfo(this.player.cash + c);
            $("#resultContainer").text(`Won ${c}`);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    private ToIconList(line: WinLine): SlotIcon[] {
        return line.Points.map(pair => {
            return this.Slots[pair[0] * SLOT_COLS + pair[1]].Result()
        });
    }

    private CalculateWin(line: WinLine, slots: SlotIcon[]): Prize {
        let specialWinFirst = this.IsSpecialWin(line, SlotList[11], slots, new Set());
        if (specialWinFirst.amount > 0) {
            return specialWinFirst;
        }

        let specialWinSecond = this.IsSpecialWin(line, SlotList[10], slots, new Set([12]));
        if (specialWinSecond.amount > 0) {
            return specialWinSecond;
        }

        let wildcards = new Set([11, 12]);
        let prizeIcon = slots.filter(s => !wildcards.has(s.Index))[0];
        let matchingCount = this.CountMatching(prizeIcon, slots, wildcards);
        
        if (matchingCount === 3) {
            return {
                amount: prizeIcon.Value3,
                length: 3,
                line: line
            };
        } else if (matchingCount === 4) {
            return {
                amount: prizeIcon.Value4,
                length: 4,
                line: line
            };
        } else if (matchingCount === 5) {
            return {
                amount: prizeIcon.Value5,
                length: 5,
                line: line
            };
        }

        return {
            amount: 0,
            length: 0,
            line: line
        };
    }

    private IsSpecialWin(line: WinLine, first: SlotIcon, slots: SlotIcon[], wildcards: Set<number>): Prize {

        if (slots[0].Index !== first.Index) {
            return {
                amount: 0,
                length: 0,
                line: line
            };
        }

        let matchingCount = this.CountMatching(first, slots, new Set())
        if (matchingCount === 3) {
            return {
                amount: first.Value3,
                length: 3,
                line: line
            };
        } else if (matchingCount === 4) {
            return {
                amount: first.Value4,
                length: 4,
                line: line
            };
        } else if (matchingCount === 5) {
            return {
                amount: first.Value5,
                length: 5,
                line: line
            };
        } else {
            return {
                amount: 0,
                length: 0,
                line: line
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

    public async AddCash(): Promise<void> {
        $("#AddCashContainer").removeClass("hidden");

        const game = this;
        const ac = new AbortController();
        const signal = ac.signal;

        return await new Promise(async resolveCashWindow => {
            $("#ReturnHome").off().on("click", async function (e) {
                ac.abort();
                $("#AddCashContainer").addClass("hidden");
                resolveCashWindow();
            });

            let admin: PlayerData = null;
            while (!ac.signal.aborted) {
                admin = await PollForPlayerWithCancelAsync(signal);

                if (IsValidAdmin(admin)) {
                    ac.abort();
                    this.player = await ExchangeMoneyAsync(this.player, 200, "add");
                    this.UpdatePlayerInfo();
                    this.ToggleBetAmountButtons(this.player);
                    $("#AddCashContainer").addClass("hidden");
                    resolveCashWindow();
                }
            }
        });




    }

    private async UpdatePlayerName(): Promise<void> {
        const name = $("#NameText").text().trim();
        if ($("#submitButton").hasClass("inactive") || name.length === 0) {
            return;
        }
        this.player.name = name;
        await PostData("SetPlayerName", { "id": this.player.id, "name": name });
        this.UpdatePlayerInfo();
    }

    public async ShowNameInput(): Promise<void> {
        let game = this;
        if (game.player !== null && game.player !== undefined && game.player.name !== null && game.player.name !== undefined && game.player.name.length > 0) {
            $("#NameText").text(game.player.name);
        }
        ToggleNameButtonVisibility();
        $("#NameBackground").removeClass("hidden");

        $("#backspaceButton").off().on("click", function (e) {
            const name = $("#NameText").text().trim();
            if ($("#backspaceButton").hasClass("inactive") || name.length === 0) {
                return;
            }
            $("#NameText").text(name.substring(0, name.length - 1));
            ToggleNameButtonVisibility();
        });

        $("#spaceButton").off().on("click", function (e) {
            const name = $("#NameText").text().trim() + " ";
            $("#NameText").text(name);
            ToggleNameButtonVisibility();
        });

        $(".standardButton").each(function () {
            const letter = $(this).text().trim();
            $(this).off().on("click", function (e) {
                const name = $("#NameText").text() + letter;
                $("#NameText").text(name);
                ToggleNameButtonVisibility();
            });
        });

        return await new Promise(resolveButtonClick => {
            $("#submitButton").off().on("click", async function (e) {
                await game.UpdatePlayerName();
                $("#NameBackground").addClass("hidden");
                resolveButtonClick();
            });
        });
    }

    public async ShowPayTable(): Promise<void> {
        $("#payTableBackground").removeClass("hidden");
        return await new Promise(resolveButtonClick => {
            $("#exitPayTableButton").off().on("click", async function (e) {
                $("#payTableBackground").addClass("hidden");
                resolveButtonClick();
            });
        });
    }

    private AddAdminResultsRow(name: string, cash: string, gamesPlayed: string, totalSpent: string, totalWon: string) {
        var rowDiv = jQuery("<div/>")
            .addClass("adminRow")
            .appendTo($("#AdminResultsBox"));

        var nameDiv = jQuery("<div/>")
            .addClass("adminResultsCol")
            .text(name)
            .appendTo(rowDiv);

        var cashDiv = jQuery("<div/>")
            .addClass("adminResultsCol")
            .text(cash)
            .appendTo(rowDiv);

        var gamesDiv = jQuery("<div/>")
            .addClass("adminResultsCol")
            .text(gamesPlayed)
            .appendTo(rowDiv);

        var spentDiv = jQuery("<div/>")
            .addClass("adminResultsCol")
            .text(totalSpent)
            .appendTo(rowDiv);

        var wonDiv = jQuery("<div/>")
            .addClass("adminResultsCol")
            .text(totalWon)
            .appendTo(rowDiv);
    }

    private AddToAdminResults(player: PlayerData) {
        let cash = "-";
        if (player.cash > 0) {
            cash = "$" + player.cash.toString();
        }
        let games = "-";
        if (player.gamesPlayed > 0) {
            games = player.gamesPlayed.toString();
        }
        let spent = "-";
        if (player.totalSpent !== 0) {
            spent = "$" + player.totalSpent.toString();
        }
        let won = "-";
        if (player.totalWon !== 0) {
            won = "$" + player.totalWon.toString();
        }
        this.AddAdminResultsRow(player.name, cash, games, spent, won);
    }

    public async ShowAdmin(): Promise<void> {
        $("#AdminOverlay").removeClass("hidden");
        $("#AdminContainer").removeClass("hidden");

        const game = this;
        const ac = new AbortController();
        const signal = ac.signal;

        await new Promise(async closeAdminWindow => {
            $("#AdminReturnHomeButton").off().on("click", async function (e) {
                ac.abort();
                closeAdminWindow(this);
                console.log("RETURN button");
            });

            let admin: PlayerData = null;
            let isAdmin: boolean = false;
            while (!ac.signal.aborted && !isAdmin) {
                admin = await PollForPlayerWithCancelAsync(signal);
                isAdmin = IsValidAdmin(admin);
            }

            if (!isAdmin) {
                closeAdminWindow(this);
                console.log("RETURN !isadmin");
                return;
            }

            $("#AdminOverlay").addClass("hidden");
            let allPlayerData = await GetAllPlayerDataAsync();
            if (allPlayerData === null || allPlayerData === undefined || allPlayerData.length === 0) {
                closeAdminWindow(this);
                console.log("RETURN");
                return;
            }

            let players = allPlayerData.filter(p =>
                p !== null
                && p !== undefined
                && p.gamesPlayed > 0
                && p.name !== null
                && p.name !== undefined
                && p.name.length > 0);

            if (players.length === 0) {
                closeAdminWindow(this);
                console.log("RETURN");
                return;
            }

            players.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
            this.AddAdminResultsRow("Name", "Cash", "Spins", "Spent", "Won");
            for (let idx = 0; idx < players.length; idx++) {
                const player = players[idx];
                this.AddToAdminResults(player);
            }

            $("#AdminResults").removeClass("hidden");
            $("#AdminCloseResults").off().on("click", async function (e) {
                closeAdminWindow(this);
                console.log("RETURN button");
            });
        });

        console.log("exit method");
        $("#AdminResultsBox").empty();
        $("#AdminContainer").addClass("hidden");
        $("#AdminResults").addClass("hidden");
    }
}


function ToggleNameButtonVisibility() {
    const name = $("#NameText").text().trim();
    if (name.length === 0) {
        $("#backspaceButton").addClass("inactive");
        $("#submitButton").addClass("inactive");
    } else {
        $("#backspaceButton").removeClass("inactive");
        $("#submitButton").removeClass("inactive");
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

async function PlayGame() {
    let player = await GetCurrentPlayerAsync();
    if (player === null || player === undefined) {
        $("#loginOverlayBackground").removeClass("hidden");
        $("#slotPageContainer").removeClass("hidden");
        player = await PollForPlayerAsync();
    }

    if (player === null || player === undefined) {
        location.reload();
    }

    let game = new SlotGame(player);

    $("#addButton").off().on("click", async function (e) {
        await game.AddCash();
    });

    $("#spinButton").off().on("click", async function (e) {
        await game.Spin();
    });

    $("#editNameButton").off().on("click", async function (e) {
        await game.ShowNameInput();
    });

    $("#showPayButton").off().on("click", async function (e) {
        await game.ShowPayTable();
    });

    $("#adminButton").off().on("click", async function (e) {
        await game.ShowAdmin();
    });

    $(".linesButton").each(function () {
        $(this).off().on("click", async function (e) {
            game.SetLines($(this), true);
        });
    });

    await game.Start();

    await new Promise(resolveClick => {
        $("#quitButton").off().on("click", async function (e) {
            await SendQuitGameSignal();
            resolveClick(e);
        });
    }).then(async _ => {
        location.reload();
    });
}

PlayGame();