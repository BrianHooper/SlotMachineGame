export class SlotIcon {
    public Index: number;
    public Name: string;
    public Filename: string;
    public Value3: number;
    public Value4: number;
    public Value5: number;
    public Probability: number;

    constructor(index: number, name: string, filename: string, value3: number, value4: number, value5: number, probablility: number) {
        this.Index = index;
        this.Name = name;
        this.Filename = filename;
        this.Value3 = value3;
        this.Value4 = value4;
        this.Value5 = value5;
        this.Probability = probablility;
    }

    public CreateImage(): JQuery<HTMLElement> {
        return jQuery("<img/>")
            .attr("src", `/images/${this.Filename}`)
            .css("height", `${100}px`)
            .css("width", `${100}px`);
    }
}

let slotIdx = 0;
export const SlotList: SlotIcon[] = [
    new SlotIcon(slotIdx++, "Orange", "01.png", 5, 15, 50, 30),
    new SlotIcon(slotIdx++, "Bell", "02.png", 5, 15, 50, 30),
    new SlotIcon(slotIdx++, "Grapes", "03.png", 5, 15, 50, 10),
    new SlotIcon(slotIdx++, "Heart", "04.png", 5, 15, 50, 5),
    new SlotIcon(slotIdx++, "Coin", "05.png", 5, 15, 50, 5),
    new SlotIcon(slotIdx++, "Banana", "06.png", 5, 15, 50, 5),
    new SlotIcon(slotIdx++, "Seven", "07.png", 10, 25, 60, 5),
    new SlotIcon(slotIdx++, "Horseshoe", "08.png", 10, 25, 75, 5),
    new SlotIcon(slotIdx++, "Diamond", "09.png", 15, 50, 100, 5),
    new SlotIcon(slotIdx++, "Apple", "10.png", 20, 60, 100, 5),
    new SlotIcon(slotIdx++, "Clover", "11.png", 75, 200, 500, 8),
    new SlotIcon(slotIdx++, "Cherry", "12.png", 250, 500, 2500, 5),
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
    //console.log(`slots.length: ${SlotList.length}, probabilitySum: ${probabilitySum}, choice: ${choice}`);
    return SlotList[result];
}