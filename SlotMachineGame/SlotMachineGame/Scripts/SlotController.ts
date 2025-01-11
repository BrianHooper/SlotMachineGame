import { NUM_SLOTS, SLOT_HEIGHT, WINDOW_HEIGHT, SLOT_UPPER_POSITION, SLOT_LOWER_POSITION, getRandomIntInRange } from "./SlotConstants.js";
import { SlotIcon, GetRandomSlot } from "./SlotIcon.js"

export class Slot {
    private Window: JQuery<HTMLElement>;
    private Element: JQuery<HTMLElement>;
    private CurrentIcon: SlotIcon;
    private Icons: JQuery<HTMLElement>[] = new Array(NUM_SLOTS);
    private Row: number;
    private Col: number;

    constructor(parent: JQuery<HTMLElement>, row: number, col: number) {
        this.Row = row;
        this.Col = col;
        this.Window = jQuery("<div/>")
            .addClass("window")
            .css("height", `${WINDOW_HEIGHT}px`)
            .css("width", `${WINDOW_HEIGHT}px`)
            .appendTo(parent);
        this.Element = jQuery("<div/>")
            .addClass("slotContainer")
            .attr("data-row", row.toString())
            .attr("data-col", col.toString())
            .css("top", `${SLOT_UPPER_POSITION}px`)
            .appendTo(this.Window);

        for (var i = 0; i < NUM_SLOTS; i++) {
            const slotIcon = GetRandomSlot();
            const image = slotIcon.CreateImage();
            const icon = jQuery("<div/>", { "class": "innerBox", "data-index": i.toString() })
                .css("height", `${SLOT_HEIGHT}px`)
                .append(image)
                .appendTo(this.Element);
            this.Icons[i] = icon;
        }
    }

    public async Spin(): Promise<void> {
        const delay = 250 * this.Col + 250 + this.Row  * 0;
        await new Promise(resolve => setTimeout(resolve, delay));

        this.Icons[NUM_SLOTS - 4].html(this.Icons[0].html());
        this.Icons[NUM_SLOTS - 3].html(this.Icons[1].html());
        this.Icons[NUM_SLOTS - 2].html(this.Icons[2].html());
        this.Icons[NUM_SLOTS - 1].html(this.Icons[3].html());

        await new Promise(resolve => setTimeout(resolve, 100));

        this.Element.css("top", `${SLOT_LOWER_POSITION}px`);
        for (var i = 0; i < NUM_SLOTS - 4; i++) {
            const slotIcon = GetRandomSlot();
            const slotImage = slotIcon.CreateImage();
            this.Icons[i].empty().append(slotImage);
        }

        this.CurrentIcon = GetRandomSlot();
        let currentSlotImage = this.CurrentIcon.CreateImage();
        this.Icons[1].empty().append(currentSlotImage);

        await new Promise(resolve => setTimeout(resolve, 100));

        await $.when(
            this.Element.animate({
                top: `${SLOT_UPPER_POSITION}px`
            }, {
                duration: 2500,
                specialEasing: {
                    width: "linear",
                    height: "easeOutBounce"
                }
            })
        );

        this.Element.css("top", `${SLOT_UPPER_POSITION}px`);
    }

    public CenterPosition(): JQuery.Coordinates {
        const position = this.Window.position();
        const height = this.Window.height();
        const width = this.Window.width();

        const center: JQuery.Coordinates = {
            top: position.top + (height / 2),
            left: position.left + (width / 2)
        };

        return center;
    }

    public Result(): SlotIcon {
        return this.CurrentIcon;
    }
}