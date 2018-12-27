import {Browser, BrowserOptions} from "./browser";

export class Chrome extends Browser {
    public constructor(options?: BrowserOptions) {
        super('chrome', options);
    }
}