export interface mapSizeInterface {
	width: number;
	height: number;
	realWidth: number;
	realHeight: number;
}

export const mapSize: mapSizeInterface = {
	realWidth: 400,
	realHeight: 300,
	width: 0,
	height: 0
}
mapSize.width = mapSize.realWidth * 2;
mapSize.height = mapSize.realHeight * 2;

export const defaultURL = "wss://cursors.uvias.com";