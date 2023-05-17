import { rendererSettings } from "../gameSettings";
const lineRenderDuration = rendererSettings.lineRenderDuration;

export default class Line {
    public removeAt: number;
    constructor(public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public drewAt: number
    ) {
        this.removeAt = drewAt + lineRenderDuration;
    }
    // isRemoved(now: number = Date.now()) { // it's not how it works
    //     return this.removeAt < now;
    // }
}