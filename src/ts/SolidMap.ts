
/*
x = 3
y = 4
'*' - y * width
'%' - x
'&' - our point we want

this.solid = new Uint8Array(10 * 7) = this thing underneath
  0 1 2 3 4 5 6 7 8 9
0 * * * * * * * * * * Width = 10
1 * * * * * * * * * * 
2 * * * * * * * * * * 
3 * * * * * * * * * * 
4 % % % & # # # # # # 
5 # # # # # # # # # # 
6 # # # # # # # # # # 
Height = 7
*/

import { LevelObject, ObjectTypes, WallObject } from "./classes/LevelObjects";

export default class SolidMap {
    private resetUint8Array: Uint8Array; // Uint8Array used to set reset(zero) solid Uint8Array
    public solid: Uint8Array;

    public length: number;
    

    constructor(public width: number, public height: number) {
        this.length = width * height;
        this.solid = new Uint8Array(this.length);
        this.resetUint8Array = new Uint8Array(this.length);
        
    }
    public resetMap() {
        this.solid.set(this.resetUint8Array);
    }
    public setSolidArea(x: number, y: number, x2: number, y2: number, isSolid: boolean) {
        // px - point x
        // py - point y
        for(let py = y; py < y2; py++){
            for(let px = x; px < x2; px++){
                this.solid[px + py * this.width] = Number(isSolid);
            }
        }
    }
    setWallObject({x, y, width, height}: WallObject, isSolid: boolean) {
        this.setSolidArea(x, y, x + width, y + height, isSolid);
    }
    // used only when we get new level
    public setLevelObjects(levelObjects: LevelObject[]) {
        levelObjects.forEach((obj: LevelObject) => {
            if(obj.type === ObjectTypes.WALL) {
                this.setWallObject(obj, true);
            }
        })
    }
    public isOutsideMap(x: number, y: number) {
        return x < 0 && x >= this.width &&
            y < 0 && y >= this.height;
    }
    public isPointSolid(x: number, y: number) {

        // if (i < 0 || i >= this.length) return true; // in this implementation x still can be negative and it will count as inside
        
        return !!this.solid[y * this.width + x] && this.isOutsideMap(x, y);
    }
}