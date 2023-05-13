// export interface LevelObject {
//     id: number;
//     type: objectTypes;
//     x: number;
//     y: number;
//     // ^ all

//     width?: number;
//     height?: number;
//     // ^ wall, exit/red thing, hover, button

//     color: string;
//     // ^ wall, hover, button

//     isBad?: boolean;
//     // ^ exit/red thing

//     size?: number;
//     isCentered?: boolean;
//     content?: string;
//     // ^ text
    
//     count?: number;
//     // ^ hover, button
// }


export enum ObjectTypes {
    TEXT,
    WALL,
    TELEPORT,
    CURSOR_COUNTER,
    BUTTON,
    DEBUG_OBJECT = 0xFF
}



export class LevelObjectStub {
    id: number = 0;
    x: number = 0;
    y: number = 0;
}

export class TextObject extends LevelObjectStub {
    readonly type = ObjectTypes.TEXT;
    fontSize: number = 0;
    isCentered: boolean = false;
    content: string = "";

}

export class WallObject extends LevelObjectStub {
    readonly type = ObjectTypes.WALL;
    width: number = 0;
    height: number = 0;

    color: string = "#000000";

}
export class TeleportObject extends LevelObjectStub {
    readonly type = ObjectTypes.TELEPORT;
    width: number = 0;
    height: number = 0;

    isBad: boolean = false;

}

export class CursorCounterObject extends LevelObjectStub {
    readonly type = ObjectTypes.CURSOR_COUNTER;
    width: number = 0;
    height: number = 0;
    
    color: string = "#000000";
    count: number = 0;

}
export class ButtonObject extends LevelObjectStub {
    readonly type = ObjectTypes.BUTTON;
    width: number = 0;
    height: number = 0;

    color: string = "#000000";
    count: number = 0;
    
    lastClickAt: number = 0; // TO-DO set this somewhere

}
export class DebugObject {
    readonly type = ObjectTypes.DEBUG_OBJECT;
    id: number = 0;
}

export type LevelObject = TextObject | WallObject | TeleportObject | CursorCounterObject | ButtonObject | DebugObject;