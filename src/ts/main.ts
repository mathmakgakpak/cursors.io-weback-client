import { eventSys, PublicAPI } from './global';
import { Settings } from './Settings';
import { mousePos } from './mouse';
import { canvas } from './elements';
import { Client } from './Client';
import { getCursorsServer} from './utils';
import log from './sexylogs';
import './requires';
import './canvasRenderer';


//import 'buffer';

// @ts-ignore
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

export const settings = PublicAPI.settings = new Settings;

// @ts-ignore
log.info("Version: " + VERSION);
// @ts-ignore
log.info("Build: " + BUILD);

export const mainPlayer = {
    client: new Client({
        autoMakeSocket: false
    })
    /*x: 0,
    y: 0,

    get canvasX() {
        return this.x * 2;
    },
    get canvasY() {
        return this.y * 2;
    }*/
};

async function connect() {
    mainPlayer.client.options.ws = await getCursorsServer();
    await mainPlayer.client.makeSocket();
}

