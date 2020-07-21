import EventEmitter from 'events';
import { Click, Drawing, LevelObject, Point } from './types';
import { renderSettings } from './canvasRenderer';
import { defaultURL } from './gameSettings';

export {
    parseObjects,
    compareLevel,
    Client
}


function updateClicksOrDrawings(clicksOrDrawings: Click[] | Drawing[]) {
    let now = Date.now();
    // @ts-ignore
    return clicksOrDrawings.filter(x => x.removeAt < now);
}

function parseObjects(data: DataView, offset: number) {
    let count = data.getUint16(offset, true);
    let objdata = [];

    offset += 2;
    for (let i = 0; i < count; ++i) {
        let id = data.getUint32(offset, true);

        offset += 4;

        let type = data.getUint8(offset);
        offset++

        let obj = objdata[i] = <LevelObject>{
            id,
            type
        };
        switch (type) {
            case 0: { // text
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.size = data.getUint8(offset + 2 + 2);
                obj.isCentered = !!data.getUint8(offset + 2 + 2 + 1);
                offset += 2 + 2 + 1;
                obj.content = "";
                while (data.getUint8(++offset) !== 0) {
                    obj.content += String.fromCharCode(data.getUint8(offset));
                }
                offset++;
                break;
            }
            case 1: { // wall
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
            case 2: { // exit/red thing
                obj.x = data.getUint16(offset, true);
                obj.y = data.getUint16(offset + 2, true);
                obj.width = data.getUint16(offset + 2 + 2, true);
                obj.height = data.getUint16(offset + 2 + 2 + 2, true);
                obj.isBad = !!data.getUint8(offset + 2 + 2 + 2 + 2);
                offset += 2 + 2 + 2 + 2 + 1;
                break;
            }
            case 3: { // hover
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
            case 4: { // button
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
        }
    }
    return [objdata, offset];
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
            if (o.color === '#000000') compare.push({ // because other walls can be gone often
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

/*function getMoreInfoAboutPlayers(oldPlayers, players) {
    let newPlayers = [];
    let updatedPlayers = [];
    let removedPlayers = [];

    players.forEach(player => {
        let id = player.id;
        let oldPlayer = oldPlayers.find(x => x.id === id);

        let playerUpdated = oldPlayer && player.x !== oldPlayer.x || player.y !== oldPlayer.y;

        if (playerUpdated) { // oldPlayerCheck is already in playerUpdated
            updatedPlayers.push(player);
        } else if (!oldPlayer) {
            player.joinedAt = Date.now();
            newPlayers.push(player);
        }
    });

    oldPlayers.forEach(player => {
        let id = player.id;
        if (!players.find(x => x.id === id)) removedPlayers.push(player);
    });

    return [newPlayers, updatedPlayers, removedPlayers];
}*/
interface Options {
    reconnectTimeout?: number;
    autoMakeSocket?: boolean;
    log?: boolean;
    ws?: string;
    reconnect?: boolean
}

class Client extends EventEmitter.EventEmitter {
    public prevLevels: LevelObject[][] = [];
    public levelObjects: LevelObject[] = [];
    public options: Options = {};
    public players: any = {}; /* TODO do something like 
    interface Players {
        id: Player
    }
    */
    public gridSpace = 100;
    public playersOnLevel = 0;
    public usersOnline = 0;
    // @ts-ignore
    #ticks: number = 0;
    // @ts-ignore: webpack ignores 
    #clicksAndDrawingsUpdateInterval: number = window.setInterval(() => {
        this.clicks = updateClicksOrDrawings(this.clicks);
        this.drawings = updateClicksOrDrawings(this.drawings);
    }, 1);
    // #jobs: number = 0; // implementation for making bot system (drawText)
    public ws: WebSocket | undefined;
    public id: number = -1;
    public level: number = -1;
    public position: Point = { // should be unchangable
        x: 0,
        y: 0
    }
    public clicks: Click[] = [];
    public drawings: Drawing[] = [];
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
            this.log("Disabled option autoMakeSocket! If you want start bot, do it in your script!");
        }
    }
    private log(...args: any[]) {
        if (this.options.log) console.log(...args);
    }
    async makeSocket() {
        this.ws = new WebSocket(<string>this.options.ws);
        this.ws.binaryType = "arraybuffer";

        this.players = {};
        this.drawings = [];
        this.clicks = [];

        this.prevLevels = [];
        this.levelObjects = [];

        this.position = {
            x: 0,
            y: 0
        }
        this.#ticks = 0;
        //this.jobs = 0;
        this.level = -1;
        this.id = -1;
        this.gridSpace = 100;
        this.usersOnline = 0;
        this.playersOnLevel = 0;

        this.ws.onopen = (event: any) => this.emit("open", event);
        
        this.ws.onclose = (event: any) => {
            this.emit("close", event);
            if (this.options.reconnect) setTimeout(this.makeSocket, this.options.reconnectTimeout);
        }
        this.ws.onerror = (event: any) => this.emit("error", event);
        
        this.ws.onmessage = message => {
            const arrayBuffer = message.data;
            const len = arrayBuffer.length;
            const dv = new DataView(arrayBuffer);

            this.emit("message", arrayBuffer);

            switch (dv.getUint8(0)) { // idk why there is no 2 and 3
                case 0: { // got id
                    this.id = dv.getUint32(1, true);
                    this.emit("gotId");
                    break;
                }
                case 1: { // cursors updates draws and map changes
                    this.usersOnline = dv.getUint32(len - 4, true);

                    // cursors
                    let offset = 1;
                    let players: any = {};
                    let newPlayers: any = {};
                    let updatedPlayers: any = {};
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
                        let playerUpdated = oldPlayer && player.x !== oldPlayer.x || player.y !== oldPlayer.y;

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
                            clickedAt: Date.now(),
                            removedAt: Date.now() + renderSettings.clickRenderTime
                        });
                        offset += 2 + 2;
                    }

                    this.emit("newClicks", clicks);

                    this.clicks = this.clicks.concat(clicks);
                    // removed objects
                    let removedObjects: LevelObject[] = [];
                    count = dv.getUint16(offset, true);
                    offset += 2;

                    for (let i = 0; i < count; i++) {
                        removedObjects.push(
                            this.levelObjects.splice(
                                this.levelObjects.findIndex(x => x.id = dv.getUint32(offset, true)
                                ), 1)[0]
                        ); // or using concat
                        offset += 4;

                    }
                    this.emit("removedObjects", removedObjects);

                    // added objects
                    let a = parseObjects(dv, offset);
                    let addedObjects = <LevelObject[]>a.shift();
                    offset = <number>a.shift();
                    this.emit("addedObjects", addedObjects);

                    this.levelObjects = this.levelObjects.concat(addedObjects);

                    // drawings
                    count = dv.getUint16(offset, true);
                    let drawings: Drawing[] = [];

                    offset += 2;

                    for (let i = 0; i < count; i++) {
                        drawings.push({
                            x1: dv.getUint16(offset, true),
                            y1: dv.getUint16(offset + 2, true),
                            x2: dv.getUint16(offset + 2 + 2, true),
                            y2: dv.getUint16(offset + 2 + 2 + 2, true),
                            drawedAt: Date.now(),
                            removedAt: Date.now() + renderSettings.drawingRenderTime
                        });
                        offset += 2 + 2 + 2 + 2;
                    }
                    this.emit("newDrawings", drawings);

                    this.drawings = this.drawings.concat(drawings);

                    if (len >= offset + 4) {
                        this.#ticks = Math.max(this.#ticks, dv.getUint32(offset, true));
                        offset += 4;
                    } else if (len >= offset + 2) {
                        this.#ticks = Math.max(this.#ticks, dv.getUint16(offset, true));
                        offset += 2;
                    }
                    break;
                }
                case 4: {
                    this.levelObjects = <LevelObject[]>parseObjects(dv, 1).shift();

                    this.level = compareLevel(this.prevLevels, this.levelObjects);
                    break;
                }
                case 5: {
                    this.position.x = dv.getUint16(1, true);
                    this.position.y = dv.getUint16(3, true);

                    if (len >= 9) {
                        this.#ticks = Math.max(this.#ticks, dv.getUint32(5, true));
                    } else if (len >= 7) {
                        this.#ticks = Math.max(this.#ticks, dv.getUint16(5, true));
                    }
                    break;
                }
            }
        }
    }
    private isConnected(): boolean {
        // @ts-ignore
        return this.ws && this.ws.readyState !== WebSocket.OPEN;
    }
    move(x: number, y: number): boolean {
        if (!this.isConnected()) return false;
        let array = new ArrayBuffer(9);
        let dv = new DataView(array);
        dv.setUint8(0, 1);
        dv.setUint16(1, x, true);
        dv.setUint16(3, y, true);
        dv.setUint32(5, this.#ticks, true);
        // @ts-ignore
        this.ws.send(array);

        this.position.x = x;
        this.position.y = y;
        return true;
    }
    click(x: number, y: number): boolean {
        if (!this.isConnected()) return false;
        let array = new ArrayBuffer(9);
        let dv = new DataView(array);
        dv.setUint8(0, 2);
        dv.setUint16(1, x, true);
        dv.setUint16(3, y, true);
        dv.setUint32(5, this.#ticks, true);
        // @ts-ignore
        this.ws.send(array);

        this.position.x = x;
        this.position.y = y;
        return true;
    }
    draw(x1: number, y1: number, x2: number, y2: number): boolean {
        if (!this.isConnected()) return false;
        let array = new ArrayBuffer(9);
        let dv = new DataView(array);
        dv.setUint8(0, 3);
        dv.setUint16(1, x1, true);
        dv.setUint16(3, y1, true);
        dv.setUint16(5, x2, true);
        dv.setUint16(7, y2, true);
        // @ts-ignore
        this.ws.send(array);

        this.position.x = x2;
        this.position.y = y2;
        return true;
    }
}
