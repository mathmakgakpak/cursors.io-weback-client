

export const rendererSettings = {
    maxRenderedPlayers: 100,
    
    maxRenderedLines: 4000,
    lineRenderDuration: 1000,
    lineDecayAfter: 10_000,

    clickRenderduration: 500,
    clickMaxRadius: 25,
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