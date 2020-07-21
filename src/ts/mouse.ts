import { canvas } from './elements';
import { getPointerLockElement } from './utils'
import { mapSize } from './gameSettings'
import { EventEmitter } from 'events';

const mouseEvents = new EventEmitter();
const { width, height } = mapSize;
export default mouseEvents;
export const mousePos = {
    x: 0,
    y: 0
};


function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener("mousemove", event => {
    if(getPointerLockElement() === canvas) { 
        // @ts-ignore
        mousePos.x += event.movementX || event.mozMovementX || event.webkitMovementX;
        // @ts-ignore
        mousePos.y += event.movementY || event.mozMovementY || event.webkitMovementY;
    
        if(mousePos.x > width) mousePos.x = width;
        else if(mousePos.x < 0) mousePos.x = 0;
        if(mousePos.y > height) mousePos.y = height;
        else if(mousePos.y < 0) mousePos.y = 0;
    } else {
        let pos = getMousePos(canvas, event);
        mousePos.x = pos.x;
        mousePos.y = pos.y;
    }

    mouseEvents.emit("mousemove", mousePos, event);
});

canvas.addEventListener("mousedown", event => mouseEvents.emit("mousedown", mousePos, event));
canvas.addEventListener("mouseup", event => mouseEvents.emit("mouseup", mousePos, event));
