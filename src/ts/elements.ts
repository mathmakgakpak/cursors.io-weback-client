export const canvas = <HTMLCanvasElement>document.getElementById("canvas");
// @ts-ignore
canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

export const noCursorLock = <HTMLInputElement>document.getElementById("noCursorLock");
export const disableDrawings = <HTMLInputElement>document.getElementById("noDrawings");
export const disablePlayers = <HTMLInputElement>document.getElementById("disablePlayers");