/*export enum binObjectTypes {
    TEXT      = 0b000001,
    WALL      = 0b000010,
    EXIT      = 0b000100,
    isExitBad = 0b001000,
    HOVER     = 0b010000,
    BUTTON    = 0b100000
}*/ // finally not used
export enum objectTypes {
    TEXT,
    WALL,
    EXIT,
    HOVER,
    BUTTON,
}

export interface Player {
    id: number;
    x: number;
    y: number;
    // joinedAt: number; // innacutare and useless
}

export interface Drawing {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    drawedAt: number;
    removedAt: number;
}

export interface Click {
    x: number;
    y: number;
    clickedAt: number;
    removedAt: number;
}

export interface LevelObject {
    id: number;
    type: objectTypes;
    x: number;
    y: number;
    // ^ all

    width?: number;
    height?: number;
    // ^ wall, exit/red thing, hover, button

    color: string;
    // ^ wall, hover, button

    isBad?: boolean;
    // ^ exit/red thing

    size?: number;
    isCentered?: boolean;
    content?: string;
    // ^ text
    
    count?: number;
    // ^ hover, button
}
export interface Point {
    x: number;
    y: number;
}