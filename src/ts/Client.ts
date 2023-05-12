import EventEmitter from 'events';
import { Click, Line, PointBob } from './types';
import { rendererSettings } from './canvasRenderer';
import { defaultURL } from './gameSettings';
// import { changeStateOfWall, levelObjectsToGrid } from './utils';
import log from './sexylogs';
import {
    LevelObject,
    TextObject,
    DebugObject,
    WallObject,
    TeleportObject,
    CursorCounterObject,
    ButtonObject,
    ObjectTypes
} from "./classes/LevelObjects"
import SolidMap from './SolidMap';
export {
    parseObjects,
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

function parseObjects(data: DataView, offset: number): {levelObjects: LevelObject[], offset:number} {
    let count = data.getUint16(offset, true);
    let levelObjects: LevelObject[] = [];

    offset += 2;
    for (let i = 0; i < count; ++i) {
        let id = data.getUint32(offset, true);

        offset += 4;

        let type = data.getUint8(offset);
        offset++

        let obj: LevelObject;
        switch (type) {
            case ObjectTypes.TEXT: { // text
                obj = new TextObject;
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.size = data.getUint8(offset + 2 + 2);
                obj.isCentered = !!data.getUint8(offset + 2 + 2 + 1);
                offset += 2 + 2 + 1;
                obj.content = "";
                let char: number = 0;
                while ((char = data.getUint8(++offset)) !== 0) {
                    obj.content += String.fromCharCode(data.getUint8(offset));
                }
                offset++;
                break;
            }
            case ObjectTypes.WALL: { // wall
                obj = new WallObject;
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.width = data.getUint16(offset + 2 + 2, true);
                obj.height = data.getUint16(offset + 2 + 2 + 2, true);
                obj.color = data.getUint32(offset + 2 + 2 + 2 + 2, true).toString(16);

                while (obj.color.length < 6) obj.color = "0" + obj.color;
                obj.color += "#";

                offset += 2 + 2 + 2 + 2 + 4;
                break;
            }
            case ObjectTypes.TELEPORT: { // Teleport
                obj = new TeleportObject;
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.width = data.getUint16(offset + 2 + 2, true);
                obj.height = data.getUint16(offset + 2 + 2 + 2, true);
                obj.isBad = !!data.getUint8(offset + 2 + 2 + 2 + 2);
                offset += 2 + 2 + 2 + 2 + 1;
                break;
            }
            case ObjectTypes.CURSOR_COUNTER: { // Cursor Counter
                obj = new CursorCounterObject;
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.width = data.getUint16(offset + 2 + 2, true);
                obj.height = data.getUint16(offset + 2 + 2 + 2, true);
                obj.count = data.getUint16(offset + 2 + 2 + 2 + 2, true);
                obj.color = data.getUint32(offset + 2 + 2 + 2 + 2 + 2, true).toString(16);

                while (obj.color.length < 6) obj.color = "0" + obj.color;
                obj.color += "#";
                offset += 2 + 2 + 2 + 2 + 2 + 4;
                break;
            }
            case ObjectTypes.BUTTON: { // button
                obj = new ButtonObject;
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.width = data.getUint16(offset + 2 + 2, true);
                obj.height = data.getUint16(offset + 2 + 2 + 2, true);
                obj.count = data.getUint16(offset + 2 + 2 + 2 + 2, true);
                obj.color = data.getUint32(offset + 2 + 2 + 2 + 2 + 2, true).toString(16);

                while (obj.color.length < 6) obj.color = "0" + obj.color;
                obj.color += "#";
                //obj.lastClickAt = 0;
                offset += 2 + 2 + 2 + 2 + 2 + 4;
                break;
            }
            case ObjectTypes.DEBUG_OBJECT: {
                log.warn("Encountered a debug object try removing browser cache: Ctrl + R")
                debugger;
                
                break;
            }

            default: throw new Error("Unknown object type: " + type);
        }

        /*
        https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-
        
        https://stackoverflow.com/questions/60854745/ts2454-variable-value-is-used-before-being-assigned
        */
        obj!.id = id;
        levelObjects[i] = obj!;
    }
    return {
        levelObjects,
        offset
    };
}

function compareLevel(prevLevels: any, level: LevelObject[]) {
    let compare: any = [];
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
            compare.push({ // button/hover
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
        
        this.ws.onmessage = message => {
            const arrayBuffer = message.data;
            const len = arrayBuffer.length;
            const dv = new DataView(arrayBuffer);
            const now = Date.now();

            this.emit("message", arrayBuffer);

            switch (dv.getUint8(0)) { // idk why there is no 2 and 3
                case 0: { // got id
                    this.id = dv.getUint32(1, true);
                    this.emit("gotId");
                    break;
                }
                case 1: { // cursors updates lines and map changes
                    this.usersOnline = dv.getUint32(len - 4, true);

                    // cursors
                    let offset = 1;
                    let players: any = {};
                    let newPlayers: any = [];
                    let updatedPlayers: any = [];
                    let removedPlayers: any = {};
                    let count = this.playersOnLevel = dv.getUint16(offset, true);

                    offset += 2;

                    for (let i = 0; i < count; i++) {
                        let id = dv.getUint32(offset, true);

                        let player = players[id] = {
                            id,
                            x: dv.getUint16(offset + 4, true),
                            y: dv.getUint16(offset + 4 + 2, true)
                        }

                        offset += 4 + 2 + 2;

                        let oldPlayer = this.players[id];
                        let playerUpdated = oldPlayer && (player.x !== oldPlayer.x || player.y !== oldPlayer.y);

                        if ( /*oldPlayer &&*/ playerUpdated) { // oldPlayerCheck is already in playerUpdated
                            updatedPlayers.push(player);
                        } else if (!oldPlayer) {
                            //player.joinedAt = Date.now();
                            newPlayers.push(player);
                        }
                    }
                    for (let i in this.players) {
                        if (!players[i]) removedPlayers.push(this.players[i]);
                    }
                    //let moreInfo = getMoreInfoAboutPlayers(this.players, players);

                    this.emit("newPlayers", newPlayers);
                    this.emit("updatedPlayers", updatedPlayers);
                    this.emit("removedPlayers", removedPlayers);

                    this.emit("rawPlayersUpdate", players);
                    this.players = players;

                    // clicks
                    count = dv.getUint16(offset, true);
                    let clicks: Click[] = [];

                    offset += 2;

                    for (let i = 0; i < count; i++) {
                        
                        clicks.push({
                            x: dv.getUint16(offset, true),
                            y: dv.getUint16(offset + 2, true),
                            clickedAt: now,
                            removeAt: now + rendererSettings.clickRenderTime
                        });
                        offset += 2 + 2;
                    }
                    // console.log("test", clicks)
                    this.emit("newClicks", clicks);

                    this.clicks = this.clicks.concat(clicks);
                    // removed objects
                    let removedObjects: LevelObject[] = [];
                    count = dv.getUint16(offset, true);
                    offset += 2;

                    for (let i = 0; i < count; i++) {
                        const obj = this.levelObjects.splice(
                         this.levelObjects.findIndex(x => x.id = dv.getUint32(offset, true)),
                        1)[0];

                        removedObjects.push(obj);
                        if(obj.type === 1) this.solidMap.setWallObject(obj, false); // buttons are not vanishing but shit happens

                        offset += 4;
                    }
                    this.emit("removedObjects", removedObjects);

                    // added objects
                    let a = parseObjects(dv, offset);
                    let addedObjects:LevelObject[] = a.levelObjects;
                    offset = a.offset;

                    // it just doesn't work
                    // {levelObjects: addedObjects, offset} = parseObjects(dv, offset);

                    
                    this.emit("addedObjects", addedObjects);

                    addedObjects.forEach(obj => { // that's what's fucked up
                        this.levelObjects.push(obj);
                        if(obj.type === 1) this.solidMap.setWallObject(obj, true);
                    });

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

                    if (len >= offset + 4) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint32(offset, true));
                        offset += 4;
                    } else if (len >= offset + 2) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint16(offset, true));
                        offset += 2;
                    }
                    break;
                }
                case 4: { // New Level
                    this.solidMap.resetMap();
                    this.setPosition(dv.getUint16(1, true), dv.getUint16(3, true));
                    let {offset, levelObjects} = parseObjects(dv, 5);
                    
                    
                    this.solidMap.setLevelObjects(this.levelObjects = levelObjects);

                    this.level = compareLevel(this.prevLevels, this.levelObjects);

                    if (len >= offset + 4) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint32(5, true));
                    } else if (len >= offset + 2) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint16(5, true));
                    }

                    break;
                }
                case 5: { // Collision error / Teleport
                    this.setPosition(dv.getUint16(1, true), dv.getUint16(1 + 2, true));

                    if (len >= 1 + 2 + 2 + 4) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint32(5, true));
                    } else if (len >= 1 + 2 + 2 + 2) {
                        this.lastAck = Math.max(this.lastAck, dv.getUint16(5, true));
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
