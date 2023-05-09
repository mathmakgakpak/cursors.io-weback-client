import { eventSys, PublicAPI } from './global';
import { Settings } from './Settings';
import mouseEvents, { mousePos } from './mouse';
import { canvas } from './elements';
import { Client } from './Client';
import { getCursorsServer, unStuck, getPointerLockElement } from './utils';
import log from './sexylogs';
import r, { renderDoNotEmbedSite } from './canvasRenderer';
import { PointBob } from './types';
import browserRequire from './browserRequire';

// https://github.com/qiao/PathFinding.js you can use it for making cheats but you will need to rewrite some things in client

// @ts-ignore
window.require = PublicAPI.require = browserRequire;

// @ts-ignore
PublicAPI.srcFiles = process.env.SRC_FILES;
// @ts-ignore
PublicAPI.build = process.env.BUILD;
// @ts-ignore
PublicAPI.version = process.env.VERSION;
// @ts-ignore
PublicAPI.productionBuild = process.env.PRODUCTION_BUILD;


// @ts-ignore
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

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
    // websocket proxy search on github
    client.options.ws = /*`ws://localhost:8080/?target=${*/await getCursorsServer()/*}&origin=http://cursors.io`*/;
    gettingIp = false;

    client.makeSocket();
}

// @ts-ignore
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
    r(client.ws?.readyState, client.levelObjects, client.drawings, client.clicks, client.usersOnline, client.playersOnLevel, client.level, FPS, client.players, client.position, mousePos); // oh shit this is so long
    _FPS++;
    window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);

