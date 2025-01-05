import { NUM_SLOTS, SLOT_HEIGHT, NUM_ICONS, SLOT_UPPER_POSITION, SLOT_LOWER_POSITION, getRandomIntInRange } from "./SlotConstants.js";



function CreateImage(index: number): string {
    return `<img src="/images/${index}.jpg" />`;
}

export class Slot {
    private Element: JQuery<HTMLElement>;
    private Icons: JQuery<HTMLElement>[] = new Array(NUM_SLOTS);

    constructor(parent: JQuery<HTMLElement>, row: number, col: number) {
        const window = jQuery("<div/>")
            .addClass("window")
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
                .html(CreateImage(getRandomIntInRange(1, NUM_ICONS)))
                .appendTo(this.Element);
            this.Icons[i] = icon;
        }
    }

    public async Spin(prizeIcon: number, delay: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, delay));

        this.Icons[NUM_SLOTS - 4].html(this.Icons[0].html());
        this.Icons[NUM_SLOTS - 3].html(this.Icons[1].html());
        this.Icons[NUM_SLOTS - 2].html(this.Icons[2].html());
        this.Icons[NUM_SLOTS - 1].html(this.Icons[3].html());

        await new Promise(resolve => setTimeout(resolve, 100));

        this.Element.css("top", `${SLOT_LOWER_POSITION}px`);

        for (var i = 0; i < NUM_SLOTS - 4; i++) {
            this.Icons[i].html(CreateImage(getRandomIntInRange(1, NUM_ICONS)));
        }

        this.Icons[1].html(CreateImage(prizeIcon));

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
}