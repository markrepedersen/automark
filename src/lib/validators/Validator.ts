import {Browser} from "../utils";

export interface Validatable<T extends Validator> {
    new(browser: Browser): T;
}

/**
 * Validator that can be used with 'validate' decorator.
 */
export abstract class Validator {
    protected browser: Browser;

    public constructor(browser: Browser) {
        this.browser = browser;
    }

    abstract async validate(stack: any): Promise<void>;
}
