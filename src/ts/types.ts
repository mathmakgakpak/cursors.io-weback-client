

export interface Player {
    id: number;
    x: number;
    y: number;
    // joinedAt: number; // innacutare and useless
}

export interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number; 
    drewAt: number;
    removeAt: number;
}

export interface Click {
    x: number;
    y: number;
    clickedAt: number;
    removeAt: number;
}


export interface Point {
    x: number;
    y: number;
}
export interface PointBob extends Point { // idk how to call it
    canvasX: number;
    canvasY: number;
} 