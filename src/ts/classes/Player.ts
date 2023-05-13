


export default class Player {
    public joinedAt: number = -1;
    
    constructor(
        public id: number,
        public x: number = 0,
        public y: number = 0
    ) {}
    
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export interface Players { // this is used for players object not array
    [id: string]: Player; // id must be a string because that's a typescript number but it is a string in javascript 
    
}