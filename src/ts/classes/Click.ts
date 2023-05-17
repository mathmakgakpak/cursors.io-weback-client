import { rendererSettings } from "../gameSettings";
const clickRenderTime = rendererSettings.clickRenderduration

export default class Click {
    public removeAt: number;
    constructor(public x: number, public y: number,
        public clickedAt: number
    ) {
        this.removeAt = clickedAt + clickRenderTime;
    }
}