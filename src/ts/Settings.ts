import { noCursorLock, disableDrawings, disablePlayers } from './elements';

export class Settings { // this is shit
    constructor() {
        noCursorLock.checked = window.localStorage.noCursorLock === "true";
        disableDrawings.checked = window.localStorage.disableDrawings === "true";
        disablePlayers.checked = window.localStorage.disablePlayers === "true";

        window.addEventListener("beforeunload", () => {
            window.localStorage.noCursorLock = this.noCursorLock;
            window.localStorage.disableDrawings = this.disableDrawings;
            window.localStorage.disablePlayers = this.disablePlayers;
         });

    }
    get noCursorLock() {
        return noCursorLock.checked;
    }
    set noCursorLock(v) {
        noCursorLock.checked = v;
    }
    get disableDrawings() {
        return disableDrawings.checked;
    }
    set disableDrawings(v) {
        disableDrawings.checked = v;
    }
    get disablePlayers() {
        return disablePlayers.checked;
    }
    set disablePlayers(v) {
        disablePlayers.checked = v;
    }
}