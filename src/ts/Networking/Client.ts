import EventEmitter from 'events';
import { Line, PointBob } from '../types';
import Click from "../classes/Click";

import { rendererSettings } from '../canvasRenderer';
import { defaultURL } from '../gameSettings';
// import { changeStateOfWall, levelObjectsToGrid } from './utils';
import log from '../sexylogs';
import {
    LevelObject,
    TextObject,
    DebugObject,
    WallObject,
    TeleportObject,
    CursorCounterObject,
    ButtonObject,
    ObjectTypes
} from "../classes/LevelObjects"
import SolidMap from '../SolidMap';
import Opcodes from "./Opcodes";
import { parsePlayers, parseObjects } from './PacketParser';

export {
    compareLevel,
    Client
}


// function updateClicksOrLines(clicksOrDrawings: Click[]): Click[];
// function updateClicksOrLines(clicksOrDrawings: Line[]): Line[] {
//     const now = Date.now();
//     clicksOrDrawings.forEach(({removeAt}, i) => {
//         if(removeAt < now) clicksOrDrawings.splice(i, 1);
//     });
// }



function compareLevel(prevLevels: any, level: LevelObject[]) {
    let compare: any = []; // TO-DO: o.type = ObjectTypes
    level.forEach((o: any) => {
        if (o.type === 0) { // text
            compare.push({
                x: o.x,
                y: o.y,
                size: o.size,
                content: o.content
            });
        } else if (o.type === 1) { // walls
            if (o.color === '#000000') compare.push({ // because other colored walls can be gone often
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h
            });
        } else if (o.type === 2) { // exit/red thing
            compare.push({
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                isBad: o.isBad
            });
        } else {
            compare.push({ // button / cursors
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                color: o.color
            });
        }
    });
    compare = JSON.stringify(compare);
    let levelIndex = prevLevels.indexOf(compare);

    if (levelIndex === -1) {
        levelIndex = prevLevels.length;
        prevLevels.push(compare);
    }
    return levelIndex;
}


interface Options {
    reconnectTimeout?: number;
    autoMakeSocket?: boolean;
    log?: boolean;
    ws?: string;
    reconnect?: boolean
}

class Client extends EventEmitter {
    public prevLevels: LevelObject[][] = [];
    public levelObjects: LevelObject[] = [];
    public options: Options = {};
    public players: any = {}; /* TODO do something like 
    interface Players {
        id: Player
    }
    */
    public solidMap: SolidMap = new SolidMap(0, 0);
    // public gridSpace: number = 100;

    public playersOnLevel: number = 0;
    public usersOnline: number = 0;

    private lastAck: number = 0; // it has something to do with tcp FIN packet... It just verifies if everything you got is good
/*
    #clicksAndDrawingsUpdateInterval: number = window.setInterval(() => {
        this.clicks = updateClicksOrLines(this.clicks);
        this.lines = updateClicksOrLines(this.lines);
    }, 1); // TO-DO change to INTERP_TIME
    */ // not needed as the renderer does that

