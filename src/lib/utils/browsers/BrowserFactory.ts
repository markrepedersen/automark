import {Browser, BrowserOptions, BrowserTypes} from "./browser";
import {Chrome} from "./chrome";
import {Edge} from "./edge";

export namespace BrowserFactory {
    export function create(type: BrowserTypes, options?: BrowserOptions): Browser {
        switch (type) {
            case 'chrome':
                return new Chrome(options);
            case 'edge':
                return new Edge(options);
        }
    }
}
