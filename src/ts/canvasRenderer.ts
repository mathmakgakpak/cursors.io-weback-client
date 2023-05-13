// asd@ts-nocheck

// import { eventSys, PublicAPI } from './global';
import { mapSize } from './gameSettings';
import { settings } from './main';
import { getPointerLockElement } from './utils';
import { Line, PointBob } from './types';
import Click from "./classes/Click";
import { LevelObject } from './classes/LevelObjects';
import { canvas } from './elements';

// https://stackoverflow.com/questions/43638454/webpack-typescript-image-import?rq=1
import cursor_Image from "../img/cursor.png";
import { Players } from './classes/Player';
// import alphabet from './alphabet';

//export { renderState, renderLevelObjects, renderDrawings, renderClicks, renderHUD, renderPlayers, renderMainPlayer }

// TODO optimize

const PI2 = Math.PI * 2;

const { width, realWidth, height, realHeight } = mapSize;



export const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
const cursorImage = new Image;
cursorImage.src = cursor_Image;

export const rendererSettings = {
    maxRenderedPlayers: 100,
    maxRenderedDrawings: 30,
    drawingRenderTime: 10000,
    clickRenderTime: 1000,
    clickMaxRadius: 50,
    maxRenderedClicks: 30
};

// setting scale

const scale = window.devicePixelRatio;
canvas.width = width * scale;
canvas.height = height * scale;
ctx.scale(scale, scale);

function clearCanvas() {
    ctx.clearRect(0, 0, width, height);
}

function renderState(wsState: number | undefined) {
    let text = "";
    switch(wsState) {
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
    ctx.fillText(text, (width - ctx.measureText(text).width)/2, height / 2 + 15);
}

function renderLevelObjects(levelObjects: /*LevelObject*/any[]) { // obj.width causes error screw it
    levelObjects.forEach(obj => {
        let x = obj.x * 2;
        let y = obj.y * 2;
        ctx.globalAlpha = 1;

        if(obj.type === 0) { // text
            if(obj.isCentered) x -= ctx.measureText(obj.text).width;

            ctx.font = obj.size + "px NovaSquare";
            ctx.fillStyle = "#000";
            ctx.fillText(obj.content, x, y);
        } else if(obj.type === 1) { // wall
            ctx.fillStyle = obj.color;
            ctx.fillRect(x, y, obj.width * 2, obj.height * 2);
        } else if(obj.type === 2) { // exit/red thing
            ctx.fillStyle = obj.isBad ? "#F00" : "#0F0";
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x, y, obj.width * 2, obj.height * 2);
            ctx.globalAlpha = 1;
        } else if(obj.type === 3) { // hover
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x, y, obj.width * 2, obj.height * 2);

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
            if(obj.width < 40 && obj.height < 40) {
                ctx.font = "30px NovaSquare";

                x += obj.width - ctx.measureText(text).width/2;
                y += obj.height + 10;
                
            } else { 
                ctx.font = "60px NovaSquare";

                x += obj.width - ctx.measureText(text).width/2;
                y += obj.height + 20;
            }

            ctx.fillText(text, x, y);
            ctx.globalAlpha = 1;
        } else if(obj.type === 4) { // button TO-DO fix it later
            ctx.fillStyle = obj.color;
            ctx.fillRect(x, y, obj.width * 2, obj.height * 2);

            ctx.fillStyle = "#000";

            let text = obj.count;
            if(obj.width < 40 && obj.height < 40) {
                ctx.font = "30px NovaSquare";

                x += obj.width - ctx.measureText(text).width/2;
                y += obj.height + 10;
                
            } else { 
                ctx.font = "60px NovaSquare";

                x += obj.width - ctx.measureText(text).width/2;
                y += obj.height + 20;
            }

            ctx.fillText(text, x, y);
        }
    });
}
function renderDrawings(lines: Line[]) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    let now = Date.now();
    lines.forEach((line, i) => {
        const degreeOfDecay = (line.removeAt - now) / rendererSettings.drawingRenderTime;

        if(degreeOfDecay < 0) {
            lines.splice(i, 1);
            return;
        }

        ctx.globalAlpha = 0.3 * degreeOfDecay;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.x2);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    });
}
function renderClicks(clicks: Click[]) {
    // ctx.strokeStyle = "#000";
    let now = Date.now();
    clicks.forEach((click, i) => {
        let radius = (click.removeAt - now) / rendererSettings.clickRenderTime;
        if(radius < 0) {
            clicks.splice(i, 1);
            return;
        }
        let stage = (1 - 2 * radius) * 0.3;
        radius *= 50;

        ctx.globalAlpha = stage;
        ctx.beginPath();
        ctx.arc(click.x, click.y, radius, 0, PI2);
        ctx.stroke();
    })
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
    if(playersOnLevel > 100) text = "Area too full, not all cursors are shown";
    else if(playersOnLevel > 30) text = "Area too full, drawing is disabled";
    
    let y = height - 10;
    drawText(text, 10, y);

    text = onlinePlayers + " players online";
    let measure = ctx.measureText(text).width;
    let x = width - measure - 10;

    drawText(text, x, y);

    text = playersOnLevel + " players on level";
    measure = ctx.measureText(text).width;
    x = width - measure - 10;
    y -= 12 * 1.5;

    drawText(text, x, y);

    text = "Actual level: " + actualLevel;
    measure = ctx.measureText(text).width;
    x = width - measure - 10;
    y -= 12 * 1.5;

    drawText(text, x, y);
}

function renderPlayers(players: Players) {
    
    ctx.font = "12px NovaSquare";
    ctx.fillStyle = "#000";

    let i = 0;
    for(const id in players) {
        if(i > rendererSettings.maxRenderedPlayers) break;
        let player = players[id];
        let x = player.x * 2;
        let y = player.y * 2;
        ctx.drawImage(cursorImage, x - 4, y - 4); // 4 is shadow
        ctx.fillText(id, x + 16, y + 24);
        i++;
    }
}

function renderMainPlayer({canvasX: px, canvasY: py}: PointBob, {canvasX: mx, canvasY: my}: PointBob) { // trunc is as fast as | 0
    px *= 2;
    py *= 2;

    if(getPointerLockElement() !== canvas) { // change that
        if(px !== mx || py !== my) {
            ctx.fillStyle = "#F00";
            ctx.globalAlpha = 0.2;
            
            ctx.beginPath();
            ctx.arc(mx + 2, my + 8, 20, 0, PI2);
            ctx.fill();

            ctx.globalAlpha = 0.5;
            ctx.drawImage(cursorImage, mx - 4, my - 4);
        }
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#FF0";
        
        ctx.beginPath();
        ctx.arc(px + 2, py + 8, 20, 0, PI2);
        ctx.fill();
    }

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
     playerPos: PointBob,
     mousePos: PointBob) {
    clearCanvas();
    
    if(wsState !== WebSocket.OPEN) return renderState(wsState);
    
    renderLevelObjects(levelObjects);

    if(!settings.disableDrawings) renderDrawings(drawings);
    renderClicks(clicks);
    
    renderHUD(onlinePlayers, playersOnLevel, actualLevel, FPS);
    renderPlayers(players);
    renderMainPlayer(playerPos, mousePos);
}