    // #jobs: number = 0; // implementation for making bot system (drawText)
    public ws: WebSocket | undefined;
    public id: number = -1;
    public level: number = -1;
    public position: PointBob = { // should be unchangable
        x: 0,
        y: 0,
        canvasX: 0,
        canvasY: 0
    }
    public clicks: Click[] = [];
    public drawings: Line[] = [];
    constructor(options: Options = {}) {
        super();

        if (!options.ws) options.ws = defaultURL;
        if (typeof options.reconnectTimeout !== "number") options.reconnectTimeout = 5000;
        if (typeof options.autoMakeSocket === "undefined") options.autoMakeSocket = true;
        if (typeof options.log === "undefined") options.log = true;

        this.options = options;

        if (options.autoMakeSocket) {
            this.makeSocket();
        } else {
            this.log("warn", "Disabled option autoMakeSocket! If you want start bot, do it in your script!");
        }
    }
    private log(type: string, ...args: any[]) {
        // @ts-ignore: fuck that error
        if (this.options.log) log[type](...args);
    }
    private resetVariables() {
        // this.players = {};
        // this.drawings = [];
        // this.clicks = [];

        // this.prevLevels = [];
        // this.levelObjects = [];
        // this.grid = new Uint8Array(0);

        // this.position = {
        //     x: 0,
        //     y: 0,
        //     canvasX: 0,
        //     canvasY: 0
        // }
        // this.ticks = 0;
        // //this.jobs = 0;
        // this.level = -1;
        // this.id = -1;
        // this.gridSpace = 100;
        // this.usersOnline = 0;
        // this.playersOnLevel = 0;
    }
    private setPosition(x: number, y: number) {
        this.position.x = x;
        this.position.y = y;

        this.position.canvasX = x * 2;
        this.position.canvasY = y * 2;
    }
    makeSocket() {
        this.resetVariables();

        this.ws = new WebSocket(<string>this.options.ws);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = (event: any) => {this.emit("open", event)};
        
        this.ws.onclose = (event: any) => {
            this.emit("close", event);
            if (this.options.reconnect) setTimeout(this.makeSocket, this.options.reconnectTimeout);
        }
        this.ws.onerror = (event: any) => this.emit("error", event);
        
        this.ws.onmessage = ({data: arrayBuffer}) => {
            const len = arrayBuffer.length;
            const dv = new DataView(arrayBuffer);
            const now = Date.now();

            let offset = 0;
            const opcode = dv.getUint8(offset++);

            this.emit("message", dv, opcode, arrayBuffer);


            switch (opcode) { // idk why there is no 2 and 3
                case Opcodes.GET_ID: { // got id
                    this.id = dv.getUint32(offset, true);
                    this.emit("gotId");
                    break;
                }
                case Opcodes.UPDATE: { // cursors updates lines and map changes
                    { // players
                        const {
                            parsedPlayers,
                            updatedPlayers,
                            movedPlayers,
                            newPlayers,
                            removedPlayers,
                            
                            count,
                            offset: off
                        } = parsePlayers(dv, offset, this.players, this.id, now);
                        offset = off;

                        // !!! it emits almost always.
                        // There is no way to prevent it without checking length by using Object.keys
                        // or adding a lot of counters
                        if(count) {
                            this.emit("parsedPlayers", parsedPlayers);
                            this.emit("updatedPlayers", updatedPlayers);
                            this.emit("movedPlayers", movedPlayers);
                            this.emit("newPlayers", newPlayers);
                        }
                        
                        this.emit("removedPlayers", removedPlayers);

                    }

                    // clicks
                    let count = dv.getUint16(offset, true);
                    offset += 2;
                    
                    let clicks: Click[] = [];

                    for (let i = 0; i < count; i++) {
                        const x = dv.getUint16(offset, true);
                        const y = dv.getUint16(offset + 2, true);
                        const click = new Click(x, y, now);

                        clicks.push(click);
                        this.clicks.push(click);
                        offset += 2 + 2;
                    }
                    if(this.clicks.length) console.log("test", this.clicks);
                    if(clicks.length) this.emit("newClicks", clicks);


                    // removed objects
                    count = dv.getUint16(offset, true);
                    offset += 2;
                    let removedObjects: LevelObject[] = [];

                    for (let i = 0; i < count; i++) {
                        let idOfObjectToRemove = dv.getUint32(offset, true);

                        let index = this.levelObjects.findIndex(x => x.id === idOfObjectToRemove);

                        const obj = this.levelObjects.splice(index, 1)[0];

                        removedObjects.push(obj);
                        if(obj.type === ObjectTypes.WALL) this.solidMap.setWallObject(obj, false);

                        offset += 4;
                    }
                    this.emit("removedObjects", removedObjects);

                    // added objects
                    {
                        const { levelObjects: addedObjects, offset: off} = parseObjects(dv, offset);
                        offset = off;

                        
                        this.emit("addedObjects", addedObjects);

                        addedObjects.forEach(obj => {
                            this.levelObjects.push(obj);
                            if(obj.type === 1) this.solidMap.setWallObject(obj, true);
                        });
                    }

                    // drawings
                    count = dv.getUint16(offset, true);
                    let drawings: Line[] = [];

                    offset += 2;

                    for (let i = 0; i < count; i++) {
                        drawings.push({
                            x1: dv.getUint16(offset, true),
                            y1: dv.getUint16(offset + 2, true),
                            x2: dv.getUint16(offset + 2 + 2, true),
                            y2: dv.getUint16(offset + 2 + 2 + 2, true),
                            drewAt: Date.now(),
                            removeAt: Date.now() + rendererSettings.drawingRenderTime
                        });
                        offset += 2 + 2 + 2 + 2;
                    }
                    this.emit("newDrawings", drawings);

                    this.drawings = this.drawings.concat(drawings);

                    // if (len >= offset + 4) {
                    //     this.lastAck = Math.max(this.lastAck, dv.getUint32(offset, true));
                    //     offset += 4;
                    // } else if (len >= offset + 2) {
                    //     this.lastAck = Math.max(this.lastAck, dv.getUint16(offset, true));
                    //     offset += 2;
                    // }

                    this.usersOnline = dv.getUint32(offset, true);
                    break;
                }
                case Opcodes.NEW_LEVEL: {
                    this.levelObjects.splice(0, -1);
                    this.solidMap.resetMap(); // to avoid collisions after setting position

                    this.setPosition(dv.getUint16(offset, true), dv.getUint16(offset + 2, true));
                    offset += 4;

                    const { levelObjects, offset: off } = parseObjects(dv, offset)
                    offset = off;
                    

                    
                    this.solidMap.setLevelObjects(levelObjects);

                    this.level = compareLevel(this.prevLevels, this.levelObjects);

                    if (len >= offset + 4) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint32(offset, true));
                    } else if (len >= offset + 2) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint16(offset, true));
                    }

