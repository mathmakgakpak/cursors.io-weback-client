import { eventSys, PublicAPI } from './global';
import { Settings } from './Settings';
import mouseEvents, { mousePos } from './mouse';
import { canvas } from './elements';
import { Client } from './Networking/Client';
import { getCursorsServer, unStuck, getPointerLockElement } from './utils';
import log from './sexylogs';
import RenderFrame, { renderDoNotEmbedSite } from './canvasRenderer';
import { PointBob } from './types';

import "../style.css";

// https://github.com/qiao/PathFinding.js you can use it for making cheats but you will need to rewrite some things in client



// document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

export const settings = PublicAPI.settings = new Settings();


log.info("Version: " + PublicAPI.version);

log.info("Build: " + PublicAPI.build);

export const client = new Client({
    autoMakeSocket: false
});

let gettingIp = false;
async function connect() {
    if(gettingIp) return;
    gettingIp = true;
    // search websocket proxy on github
    client.options.ws = /*`ws://localhost:8080/?target=${*/await getCursorsServer()/*}&origin=http://cursors.io`*/;
    gettingIp = false;

    client.makeSocket();
}


mouseEvents.on("mousedown", (mousePos: PointBob, event: MouseEvent) => {
    if(gettingIp) return;
    if(!client.ws) return connect();
    if(client.ws.readyState !== 1) return;
    if(!settings.noCursorLock && getPointerLockElement() !== canvas) canvas.requestPointerLock();

    if((event.ctrlKey || event.shiftKey) && !settings.disableDrawings) {
        let unstucked = unStuck(client.position, mousePos, client.solidMap);

        client.draw(client.position.x, client.position.y, unstucked.x, unstucked.y);
    } else if(client.position.x === mousePos.x && client.position.y === mousePos.y) {
        client.click();
    }

    return;
});

mouseEvents.on("mousemove", (mousePos: PointBob, event: MouseEvent) => {
    if(client.ws?.readyState !== 1) return;
    //console.log(client.position, mousePos);
    let unStucked = unStuck(client.position, mousePos, client.solidMap);
    //console.log(unStucked)
    client.move(unStucked.x, unStucked.y);
});

let _FPS = 0;
let FPS = 30;
window.setInterval(() => {
    FPS = _FPS;
    _FPS = 0;
}, 1000);

function render() {
    try {
        RenderFrame(client.ws?.readyState, client.levelObjects, client.drawings, client.clicks, client.usersOnline, client.playersOnLevel, client.level, FPS, client.players, client.position, mousePos);
    _FPS++;
    } catch(e) {
        log.error("Rendering error: ", e);
    }
    

    window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);

