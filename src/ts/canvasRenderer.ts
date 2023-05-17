// asd@ts-nocheck

// import { eventSys, PublicAPI } from './global';
import { mapSize, rendererSettings } from './gameSettings';
import { settings, } from './main';
import { MousePositionInterface } from './types';
import Click from "./classes/Click";
import Line from "./classes/Line";
import { LevelObject, ObjectTypes } from './classes/LevelObjects';
import { canvas } from './elements';

// https://stackoverflow.com/questions/43638454/webpack-typescript-image-import?rq=1
import cursor_Image from "../img/cursor.png";
import { Players } from './classes/Player';
// import alphabet from './alphabet';

//export { renderState, renderLevelObjects, renderDrawings, renderClicks, renderHUD, renderPlayers, renderMainPlayer }

// TODO optimize

const PI2 = Math.PI * 2;

const { width, height, canvasWidth, canvasHeight } = mapSize;
const { scale, lineDecayAfter, lineRenderDuration, clickMaxRadius, clickRenderduration, maxRenderedClicks, maxRenderedLines, maxRenderedPlayers } = rendererSettings;





export const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
const cursorImage = new Image;
cursorImage.src = cursor_Image;


canvas.style.width = String(canvasWidth) + "px";
canvas.style.height = String(canvasHeight) + "px";

// it is used to fix retina screens and to make it more sharper when resized
function setLevelOfDetail() { // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#correcting_resolution_in_a_canvas

    // !!! remember canvas.width != canvas.style.width
    const pixelRatio = window.devicePixelRatio;

    canvas.width = canvasWidth * pixelRatio;
    canvas.height = canvasHeight * pixelRatio;


    ctx.scale(pixelRatio, pixelRatio);
}


window.addEventListener("resize", setLevelOfDetail);
setLevelOfDetail();

function clearCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function renderState(wsState: number | undefined) {
    let text = "";
    switch (wsState) {
        case WebSocket.CONNECTING: {
            text = "Connecting";
            break;
        }
        case WebSocket.CLOSED:
        case WebSocket.CLOSING: {
            text = "Lost connection to server";
            break;
        }
        default: {
            text = "Click to begin";
            break;
        }
    }
    ctx.fillStyle = "#000";
    ctx.font = "60px NovaSquare";
    ctx.fillText(text, (canvasWidth - ctx.measureText(text).width) / 2, canvasHeight / 2 + 15);
}

function renderLevelObjects(levelObjects: /*LevelObject*/any[]) { // obj.width causes error screw it
    levelObjects.forEach(obj => {
        let x = obj.x * scale;
        let y = obj.y * scale;
        ctx.globalAlpha = 1;

        if (obj.type === ObjectTypes.TEXT) {
            if (obj.isCentered) x -= ctx.measureText(obj.text).width;

            ctx.font = obj.size + "px NovaSquare";
            ctx.fillStyle = "#000";
            ctx.fillText(obj.content, x, y);
        } else if (obj.type === ObjectTypes.WALL) {
            ctx.fillStyle = obj.color;
            ctx.fillRect(x, y, obj.width * scale, obj.height * scale);
        } else if (obj.type === ObjectTypes.TELEPORT) {
            ctx.fillStyle = obj.isBad ? "#F00" : "#0F0";
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x, y, obj.width * scale, obj.height * scale);
            ctx.globalAlpha = 1;
        } else if (obj.type === ObjectTypes.CURSOR_COUNTER) {
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x, y, obj.width * scale, obj.height * scale);

            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#000";

            /* // overcomplicated
            let { width, height, count: text } = obj; 

            if(width < 20 && height < 20) {
                ctx.font = "30px NovaSquare";

                x += width - ctx.measureText(text).width/2;
                y += height + 10;
                
            } else { // 60 / 40 = 1.5
                let measureHeight = Math.round(1.5 * Math.hypot(width, height));
                ctx.font = measureHeight + "px NovaSquare";
                
                var measure = ctx.measureText(text);
                x += width - measure.width / 2;
                y += height + measureHeight / 2;
            }
            */
            // not multipling or dividing obj.width because it has no sense then

            let text = obj.count;
            if (obj.width < 40 && obj.height < 40) {
                ctx.font = "30px NovaSquare";

                x += obj.width - ctx.measureText(text).width / 2;
                y += obj.height + 10;

            } else {
                ctx.font = "60px NovaSquare";

                x += obj.width - ctx.measureText(text).width / 2;
                y += obj.height + 20;
            }

            ctx.fillText(text, x, y);
            ctx.globalAlpha = 1;
        } else if (obj.type === ObjectTypes.BUTTON) { // TODO: fix it later
            ctx.fillStyle = obj.color;
            ctx.fillRect(x, y, obj.width * scale, obj.height * scale);

            ctx.fillStyle = "#000";

            let text = obj.count;
            if (obj.width < 40 && obj.height < 40) {
                ctx.font = "30px NovaSquare";

                x += obj.width - ctx.measureText(text).width / 2;
                y += obj.height + 10;

            } else {
                ctx.font = "60px NovaSquare";

                x += obj.width - ctx.measureText(text).width / 2;
                y += obj.height + 20;
            }

            ctx.fillText(text, x, y);
        }
    });
}
function renderLines(lines: Line[], now = Date.now()) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    let i = -1;
    for(const { x1, y1, x2, y2, removeAt } of lines) {
        i++;

        const timeLeft = lineDecayAfter - (now - removeAt);

        if (timeLeft < 0) {
            lines.splice(i, 1);
            continue;
        }
        if(i > maxRenderedLines) {
            continue;
        }


        let degreeOfDecay = timeLeft / lineRenderDuration;

        // i could use Math.min(degreeOfDecay, 1) but it would be less readable

        if (degreeOfDecay > 1) degreeOfDecay = 1;
        
        
        ctx.globalAlpha = 0.3 * degreeOfDecay;
        ctx.beginPath();
        ctx.moveTo(x1 * scale - 0.5, y1 * scale - 0.5);
        ctx.lineTo(x2 * scale - 0.5, y2 * scale - 0.5);
        ctx.stroke();

        
    };
}
function renderClicks(clicks: Click[], now = Date.now()) {
    // ctx.strokeStyle = "#000";
    let i = -1;
    for (const {x, y, removeAt} of clicks) {
        i++;
        const timeLeft = (removeAt - now) / clickRenderduration;
        
        if (timeLeft < 0) {
            clicks.splice(i, 1);
            continue;
        }
        if(i > maxRenderedClicks) continue;

        const degreeOfDecay = timeLeft * 0.3;
        const radius = (1 - timeLeft) * clickMaxRadius;


        ctx.globalAlpha = degreeOfDecay;
        ctx.beginPath();
        ctx.arc(x * scale, y * scale, radius, 0, PI2);
        ctx.stroke();
        
    }
}