                    break;
                }
                case Opcodes.PREDICTION_ERROR: {
                    this.setPosition(dv.getUint16(offset, true), dv.getUint16(offset + 2, true));

                    offset += 4;


                    if (len >= offset + 4) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint32(offset, true));
                    } else if (len >= offset + 2) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint16(offset, true));
                    }
                    break;
                }
                default: {
                    console.debug("Unexpected packet: ", dv.getUint8(0));
                }
            }
        }
    }
    private isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    move(x: number = this.position.x, y: number = this.position.y): boolean {
        if (!this.isConnected()) return false;
        const array = new ArrayBuffer(9);
        const dv = new DataView(array);

        dv.setUint8(0, 1);
        dv.setUint16(1, x, true);
        dv.setUint16(3, y, true);
        dv.setUint32(5, this.lastAck, true);
        // @ts-ignore
        this.ws.send(array);

        this.setPosition(x, y);
        return true;
    }
    click(x: number = this.position.x, y: number = this.position.y): boolean {
        if (!this.isConnected()) return false;
        const array = new ArrayBuffer(9);
        const dv = new DataView(array);

        dv.setUint8(0, 2);
        dv.setUint16(1, x, true);
        dv.setUint16(3, y, true);
        dv.setUint32(5, this.lastAck, true);
        // @ts-ignore
        this.ws.send(array);

        this.setPosition(x, y);
        return true;
    }
    draw(x1: number, y1: number, x2: number, y2: number): boolean {
        if (!this.isConnected()) return false;
        const array = new ArrayBuffer(9);
        const dv = new DataView(array);

        dv.setUint8(0, 3);
        dv.setUint16(1, x1, true);
        dv.setUint16(3, y1, true);
        dv.setUint16(5, x2, true);
        dv.setUint16(7, y2, true);
        // @ts-ignore
        this.ws.send(array);

        this.setPosition(x2, y2);
        return true;
    }
}
