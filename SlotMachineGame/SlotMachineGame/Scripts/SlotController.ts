import { NUM_SLOTS, SLOT_HEIGHT, WINDOW_HEIGHT, NUM_ICONS, SLOT_UPPER_POSITION, SLOT_LOWER_POSITION, getRandomIntInRange } from "./SlotConstants.js";

function CreateImage(index: number): JQuery<HTMLElement> {
    //return `<img src="/images/${index}.jpg" />`;

    return jQuery("<img/>")
        //.addClass("window")
        .attr("src", `images/${index}.jpg`)
        .css("height", `${100}px`)
        .css("width", `${100}px`);
}

export class Slot {
    private Element: JQuery<HTMLElement>;
    private CurrentResult: number;
    private Icons: JQuery<HTMLElement>[] = new Array(NUM_SLOTS);
    private Row: number;
    private Col: number;

    constructor(parent: JQuery<HTMLElement>, row: number, col: number) {
        this.Row = row;
        this.Col = col;
        const window = jQuery("<div/>")
            .addClass("window")
            .css("height", `${WINDOW_HEIGHT}px`)
            .css("width", `${WINDOW_HEIGHT}px`)
            .appendTo(parent);
        this.Element = jQuery("<div/>")
            .addClass("slotContainer")
            .attr("data-row", row.toString())
            .attr("data-col", col.toString())
            .css("top", `${SLOT_UPPER_POSITION}px`)
            .appendTo(window);

        for (var i = 0; i < NUM_SLOTS; i++) {
            const icon = jQuery("<div/>", { "class": "innerBox", "data-index": i.toString() })
                .css("height", `${SLOT_HEIGHT}px`)
                .append(CreateImage(getRandomIntInRange(1, NUM_ICONS)))
                .appendTo(this.Element);
            this.Icons[i] = icon;
        }
    }

    public async Spin(): Promise<void> {
        const delay = 500 * this.Col + 250 + this.Row  * 0;
        await new Promise(resolve => setTimeout(resolve, delay));

        this.Icons[NUM_SLOTS - 4].html(this.Icons[0].html());
        this.Icons[NUM_SLOTS - 3].html(this.Icons[1].html());
        this.Icons[NUM_SLOTS - 2].html(this.Icons[2].html());
        this.Icons[NUM_SLOTS - 1].html(this.Icons[3].html());

        await new Promise(resolve => setTimeout(resolve, 100));

        this.Element.css("top", `${SLOT_LOWER_POSITION}px`);
        for (var i = 0; i < NUM_SLOTS - 4; i++) {
            this.Icons[i].empty().append(CreateImage(getRandomIntInRange(1, NUM_ICONS)));
        }

        this.CurrentResult = getRandomIntInRange(1, NUM_ICONS);
        this.Icons[1].empty().append(CreateImage(this.CurrentResult));

        await new Promise(resolve => setTimeout(resolve, 100));

        await $.when(
            this.Element.animate({
                top: `${SLOT_UPPER_POSITION}px`
            }, {
                duration: 5000,
                specialEasing: {
                    width: "linear",
                    height: "easeOutBounce"
                }
            })
        );

        this.Element.css("top", `${SLOT_UPPER_POSITION}px`);
    }

    public Result(): number {
        return this.CurrentResult;
    }
}