import {
    LevelObject,
    TextObject,
    DebugObject,
    WallObject,
    TeleportObject,
    CursorCounterObject,
    ButtonObject,
    ObjectTypes
} from "../classes/LevelObjects";
import Player, { Players } from "../classes/Player";


// 
// *





export function parsePlayers(dv: DataView, offset: number, players: Players, ignoreId: number,now: number) {
    const count = dv.getUint16(offset, true);
    offset += 2;


    const parsedPlayers: Players = {}; // players created from the packet
    
    const updatedPlayers: Players = {}; // checks if the player existed before in "players" variable
    const movedPlayers: Players = {}; // if player did exist and their position has changed they go here
    const newPlayers: Players = {}; // if they didn't exist they go here
    
    
    
    for (let i = 0; i < count; i++) {
        const id = dv.getUint32(offset, true);
        const x = dv.getUint16(offset + 4, true);
        const y = dv.getUint16(offset + 6, true);
        offset += 8;
        if(id === ignoreId) continue;

        const parsedPlayer = parsedPlayers[id] = new Player(id, x, y);

        const player = players[id];

        if (player) { // player got updated
            updatedPlayers[id] = player;

            if(player.x !== parsedPlayer.x || player.y !== parsedPlayer.y) {
                movedPlayers[id] = player;
            }

            player.setPosition(parsedPlayer.x, parsedPlayer.y);

        } else {
            parsedPlayer.joinedAt = now;

            newPlayers[id] = players[id] = parsedPlayer;
        }
    }

    const removedPlayers: Players = {}; // if the player was in the players variable but he doesn't exist in the updatedPlayers variable he is put here

    for(const id in players) {
        if(!parsedPlayers[id]) {
            removedPlayers[id] = players[id];
            delete players[id];
        }
    }


    return {
        parsedPlayers,
        updatedPlayers,
        movedPlayers,
        newPlayers,
        removedPlayers,

        count,

        offset
    }
}

function parseColor(colorHex: number) {
    let color = colorHex.toString(16);

    while (color.length < 6) color = "0" + color;

    return '#' + color;
}



// : {levelObjects: LevelObject[], offset:number}
export function parseObjects(dv: DataView, offset: number) {
    let count = dv.getUint16(offset, true);
    let levelObjects: LevelObject[] = [];

    offset += 2;
    for (let i = 0; i < count; ++i) {
        const id = dv.getUint32(offset, true);

        offset += 4;

        const type = dv.getUint8(offset);
        offset++

        let obj: LevelObject;
        switch (type) {
            case ObjectTypes.TEXT: {
                obj = new TextObject;
                obj.x = dv.getUint16(offset, true);
                obj.y = dv.getUint16(offset + 2, true);

                obj.fontSize = dv.getUint8(offset + 4);
                obj.isCentered = !!dv.getUint8(offset + 5);
                offset += 6; // there should be 5

                obj.content = "";
                let char: number = 0;
                while ((char = dv.getUint8(offset++)) !== 0) {
                    obj.content += String.fromCharCode(char);
                }
                // offset++;
                break;
            }
            case ObjectTypes.WALL: {
                obj = new WallObject;
                obj.x = dv.getUint16(offset, true);
                obj.y = dv.getUint16(offset + 2, true);
                obj.width = dv.getUint16(offset + 4, true);
                obj.height = dv.getUint16(offset + 6, true);

                obj.color = parseColor(dv.getUint32(offset + 8, true));

                offset += 2 + 2 + 2 + 2 + 4;
                break;
            }
            case ObjectTypes.TELEPORT: {
                obj = new TeleportObject;
                obj.x = dv.getUint16(offset, true);
                obj.y = dv.getUint16(offset + 2, true);
                obj.width = dv.getUint16(offset + 4, true);
                obj.height = dv.getUint16(offset + 6, true);

                obj.isBad = !!dv.getUint8(offset + 8);
                offset += 2 + 2 + 2 + 2 + 1;
                break;
            }
            case ObjectTypes.CURSOR_COUNTER: {
                obj = new CursorCounterObject;
                obj.x = dv.getUint16(offset, true);
                obj.y = dv.getUint16(offset + 2, true);
                obj.width = dv.getUint16(offset + 4, true);
                obj.height = dv.getUint16(offset + 6, true);

                obj.count = dv.getUint16(offset + 8, true);
                obj.color = parseColor(dv.getUint32(offset + 10, true));

                offset += 2 + 2 + 2 + 2 + 2 + 4;
                break;
            }
            case ObjectTypes.BUTTON: {
                obj = new ButtonObject;
                obj.x = dv.getUint16(offset, true);
                obj.y = dv.getUint16(offset + 2, true);
                obj.width = dv.getUint16(offset + 4, true);
                obj.height = dv.getUint16(offset + 6, true);

                obj.count = dv.getUint16(offset + 8, true);
                obj.color = parseColor(dv.getUint32(offset + 10, true));

                //obj.lastClickAt = 0;
                offset += 2 + 2 + 2 + 2 + 2 + 4;
                break;
            }
            case ObjectTypes.DEBUG_OBJECT: {
                console.warn("Encountered a debug object. This shouldn't happen...");
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