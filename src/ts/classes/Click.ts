import { rendererSettings } from "../canvasRenderer";

export default class Click {
    public removeAt: number;
    constructor(public x: number, public y: number,
        public clickedAt: number
    ) {
        this.removeAt = clickedAt + rendererSettings.clickRenderTime;
    }
    isRemoved(now: number = Date.now()) {
        return this.removeAt < now;
    }
}