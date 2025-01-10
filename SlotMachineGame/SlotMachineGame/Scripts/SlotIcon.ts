export class SlotIcon {
    public Index: number;
    public Name: string;
    public Value3: number;
    public Value4: number;
    public Value5: number;
    public Probability: number;
    public IsFreebie: boolean;

    constructor(index: number, name: string, value3: number, value4: number, value5: number, probablility: number, isFreebie: boolean) {
        this.Index = index;
        this.Name = name;
        this.Value3 = value3;
        this.Value4 = value4;
        this.Value5 = value5;
        this.Probability = probablility;
        this.IsFreebie = isFreebie;
    }

    public CreateImage(): JQuery<HTMLElement> {
        return jQuery("<img/>")
            .attr("src", `images/${this.Name}`)
            .css("height", `${100}px`)
            .css("width", `${100}px`);
    }
}

let slotIdx = 0;
export const SlotList: SlotIcon[] = [
    new SlotIcon(slotIdx++, "01.jpg", 5, 15, 50, 10, false),
    new SlotIcon(slotIdx++, "02.jpg", 5, 15, 50, 10, false),
    new SlotIcon(slotIdx++, "03.jpg", 5, 15, 50, 10, false),
    new SlotIcon(slotIdx++, "04.jpg", 5, 15, 50, 10, false),
    new SlotIcon(slotIdx++, "05.jpg", 5, 15, 50, 10, false),
    new SlotIcon(slotIdx++, "06.jpg", 5, 15, 50, 10, false),
    new SlotIcon(slotIdx++, "07.jpg", 10, 25, 60, 10, false),
    new SlotIcon(slotIdx++, "08.jpg", 10, 25, 75, 10, false),
    new SlotIcon(slotIdx++, "09.jpg", 15, 50, 100, 10, false),
    new SlotIcon(slotIdx++, "10.jpg", 20, 60, 100, 10, false),
    new SlotIcon(slotIdx++, "11.jpg", 75, 200, 500, 10, true),
    new SlotIcon(slotIdx++, "12.jpg", 250, 500, 2500, 10, true),
]

const probabilitySum = SlotList.map(s => s.Probability).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

export function GetRandomSlot(): SlotIcon {
    let choice = Math.floor(Math.random() * (probabilitySum + 1));
    let result = 0;
    let probSum = 0;
    for (let idx = 0; idx < SlotList.length; idx++) {
        if (probSum <= choice) {
            result = idx;
        } else {
            break;
        }
        probSum += SlotList[idx].Probability;
    }
    console.log(`slots.length: ${SlotList.length}, probabilitySum: ${probabilitySum}, choice: ${choice}`);
    return SlotList[result];
}