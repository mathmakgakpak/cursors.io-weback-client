import { canvas } from './elements';
import { mapSize } from './gameSettings'
import EventEmitter from 'events';
import { Point, MousePositionInterface } from './types';
import { rendererSettings } from "./gameSettings";
const scale = rendererSettings.scale;

const mouseEvents = new EventEmitter();
const { canvasWidth, canvasHeight } = mapSize;
export default mouseEvents;
export const mousePosition: MousePositionInterface = {
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0
};


function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

const trunc = Math.trunc;
function setPositionX(x: number) {
    mousePosition.canvasX = x;
    mousePosition.x = trunc(x / scale);
}

function setPositionY(y: number) {
    mousePosition.canvasY = y;
    mousePosition.y = trunc(y / scale);
}

canvas.addEventListener("mousemove", event => {

    const isLockedCanvas = document.pointerLockElement === canvas;
    if(isLockedCanvas) { 
        let canvasX = mousePosition.canvasX + event.movementX;
        let canvasY = mousePosition.canvasY + event.movementY;

        if(canvasX >= canvasWidth) canvasX = canvasWidth - 1;
        else if(canvasX < 0) canvasX = 0;

        setPositionX(canvasX)

        if(canvasY >= canvasHeight) canvasY = canvasHeight - 1;
        else if(canvasY < 0) canvasY = 0;

        setPositionY(canvasY)

    } else {
        const pos = getMousePos(canvas, event);

        setPositionX(pos.x);
        setPositionY(pos.y);
    }

    mouseEvents.emit("mousemove", mousePosition, isLockedCanvas, event);
});


canvas.addEventListener("mousedown", event => {
    mouseEvents.emit("mousedown", mousePosition, event);
});

canvas.addEventListener("mouseup", event => {
    mouseEvents.emit("mouseup", mousePosition, event);
});
