
export const NUM_ICONS = 5;
export const NUM_SLOTS = 50;
export const SLOT_HEIGHT = 200;
export const SLOT_UPPER_POSITION = -1 * (SLOT_HEIGHT / 2);
export const SLOT_LOWER_POSITION = -1 * ((NUM_SLOTS - 3) * SLOT_HEIGHT - (SLOT_HEIGHT / 2));

export function getRandomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}