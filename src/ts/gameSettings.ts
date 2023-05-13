import { canvas } from "./elements";

export const rendererSettings = {
    maxRenderedPlayers: 100,
    maxRenderedDrawings: 30,

    lineRenderDuration: 1000,
    clickRenderduration: 1000,

    clickMaxRadius: 50,
    maxRenderedClicks: 30,
	
	scale: 2
}

export const mapSize = {
	width: 400,
	height: 300,
	canvasWidth: 0,
	canvasHeight: 0,

}
mapSize.canvasWidth = mapSize.width * rendererSettings.scale;
mapSize.canvasHeight = mapSize.height * rendererSettings.scale;

Object.freeze(rendererSettings);
Object.freeze(mapSize);


export const defaultURL = "wss://cursors.uvias.com";