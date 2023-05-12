import { canvas } from './elements';
import { getPointerLockElement } from './utils'
import { mapSize } from './gameSettings'
import EventEmitter from 'events';
import { PointBob } from './types';

const mouseEvents = new EventEmitter();
const { width, height } = mapSize;
export default mouseEvents;
export const mousePos: PointBob = {
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0
};


function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

const round = Math.round;
function setPositionX(x: number) {
    mousePos.canvasX = x;
    mousePos.x = round(x/2);
}

function setPositionY(y: number) {
    mousePos.canvasY = y;
    mousePos.y = round(y/2);
}

canvas.addEventListener("mousemove", event => {
    // mousePos.oldX = mousePos.x;
    // mousePos.oldY = mousePos.y;

    if(getPointerLockElement() === canvas) { 
        mousePos.canvasX += event.movementX;
        mousePos.canvasY += event.movementY;
    
        if(mousePos.canvasX > width) setPositionX(width);
        else if(mousePos.canvasX < 0) setPositionX(0);
        
        if(mousePos.canvasY > height) setPositionY(height);
        else if(mousePos.canvasY < 0) setPositionY(0);
    } else {
        const pos = getMousePos(canvas, event);

        setPositionX(pos.x);
        setPositionY(pos.y);
    }

    

    mouseEvents.emit("mousemove", mousePos, event);
});


canvas.addEventListener("mousedown", event => {mouseEvents.emit("mousedown", mousePos, event)});
canvas.addEventListener("mouseup", event => {mouseEvents.emit("mouseup", mousePos, event)});
