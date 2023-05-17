

export interface Player {
    id: number;
    x: number;
    y: number;
    // joinedAt: number; // innacutare and useless
}



export interface Point {
    x: number;
    y: number;
}
export interface MousePositionInterface extends Point {
    canvasX: number;
    canvasY: number;
} 