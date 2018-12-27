import {Browser, BrowserOptions} from "./browser";

export class Edge extends Browser {
    public constructor(options?: BrowserOptions) {
        super('edge', options);
    }
}