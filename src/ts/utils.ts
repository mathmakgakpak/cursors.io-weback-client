// @ats-nocheck

import { mapSize, defaultURL } from './gameSettings'
import { LevelObject, Point } from './types';
import { findServerPreference, infoToIP }/* * as m28n*/ from './m28n';

const { realWidth, realHeight } = mapSize;


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

export function isStuckAt(x: number, y: number, grid: Uint8Array[]): boolean {
    return !isInsideMap(x, y) || !!grid[y][x];
}

/*export function shortGrid(grid: Uint8Array[], gridSpace: number) {
    let shortGrid = [];
    const shortWidth = realWidth / gridSpace;
    const shortHeight = realHeight / gridSpace;

    for (let y = 0; y < shortHeight; y++) {
        const array = shortGrid[y] = new Uint8Array(shortWidth);
        const array2 = grid[y * gridSpace];
        for (let x = 0; x < shortWidth; x++) {
            array[x] = array2[x * gridSpace];
        }
    }

    return shortGrid;
}*/

export function levelObjectsToGrid(LevelObjects: LevelObject[]) {
    let grid = []; // new Uint8Array(realWidth * realHeight); nope

    for (let y = 0; y < realHeight; y++) {
        const array = new Uint8Array(realWidth); // should work for pathfinding.js
        grid.push(array);
        for (let x = 0; x < realWidth; x++) {
            if(LevelObjects.find(
                obj => isInsideObject(x, y, obj) && obj.type === 1)
            ) array[x] = 1;
        }
    }
    
    return grid;
}

export function calculateGridSpace(levelObjects: LevelObject[]) {
    let grid = 100;
    
    for (let length = levelObjects.length, i = 0; i < length; i++) {
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

            if (
                (shortX | 0) !== shortX ||
                (shortY | 0) !== shortY ||
                (shortWidth | 0) !== shortWidth ||
                (shortHeight | 0) !== shortHeight
            ) grid--, i = 0;
        }
    }
    return grid
}


export function* walk(x1: number, y1: number, x2: number, y2: number) {
    let dx =  Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
	let dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
	let err = dx + dy,
		e2;

	while(true) {
		yield [x1, y1];
		if (x1 == x2 && y1 == y2) break;
		e2 = 2 * err;
		if (e2 >= dy) { err += dy; x1 += sx; }
		if (e2 <= dx) { err += dx; y1 += sy; }
	}
}

export function unStuck({x: oldX, y: oldY}: Point, {x: newX, y: newY}: Point, grid: Uint8Array[]) {
    let lastPos = [oldX, oldY];
    let collides = false;

    for(let pos of walk(oldX, oldY, newX, newY)) {
        
        if(isStuckAt(pos[0], pos[1], grid)) {
            collides = true;
            break;
        }
        lastPos = pos;
    }
    
    return {
        x: lastPos[0],
        y: lastPos[1],
        collides
    }
}
export function changeStateOfWall(wall: LevelObject, grid: Uint8Array[], state: number) {
    // @ts-ignore
    const x2 = wall.x + wall.width;
    // @ts-ignore
    const y2 = wall.y + wall.height;
    
    for(let y = wall.y; y < y2; y++) {
        const array = grid[y];
        for(let x = wall.x; x < x2; x++) {
            array[x] = state;
        }
    }
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

/*export function* rainbowGenerator(frequency: number = 0.1) {
    for(let i = 0;; i++) {
        let r = Math.sin(frequency * i + 0) * 127 + 128;
        let g = Math.sin(frequency * i + 2) * 127 + 128;
        let b = Math.sin(frequency * i + 4) * 127 + 128;

        yield [r, g, b].map(x => Math.round(x));
    }
}*/

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCursorsServer() {
    const info = await findServerPreference("cursors");
    
    return info && info[0] ? infoToIP(info[0]) : defaultURL;
}