function drawText(text: string, x: number, y: number) {
    ctx.globalAlpha = 0.5;
    ctx.strokeText(text, x, y);
    ctx.globalAlpha = 1;
    ctx.fillText(text, x, y);
}
let _hue = 0;
const hue = () => _hue++ < 360 ? _hue : _hue = 0;

function renderHUD(onlinePlayers: number, playersOnLevel: number, actualLevel: number, FPS: number) {
    ctx.font = "12px NovaSquare";
    //ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.5;

    ctx.fillStyle = `hsl(${hue()}, 100%, 50%)`

    drawText("Client made by felpcereti#9857", 10, 12 * 1.3); // code gets optimized by webpack

    ctx.fillStyle = "#fff";

    drawText(FPS + " FPS", 10, 12 * 2 * 1.3);

    let text = "Use shift+click to draw";
    if (playersOnLevel > 100) text = "Area too full, not all cursors are shown";
    else if (playersOnLevel > 30) text = "Area too full, drawing is disabled";

    let y = canvasHeight - 10;
    drawText(text, 10, y);

    text = onlinePlayers + " players online";
    let measure = ctx.measureText(text).width;
    let x = canvasWidth - measure - 10;

    drawText(text, x, y);

    text = playersOnLevel + " players on level";
    measure = ctx.measureText(text).width;
    x = canvasWidth - measure - 10;
    y -= 12 * 1.5;

    drawText(text, x, y);

    text = "Actual level: " + actualLevel;
    measure = ctx.measureText(text).width;
    x = canvasWidth - measure - 10;
    y -= 12 * 1.5;

    drawText(text, x, y);
}

function renderPlayers(players: Players) {

    ctx.font = "12px NovaSquare";
    ctx.fillStyle = "#000";

    let i = 0;
    for (const id in players) {
        if (i > maxRenderedPlayers) break;

        let player = players[id];
        let x = player.x * scale;
        let y = player.y * scale;
        ctx.drawImage(cursorImage, x - 4, y - 4); // 4 is shadow
        ctx.fillText(id, x + 16, y + 24);
        i++;
    }
}

function renderMainPlayer({ canvasX: px, canvasY: py }: MousePositionInterface, { canvasX: mx, canvasY: my }: MousePositionInterface) { // trunc is as fast as | 0

    if (document.pointerLockElement !== canvas && (px !== mx || py !== my)) { // TODO: change that
        ctx.fillStyle = "#F00";
        ctx.globalAlpha = 0.2;

        ctx.beginPath();
        ctx.arc(mx + 2, my + 8, 20, 0, PI2);
        ctx.fill();

        ctx.globalAlpha = 0.5;
        ctx.drawImage(cursorImage, mx - 4, my - 4);
    }
    // draws The Halo
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#FF0";

    ctx.beginPath();
    ctx.arc(px + 2, py + 8, 20, 0, PI2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.drawImage(cursorImage, px - 4, py - 4);
}


export function renderDoNotEmbedSite() {
    ctx.fillStyle = "#000";
    ctx.font = "35px NovaSquare";
    ctx.fillText("Please do not embed our website, thank you.", 400 - ctx.measureText("Please do not embed our website, thank you.").width / 2, 300);
    ctx.font = "16px NovaSquare";
    ctx.fillText("Play the game on http://cursors.io/", 400 - ctx.measureText("Play the game on http://cursors.io/").width / 2, 330);
    // @ts-ignore
    //window.top.location = "http://cursors.io";
    throw "Please do not embed our website, thank you.";
}


/*
0. clear
1?: render state
1. level objects
3. drawings
4. clicks
5. HUD
6. players
7. main cursor
*/
export default function RenderFrame(
    wsState: number | undefined,
    levelObjects: LevelObject[],
    drawings: Line[],
    clicks: Click[],
    onlinePlayers: number,
    playersOnLevel: number,
    actualLevel: number,
    FPS: number,
    players: any,
    playerPos: MousePositionInterface,
    mousePos: MousePositionInterface) {
    clearCanvas();

    if (wsState !== WebSocket.OPEN) return renderState(wsState);

    renderLevelObjects(levelObjects);

    if (!settings.disableDrawings) renderLines(drawings); // TODO: 
    renderClicks(clicks);

    renderHUD(onlinePlayers, playersOnLevel, actualLevel, FPS);
    renderPlayers(players);
    renderMainPlayer(playerPos, mousePos);
}