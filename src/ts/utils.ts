// @ats-nocheck

import { mapSize, defaultURL } from './gameSettings'
import { Point } from './types';
import { LevelObject } from './classes/LevelObjects';
import SolidMap from './SolidMap';

// Parses cursors.io level "M" object to my own this level object // i needed it to test rendering 
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



// export function isInsideObject(x: number, y: number, obj: LevelObject) {
//     // @ts-ignore
//     // return x >= obj.x && x < obj.x + obj.width && // @ts-ignore: thiccccccccc
//         // y >= obj.y && y < obj.y + obj.height;
// }

// export function isStuckAt(x: number, y: number, grid: Uint8Array[]): boolean {
//     return !isInsideMap(x, y) || !!grid[y][x];
// }

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

// export 


export function calculateGridSpace(levelObjects: LevelObject[]) { // this to make pathfinding between walls and collision checking faster
    let grid = 100;

    for (let length = levelObjects.length, i = 0; i < length; i++) {
        if (grid <= 1) { // if it can't find 
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

            if ( // 1.9 | 0 = 1 it truncates decimal point https://stackoverflow.com/questions/7641818/how-can-i-remove-the-decimal-part-from-javascript-number
                (shortX | 0) !== shortX ||
                (shortY | 0) !== shortY ||
                (shortWidth | 0) !== shortWidth ||
                (shortHeight | 0) !== shortHeight
            ) grid--, i = 0;
        }
    }
    return grid;
}

// export function unStuck({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point, solidMap: SolidMap): { x: number, y: number, collides: boolean } {
//     if (solidMap.isPointSolid(x1, y1)) {
//         return { x: x1, y: y1, collides: true };
//     }

//     if (x1 === x2 && y1 === y2) {
//         return { x: x2, y: y2, collides: false };
//     }

//     let [x, y] = [x1, y1];
//     const dx: number = Math.sign(x2 - x1);
//     const dy: number = Math.sign(y2 - y1);
//     const width: number = Math.abs(x2 - x1);
//     const height: number = Math.abs(y2 - y1);
//     let collides: boolean = false;

//     if (width >= height) {
//         const slope: number = height / width;
//         for (let i: number = 0; i <= width; i++) {
//             if (solidMap.isPointSolid(x, y)) {
//                 collides = true;
//                 break;
//             }
//             x += dx;
//             y += Math.round(dy * slope);
//         }
//     } else {
//         const slope: number = width / height;
//         for (let i: number = 0; i <= height; i++) {
//             if (solidMap.isPointSolid(x, y)) {
//                 collides = true;
//                 break;
//             }
//             x += Math.round(dx * slope);
//             y += dy;
//         }
//     }

//     return { x, y, collides};
// }


export function* walk(x1: number, y1: number, x2: number, y2: number) { // it creates a line
    const dx =  Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
	const dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
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

export function unStuck({x: oldX, y: oldY}: Point, {x: newX, y: newY}: Point, solidMap: SolidMap) {
    let lastPos = [oldX, oldY];
    let collides: boolean | number[] = false;

    for(const pos of walk(oldX, oldY, newX, newY)) {
        if(solidMap.isPointSolid(pos[0], pos[1])) {
            collides = pos;
            break;
        }
        lastPos = pos;
    }

    return {
        x: lastPos[0],
        y: lastPos[1],
        collides // if collides it returns an array with where exactly it collides
        // TODO: try to glow the wall which cursor collides with
    }
}
// export function changeStateOfWall(wall: LevelObject, grid: Uint8Array[], state: number) {
//     // @ts-ignore
//     const x2 = wall.x + wall.width;
//     // @ts-ignore
//     const y2 = wall.y + wall.height;

//     for(let y = wall.y; y < y2; y++) {
//         const array = grid[y];
//         for(let x = wall.x; x < x2; x++) {
//             array[x] = state;
//         }
//     }
// }

export function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}



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

export function* rainbowGenerator(frequency: number = 0.1) {
    for (let i = 0; ; i++) {
        let r = Math.sin(frequency * i + 0) * 127 + 128;
        let g = Math.sin(frequency * i + 2) * 127 + 128;
        let b = Math.sin(frequency * i + 4) * 127 + 128;

        yield [r, g, b].map(x => Math.round(x));
    }
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCursorsServer() {
    return defaultURL;
    location.href.replace("http", "ws")
    // const info = await findServerPreference("cursors");

    // return info && info[0] ? infoToIP(info[0]) : defaultURL;
}