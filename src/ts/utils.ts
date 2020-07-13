// @ts-nocheck

import { mapSize } from './gameSettings'
import { LevelObject } from './types';

const { width, realWidth, height, realHeight } = mapSize;


export function parse(levelObjects: any) {
    return levelObjects.map((obj: any) => {
        if (obj.color) obj.color = rgbToHex(obj.color.r, obj.color.g, obj.color.b);
        if (obj.textHeight) {
            obj.size = obj.textHeight;
            delete obj.textHeight;
        }
        return obj;
    })
}

export function isInsideMap(x: number, y: number) {
    return x >= 0 && x < realWidth &&
        y >= 0 && y < realHeight;
}

export function isInsideObject(x: number, y: number, obj: LevelObject) {
    // @ts-ignore
    return x >= obj.x && x < obj.x + obj.width && // @ts-ignore: thiccccccccc
        y >= obj.y && y < obj.y + obj.height;
}

export function isStuckAt(x: number, y: number, levelObjects: LevelObject[]) {
    if (!isInsideMap(x, y)) return true;

    let length = levelObjects.length;
    for (let i = 0; i < length; i++) {
        let obj = levelObjects[i];

        if (obj.type === 1 && isInsideObject(x, y, obj)) return true;
    }
    return false;
}
/*export function getObjectAtXY(x, y, levelObjects) {

}*/

export function levelObjectToGrid(levelObjects: LevelObject[]) {
    let grid = new Uint8Array(realWidth * realHeight);

    let gridLength = grid.length;
    let objectsLength = levelObjects.length;

    for (let i = 0, y = 0; y < realHeight; y++) {
        for (let x = 0; x < realWidth; x++, i++) {

        }
    }
}

export function calculateGridSpace(levelObjects: LevelObject[]) {
    let grid = 100;  // walls should not be bigger than it
    for (let i = 0; i < levelObjects.length; i++) {
        if (grid <= 1) {
            grid = 1;
            break;
        }
        let levelObject = levelObjects[i];
        if (levelObject.type === 1) {
            let shortX = levelObject.x / grid,
                shortY = levelObject.y / grid,
                // @ts-ignore
                shortWidth = levelObject.width / grid,
                // @ts-ignore
                shortHeight = levelObject.height / grid;

            if ( // that is clever ;-;
                (shortX | 0) !== shortX ||
                (shortY | 0) !== shortY ||
                (shortWidth | 0) !== shortWidth ||
                (shortHeight | 0) !== shortHeight
            ) grid--, i = 0;
        }
    }
    return grid
}

export function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// @ts-ignore
export const getPointerLockElement = () => document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;


export function generateRainbow(times: number = 32, frequency: number = 0.01) {
    let colors = [];
    for (let i = 0; i < times; i++) {
        let r = Math.sin(frequency * i + 0) * 127 + 128;
        let g = Math.sin(frequency * i + 2) * 127 + 128;
        let b = Math.sin(frequency * i + 4) * 127 + 128;
        colors.push([r, g, b].map(x => Math.round(x)));
    }
    return colors;
}

export function* rainbowGenerator(frequency: number = 0.1) { // I'm scared what will happen when it will reach Number.MAX_VALUE
    for(let i = 0;; i++) {
        let r = Math.sin(frequency * i + 0) * 127 + 128;
        let g = Math.sin(frequency * i + 2) * 127 + 128;
        let b = Math.sin(frequency * i + 4) * 127 + 128;

        yield [r, g, b].map(x => Math.round(x));
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

