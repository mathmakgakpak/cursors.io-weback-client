export const canvas = <HTMLCanvasElement>document.getElementById("canvas");

canvas.addEventListener('contextmenu', event => event.preventDefault()); // bob


export const noCursorLock = <HTMLInputElement>document.getElementById("noCursorLock");
export const disableDrawings = <HTMLInputElement>document.getElementById("noDrawings");
export const disablePlayers = <HTMLInputElement>document.getElementById("disablePlayers");
